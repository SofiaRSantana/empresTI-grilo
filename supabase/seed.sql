-- Seed file for local Supabase development.
-- Keep this file idempotent and avoid inserting auth.users directly here.
-- Tenant and user bootstrap should be handled in app startup or via service-role scripts.

-- Example pattern when the app already creates the tenant/user in auth.users:
-- INSERT INTO public.tenants (slug, name)
-- VALUES ('empresa-demo', 'Empresa Demo')
-- ON CONFLICT (slug) DO NOTHING;
