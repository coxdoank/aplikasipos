-- ==============================================================================
-- Migration: 20261109000002_outlets_and_identity.sql
-- Description: Create outlets and profiles tables linked to auth.users
-- ==============================================================================

-- 1. Table: outlets
CREATE TABLE IF NOT EXISTS public.outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_outlets_updated_at
    BEFORE UPDATE ON public.outlets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_outlets_code ON public.outlets(code);
CREATE INDEX IF NOT EXISTS idx_outlets_is_active ON public.outlets(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

COMMENT ON TABLE public.outlets IS 'Stores restaurant outlet/branch entities';
COMMENT ON TABLE public.profiles IS 'Stores staff user profiles linked to Supabase Auth users';
