BEGIN;

CREATE UNIQUE INDEX loans_one_open_per_equipment
  ON public.loans (tenant_id, equipment_id) WHERE returned_at IS NULL;

CREATE OR REPLACE FUNCTION public.enforce_loan_rules()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.equipment
    WHERE id = NEW.equipment_id AND tenant_id = NEW.tenant_id AND status = 'available') THEN
    RAISE EXCEPTION 'Equipamento indisponível';
  END IF;
  IF (SELECT count(*) FROM public.loans WHERE tenant_id = NEW.tenant_id
      AND borrower_id = NEW.borrower_id AND returned_at IS NULL) >= 5 THEN
    RAISE EXCEPTION 'Limite de cinco empréstimos em aberto';
  END IF;
  IF EXISTS (SELECT 1 FROM public.loans WHERE tenant_id = NEW.tenant_id
      AND borrower_id = NEW.borrower_id AND returned_at IS NULL
      AND (due_at AT TIME ZONE 'America/Sao_Paulo')::date
          < (NEW.requested_at AT TIME ZONE 'America/Sao_Paulo')::date) THEN
    RAISE EXCEPTION 'Empréstimo em atraso';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_loan_status_from_due_date()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.status := CASE WHEN NEW.returned_at IS NOT NULL THEN 'returned'
    WHEN (NEW.due_at AT TIME ZONE 'America/Sao_Paulo')::date
         < (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN 'overdue'
    ELSE 'active' END;
  RETURN NEW;
END;
$$;

REVOKE INSERT, UPDATE, DELETE ON public.loans FROM PUBLIC, anon, authenticated;
ALTER POLICY loans_visible_to_same_tenant ON public.loans TO authenticated
  USING (empresti_private.has_tenant_role(tenant_id)
    AND (borrower_id = auth.uid() OR empresti_private.has_tenant_role(tenant_id, 'operator')
      OR empresti_private.has_tenant_role(tenant_id, 'admin')));

COMMIT;
