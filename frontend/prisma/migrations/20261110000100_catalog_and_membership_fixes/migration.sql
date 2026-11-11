BEGIN;

ALTER TABLE public.equipment
  ADD COLUMN image_path text,
  DROP CONSTRAINT equipment_category_check,
  ADD CONSTRAINT equipment_category_check
    CHECK (category IN ('notebook', 'monitor', 'camera', 'accessory', 'cable'));

ALTER TABLE public.memberships
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE SCHEMA empresti_private;
REVOKE ALL ON SCHEMA empresti_private FROM PUBLIC;
GRANT USAGE ON SCHEMA empresti_private TO authenticated;

-- A consulta usa a identidade autenticada e evita a recursão das políticas da tabela.
CREATE FUNCTION empresti_private.has_tenant_role(
  target_tenant uuid,
  required_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships AS membership
    WHERE membership.tenant_id = target_tenant
      AND membership.user_id = auth.uid()
      AND (required_role IS NULL OR membership.role = required_role)
  );
$$;

REVOKE ALL ON FUNCTION empresti_private.has_tenant_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION empresti_private.has_tenant_role(uuid, text) TO authenticated;

ALTER POLICY memberships_visible_to_same_tenant ON public.memberships TO authenticated
  USING (empresti_private.has_tenant_role(tenant_id));

ALTER POLICY memberships_manageable_by_admin ON public.memberships TO authenticated
  WITH CHECK (empresti_private.has_tenant_role(tenant_id, 'admin'));

ALTER POLICY memberships_update_by_admin ON public.memberships TO authenticated
  USING (empresti_private.has_tenant_role(tenant_id, 'admin'))
  WITH CHECK (empresti_private.has_tenant_role(tenant_id, 'admin'));

COMMIT;
