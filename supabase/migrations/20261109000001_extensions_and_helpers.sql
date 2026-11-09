-- ==============================================================================
-- Migration: 20261109000001_extensions_and_helpers.sql
-- Description: Enable required extensions and trigger helper functions
-- ==============================================================================

-- 1. Enable pgcrypto for UUID and cryptographic hashing (SHA-256)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at IS 'Updates updated_at column to current timestamp on row update';
