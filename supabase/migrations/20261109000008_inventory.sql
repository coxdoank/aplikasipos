-- ==============================================================================
-- Migration: 20261109000008_inventory.sql
-- Description: Create finished product stock_movements table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(20) NOT NULL,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_id VARCHAR(100),
    reason TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_stock_movements_type CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'REFUND')),
    CONSTRAINT chk_stock_movements_prev CHECK (previous_stock >= 0),
    CONSTRAINT chk_stock_movements_new CHECK (new_stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_outlet_id ON public.stock_movements(outlet_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
