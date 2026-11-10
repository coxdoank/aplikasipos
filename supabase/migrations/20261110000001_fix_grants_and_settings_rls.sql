-- ==============================================================================
-- Migration: 20261110000001_fix_grants_and_settings_rls.sql
-- Description: Grant public schema permissions to API roles and add missing RLS policies
-- ==============================================================================

-- 1. Ensure schema and table privileges for PostgREST API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 2. Store Settings: Add INSERT policy so upsert works
DROP POLICY IF EXISTS "Managers insert store settings" ON public.store_settings;
CREATE POLICY "Managers insert store settings"
    ON public.store_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

-- 3. Outlets: Add UPDATE and INSERT policies so managers/owners can update outlet details
DROP POLICY IF EXISTS "Managers update outlets" ON public.outlets;
CREATE POLICY "Managers update outlets"
    ON public.outlets FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(id) AND public.has_permission('settings.manage'))
    WITH CHECK (public.is_outlet_member(id) AND public.has_permission('settings.manage'));

DROP POLICY IF EXISTS "Owners insert outlets" ON public.outlets;
CREATE POLICY "Owners insert outlets"
    ON public.outlets FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles ur 
        JOIN public.roles r ON r.id = ur.role_id 
        WHERE ur.user_id = auth.uid() AND r.name = 'OWNER'
    ));

-- 4. Payment Settings: Add INSERT policy
DROP POLICY IF EXISTS "Managers insert payment settings" ON public.payment_settings;
CREATE POLICY "Managers insert payment settings"
    ON public.payment_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

-- 5. Tax Settings: Add INSERT policy
DROP POLICY IF EXISTS "Managers insert tax settings" ON public.tax_settings;
CREATE POLICY "Managers insert tax settings"
    ON public.tax_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

-- 6. Service Charge Settings: Add INSERT policy
DROP POLICY IF EXISTS "Managers insert service settings" ON public.service_charge_settings;
CREATE POLICY "Managers insert service settings"
    ON public.service_charge_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

-- 7. Reset operational audit logs as requested in Bagian 3
DELETE FROM public.audit_logs;
