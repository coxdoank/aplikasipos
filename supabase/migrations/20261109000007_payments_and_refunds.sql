-- ==============================================================================
-- Migration: 20261109000007_payments_and_refunds.sql
-- Description: Create payment and refund tables, tax, service charge, and payment settings
-- ==============================================================================

-- 1. Table: order_payments
CREATE TABLE IF NOT EXISTS public.order_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    amount NUMERIC(12,2) NOT NULL,
    cash_received NUMERIC(12,2),
    change_amount NUMERIC(12,2),
    reference_number VARCHAR(100),
    proof_path TEXT,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_order_payments_method CHECK (payment_method IN ('CASH', 'QRIS', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD')),
    CONSTRAINT chk_order_payments_status CHECK (status IN ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED')),
    CONSTRAINT chk_order_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_order_payments_cash CHECK (cash_received IS NULL OR cash_received >= 0),
    CONSTRAINT chk_order_payments_change CHECK (change_amount IS NULL OR change_amount >= 0)
);

CREATE TRIGGER trg_order_payments_updated_at
    BEFORE UPDATE ON public.order_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enforce exactly one successful PAID payment per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_payments_single_paid
    ON public.order_payments (order_id)
    WHERE status = 'PAID';

-- 2. Table: payment_refunds
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL REFERENCES public.order_payments(id) ON DELETE RESTRICT,
    refund_amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_payment_refunds_amount CHECK (refund_amount > 0),
    CONSTRAINT chk_payment_refunds_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
    -- Critical rule: Requester cannot approve their own refund request!
    CONSTRAINT chk_refund_requester_not_approver CHECK (requested_by != approved_by)
);

-- 3. Table: payment_events
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.order_payments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: payment_settings
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE UNIQUE,
    qris_image_url TEXT,
    qris_merchant_name TEXT,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(100),
    bank_account_holder VARCHAR(150),
    is_cash_enabled BOOLEAN NOT NULL DEFAULT true,
    is_qris_enabled BOOLEAN NOT NULL DEFAULT true,
    is_transfer_enabled BOOLEAN NOT NULL DEFAULT true,
    is_card_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table: tax_settings
CREATE TABLE IF NOT EXISTS public.tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    tax_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    tax_name VARCHAR(50) NOT NULL DEFAULT 'PB1 / Pajak Restoran',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_tax_rate CHECK (tax_rate_percent >= 0)
);

-- 6. Table: service_charge_settings
CREATE TABLE IF NOT EXISTS public.service_charge_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    service_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_service_rate CHECK (service_rate_percent >= 0)
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_outlet_id ON public.order_payments(outlet_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_status ON public.order_payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON public.payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events(payment_id);
