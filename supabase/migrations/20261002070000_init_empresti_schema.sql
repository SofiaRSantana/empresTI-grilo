CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Profile/user mapping (Supabase Auth user id lives in auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- 3) Equipment catalog
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('notebook', 'monitor', 'camera', 'accessory')),
  status TEXT NOT NULL CHECK (status IN ('available', 'borrowed', 'maintenance')) DEFAULT 'available',
  location TEXT NOT NULL,
  patrimony_code TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, patrimony_code)
);

-- 4) Loans and returns
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE RESTRICT,
  borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('active', 'returned', 'overdue')) DEFAULT 'active',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (returned_at IS NULL OR returned_at >= requested_at)
);

-- 5) Audit trail for operations and compliance
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX idx_equipment_tenant_status ON public.equipment(tenant_id, status);
CREATE INDEX idx_loans_tenant_status ON public.loans(tenant_id, status);
CREATE INDEX idx_loans_borrower ON public.loans(tenant_id, borrower_id, status);
CREATE INDEX idx_loans_equipment ON public.loans(tenant_id, equipment_id);
CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id, created_at DESC);

-- Helper functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.enforce_loan_rules()
RETURNS TRIGGER AS $$
DECLARE
  equipment_status TEXT;
  active_loans_count INTEGER;
  overdue_exists BOOLEAN;
BEGIN
  SELECT e.status INTO equipment_status
  FROM public.equipment e
  WHERE e.id = NEW.equipment_id
    AND e.tenant_id = NEW.tenant_id;

  IF equipment_status IS NULL THEN
    RAISE EXCEPTION 'Equipamento não encontrado no tenant informado.';
  END IF;

  IF equipment_status = 'maintenance' THEN
    RAISE EXCEPTION 'Equipamento em manutenção não pode ser emprestado.';
  END IF;

  IF equipment_status = 'borrowed' THEN
    RAISE EXCEPTION 'Equipamento já está emprestado.';
  END IF;

  SELECT COUNT(*) INTO active_loans_count
  FROM public.loans
  WHERE tenant_id = NEW.tenant_id
    AND borrower_id = NEW.borrower_id
    AND status IN ('active', 'overdue');

  IF active_loans_count >= 3 THEN
    RAISE EXCEPTION 'Usuário já atingiu o limite de 3 itens emprestados.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.loans
    WHERE tenant_id = NEW.tenant_id
      AND borrower_id = NEW.borrower_id
      AND status = 'overdue'
      AND due_at < now()
  ) INTO overdue_exists;

  IF overdue_exists THEN
    RAISE EXCEPTION 'Usuário com item em atraso não pode pegar outro equipamento.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_equipment_status_on_loan()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.equipment
       SET status = 'borrowed',
           updated_at = now()
     WHERE id = NEW.equipment_id
       AND tenant_id = NEW.tenant_id;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.returned_at IS NOT NULL AND OLD.returned_at IS NULL THEN
      UPDATE public.equipment
         SET status = 'available',
             updated_at = now()
       WHERE id = NEW.equipment_id
         AND tenant_id = NEW.tenant_id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_loan_status_from_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.returned_at IS NULL AND NEW.due_at < now() THEN
    NEW.status = 'overdue';
  ELSIF NEW.returned_at IS NOT NULL THEN
    NEW.status = 'returned';
  ELSE
    NEW.status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_memberships_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_loans_before_insert
BEFORE INSERT ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.enforce_loan_rules();

CREATE TRIGGER trg_loans_after_insert
AFTER INSERT ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_status_on_loan();

CREATE TRIGGER trg_loans_after_update
AFTER UPDATE ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_status_on_loan();

CREATE TRIGGER trg_loans_status_from_due_date
BEFORE INSERT OR UPDATE OF due_at, returned_at ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.set_loan_status_from_due_date();

-- RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: tenants
CREATE POLICY "tenants_visible_to_own_members"
ON public.tenants
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.tenant_id = tenants.id
      AND m.user_id = auth.uid()
  )
);

CREATE POLICY "tenants_manageable_by_admin"
ON public.tenants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.tenant_id = tenants.id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
  )
);

-- Policies: profiles
CREATE POLICY "profiles_visible_to_same_tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "profiles_manageable_by_tenant_admin"
ON public.profiles
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
  )
);

CREATE POLICY "profiles_update_by_same_user_or_admin"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR (
    tenant_id IN (
      SELECT m.tenant_id
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role = 'admin'
    )
  )
);

-- Policies: memberships
CREATE POLICY "memberships_visible_to_same_tenant"
ON public.memberships
FOR SELECT
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "memberships_manageable_by_admin"
ON public.memberships
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
  )
);

CREATE POLICY "memberships_update_by_admin"
ON public.memberships
FOR UPDATE
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
  )
);

-- Policies: equipment
CREATE POLICY "equipment_visible_to_tenant_members"
ON public.equipment
FOR SELECT
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "equipment_insert_by_operational_roles"
ON public.equipment
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'operator')
  )
);

CREATE POLICY "equipment_update_by_operational_roles"
ON public.equipment
FOR UPDATE
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'operator')
  )
);

-- Policies: loans
CREATE POLICY "loans_visible_to_same_tenant"
ON public.loans
FOR SELECT
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "loans_insert_by_tenant_member"
ON public.loans
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
  )
  AND borrower_id = auth.uid()
);

CREATE POLICY "loans_update_by_operators_or_borrower"
ON public.loans
FOR UPDATE
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'operator')
  )
  OR borrower_id = auth.uid()
);

-- Policies: audit logs
CREATE POLICY "audit_logs_visible_to_tenant_admin"
ON public.audit_logs
FOR SELECT
USING (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
  )
);

CREATE POLICY "audit_logs_insert_by_tenant_members"
ON public.audit_logs
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT m.tenant_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
  )
);

-- Seed default tenant can be created manually by app bootstrap.
