-- ==============================================================================
-- Migration: 20261109000009_cash_sessions_and_expenses.sql
-- Description: Create cash_sessions, cash_transactions, and expenses tables
-- ==============================================================================

-- 1. Table: cash_sessions
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE RESTRICT,
    opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    closed_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ,
    opening_cash NUMERIC(12,2) NOT NULL,
    total_cash_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_non_cash_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cash_in NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cash_out NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    expected_closing_cash NUMERIC(12,2),
    actual_closing_cash NUMERIC(12,2),
    discrepancy NUMERIC(12,2),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    closing_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cash_sessions_opening CHECK (opening_cash >= 0),
    CONSTRAINT chk_cash_sessions_cash_sales CHECK (total_cash_sales >= 0),
    CONSTRAINT chk_cash_sessions_non_cash_sales CHECK (total_non_cash_sales >= 0),
    CONSTRAINT chk_cash_sessions_cash_in CHECK (total_cash_in >= 0),
    CONSTRAINT chk_cash_sessions_cash_out CHECK (total_cash_out >= 0),
    CONSTRAINT chk_cash_sessions_status CHECK (status IN ('OPEN', 'CLOSED'))
);

-- 2. Table: cash_transactions
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cash_transactions_type CHECK (transaction_type IN ('CASH_IN', 'CASH_OUT')),
    CONSTRAINT chk_cash_transactions_amount CHECK (amount > 0)
);

-- 3. Table: expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    notes TEXT,
    receipt_proof_url TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_expenses_amount CHECK (amount > 0),
    CONSTRAINT chk_expenses_method CHECK (payment_method IN ('CASH', 'TRANSFER', 'OTHER'))
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_cash_sessions_outlet_id ON public.cash_sessions(outlet_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_session_id ON public.cash_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_expenses_outlet_id ON public.expenses(outlet_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);
