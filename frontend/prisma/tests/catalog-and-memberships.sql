-- Execute em um Supabase local descartável após aplicar as migrations.
\set ON_ERROR_STOP on

BEGIN;

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');

INSERT INTO public.tenants (id, slug, name) VALUES
  ('00000000-0000-4000-8000-000000000010', 'migration-fixture-a', 'Fixture A'),
  ('00000000-0000-4000-8000-000000000020', 'migration-fixture-b', 'Fixture B');

INSERT INTO public.memberships (tenant_id, user_id, role) VALUES
  ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000001', 'member'),
  ('00000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000002', 'admin'),
  ('00000000-0000-4000-8000-000000000020', '00000000-0000-4000-8000-000000000003', 'member');

INSERT INTO public.equipment (tenant_id, name, category, location, patrimony_code, image_path) VALUES
  ('00000000-0000-4000-8000-000000000010', 'Cabo A', 'cable', 'Suporte TI', 'FIXTURE-A', 'a/fixture.jpg'),
  ('00000000-0000-4000-8000-000000000020', 'Acessório B', 'accessory', 'Suporte TI', 'FIXTURE-B', NULL);

DO $$
BEGIN
  BEGIN
    UPDATE public.equipment SET category = 'invalid' WHERE patrimony_code = 'FIXTURE-A';
    RAISE EXCEPTION 'Categoria inválida aceita';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$$;

-- Concede acesso SQL na transação para testar as políticas, inclusive no papel anônimo.
GRANT SELECT ON public.equipment, public.memberships TO authenticated, anon;
GRANT UPDATE ON public.memberships TO authenticated;

SET LOCAL ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.equipment) THEN
    RAISE EXCEPTION 'O catálogo ficou visível ao papel anônimo';
  END IF;
END;
$$;

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
DO $$
BEGIN
  IF (SELECT array_agg(patrimony_code) FROM public.equipment) IS DISTINCT FROM ARRAY['FIXTURE-A'] THEN
    RAISE EXCEPTION 'O catálogo não está isolado por organização';
  END IF;
  IF (SELECT image_path FROM public.equipment) IS DISTINCT FROM 'a/fixture.jpg' THEN
    RAISE EXCEPTION 'O caminho da imagem não foi preservado';
  END IF;
  UPDATE public.memberships SET role = 'admin' WHERE user_id = auth.uid();
  IF FOUND THEN RAISE EXCEPTION 'Colaborador conseguiu se promover'; END IF;
END;
$$;

SET LOCAL request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
DO $$
BEGIN
  UPDATE public.memberships SET role = 'operator'
    WHERE user_id = '00000000-0000-4000-8000-000000000001';
  IF NOT FOUND THEN RAISE EXCEPTION 'Admin não conseguiu alterar o papel na própria organização'; END IF;

  BEGIN
    UPDATE public.memberships SET tenant_id = '00000000-0000-4000-8000-000000000020'
      WHERE user_id = '00000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Admin conseguiu mover um vínculo para outra organização';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

ROLLBACK;
