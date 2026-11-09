-- ==============================================================================
-- Migration: 20261109000012_storage_and_bootstrap.sql
-- Description: Configure Storage buckets, storage policies, secure owner bootstrap, and guest tracking RPC
-- ==============================================================================

-- 1. Create Storage Buckets (Safe insertion)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
    ('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies

-- Bucket: product-images
CREATE POLICY "Public read product-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

CREATE POLICY "Staff upload product-images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'product-images'
        AND public.has_permission('products.manage')
    );

CREATE POLICY "Staff update product-images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'product-images'
        AND public.has_permission('products.manage')
    );

CREATE POLICY "Staff delete product-images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'product-images'
        AND public.has_permission('products.manage')
    );

-- Bucket: payment-proofs (Private bucket)
CREATE POLICY "Staff read payment-proofs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'payment-proofs'
        AND (public.has_permission('payments.view') OR public.has_permission('payments.verify'))
    );

CREATE POLICY "Staff upload payment-proofs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'payment-proofs'
    );

-- ==============================================================================
-- 3. SECURE OWNER BOOTSTRAP FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.bootstrap_initial_owner(
    p_user_id UUID,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_owner_role_id UUID;
    v_outlet_id UUID;
    v_owner_count INTEGER;
BEGIN
    -- Check if user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User dengan ID % tidak ditemukan pada Supabase Auth.', p_user_id;
    END IF;

    -- Check if OWNER role already exists
    SELECT id INTO v_owner_role_id FROM public.roles WHERE name = 'OWNER';
    IF v_owner_role_id IS NULL THEN
        RAISE EXCEPTION 'Role OWNER belum terdaftar di tabel roles.';
    END IF;

    -- Check how many owners currently exist (One-time bootstrap safeguard)
    SELECT COUNT(*) INTO v_owner_count
    FROM public.user_roles
    WHERE role_id = v_owner_role_id;

    IF v_owner_count > 0 THEN
        RAISE EXCEPTION 'Inisialisasi ditolak: Akun OWNER sudah terdaftar di sistem. Penambahan owner baru harus dilakukan oleh Owner aktif.';
    END IF;

    -- Get Primary Outlet (Pusat)
    SELECT id INTO v_outlet_id FROM public.outlets WHERE code = 'OUT-01' LIMIT 1;
    IF v_outlet_id IS NULL THEN
        SELECT id INTO v_outlet_id FROM public.outlets LIMIT 1;
    END IF;

    -- Insert or update profile
    INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
    VALUES (p_user_id, p_full_name, p_phone, now(), now())
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = now();

    -- Assign OWNER role
    INSERT INTO public.user_roles (user_id, role_id, created_at)
    VALUES (p_user_id, v_owner_role_id, now())
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Assign Outlet
    IF v_outlet_id IS NOT NULL THEN
        INSERT INTO public.user_outlets (user_id, outlet_id, is_primary, created_at)
        VALUES (p_user_id, v_outlet_id, true, now())
        ON CONFLICT (user_id, outlet_id) DO NOTHING;
    END IF;

    -- Record Audit Log
    INSERT INTO public.audit_logs (outlet_id, actor_id, action, entity_type, entity_id, details, created_at)
    VALUES (
        v_outlet_id,
        p_user_id,
        'INITIAL_OWNER_BOOTSTRAP',
        'profiles',
        p_user_id::text,
        jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Akun OWNER pertama berhasil diinisialisasi.',
        'user_id', p_user_id,
        'full_name', p_full_name,
        'role', 'OWNER'
    );
END;
$$;

COMMENT ON FUNCTION public.bootstrap_initial_owner IS 'Secure server-side procedure to initialize the first business OWNER';

-- ==============================================================================
-- 4. SECURE GUEST ORDER TRACKING RPC FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.track_order_by_token(
    p_token_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_result JSONB;
BEGIN
    -- Verify token hash existence
    SELECT order_id INTO v_order_id
    FROM public.public_order_tokens
    WHERE token_hash = p_token_hash
      AND (expires_at IS NULL OR expires_at > now());

    IF v_order_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Token pelacakan tidak valid atau telah kedaluwarsa.'
        );
    END IF;

    -- Return safe public order summary
    SELECT jsonb_build_object(
        'success', true,
        'order_number', o.order_number,
        'channel', o.channel,
        'service_type', o.service_type,
        'order_status', o.order_status,
        'grand_total', o.grand_total,
        'created_at', o.created_at,
        'items', (
            SELECT jsonb_agg(jsonb_build_object(
                'name', oi.product_name_snapshot,
                'quantity', oi.quantity,
                'line_total', oi.line_total,
                'variant', oi.variant_name_snapshot,
                'addons', oi.addons_snapshot
            ))
            FROM public.order_items oi
            WHERE oi.order_id = o.id
        ),
        'timeline', (
            SELECT jsonb_agg(jsonb_build_object(
                'status', osh.new_status,
                'time', osh.created_at,
                'reason', osh.reason
            ) ORDER BY osh.created_at ASC)
            FROM public.order_status_history osh
            WHERE osh.order_id = o.id
        )
    ) INTO v_result
    FROM public.orders o
    WHERE o.id = v_order_id;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.track_order_by_token IS 'Allows guests to securely track order status using a high-entropy 256-bit token hash';
