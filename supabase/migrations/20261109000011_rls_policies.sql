-- ==============================================================================
-- Migration: 20261109000011_rls_policies.sql
-- Description: Enable Row Level Security (RLS) on all public tables and establish policies
-- ==============================================================================

-- 1. Enable RLS on every table
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_order_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_charge_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. PUBLIC / ANONYMOUS CATALOG POLICIES
-- ==============================================================================

-- Outlets: Anyone can view active outlets
CREATE POLICY "Public read active outlets"
    ON public.outlets FOR SELECT
    USING (is_active = true);

-- Categories: Anyone can view active categories
CREATE POLICY "Public read active categories"
    ON public.categories FOR SELECT
    USING (is_active = true);

-- Products: Anyone can view active products
CREATE POLICY "Public read active products"
    ON public.products FOR SELECT
    USING (is_active = true);

-- Variants & Addons: Anyone can view active variants & addons
CREATE POLICY "Public read active variants"
    ON public.product_variants FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public read active addons"
    ON public.product_addons FOR SELECT
    USING (is_active = true);

-- Store, Tax & Payment Settings: Anyone can view settings for store presentation
CREATE POLICY "Public read store settings"
    ON public.store_settings FOR SELECT
    USING (true);

CREATE POLICY "Public read tax settings"
    ON public.tax_settings FOR SELECT
    USING (true);

CREATE POLICY "Public read payment settings"
    ON public.payment_settings FOR SELECT
    USING (true);

CREATE POLICY "Public read service charge settings"
    ON public.service_charge_settings FOR SELECT
    USING (true);

-- ==============================================================================
-- 3. STAFF / AUTHENTICATED ACCESS POLICIES
-- ==============================================================================

-- Profiles: Users can read and update their own profile; Owner/Admin can view staff profiles
CREATE POLICY "Users read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.has_permission('users.manage'));

CREATE POLICY "Users update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Roles & Permissions: Read-only for authenticated staff; full access for OWNER
CREATE POLICY "Staff read roles"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff read permissions"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff read role_permissions"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff read user_roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_permission('users.manage'));

CREATE POLICY "Staff read user_outlets"
    ON public.user_outlets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_permission('users.manage'));

-- Catalog Management (Staff)
CREATE POLICY "Staff manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('products.manage'))
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('products.manage'));

CREATE POLICY "Staff manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('products.manage'))
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('products.manage'));

CREATE POLICY "Staff manage variants"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id
        AND public.is_outlet_member(p.outlet_id)
        AND public.has_permission('products.manage')
    ));

CREATE POLICY "Staff manage addons"
    ON public.product_addons FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_addons.product_id
        AND public.is_outlet_member(p.outlet_id)
        AND public.has_permission('products.manage')
    ));

-- Customers
CREATE POLICY "Staff view customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id));

CREATE POLICY "Staff manage customers"
    ON public.customers FOR ALL
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('orders.create'))
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('orders.create'));

-- Orders & Items
CREATE POLICY "Staff view orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('orders.view'));

CREATE POLICY "Staff create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('orders.create'));

CREATE POLICY "Staff update order status"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('orders.update_status'));

CREATE POLICY "Staff view order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND public.is_outlet_member(o.outlet_id)
        AND public.has_permission('orders.view')
    ));

CREATE POLICY "Staff insert order items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
        AND public.is_outlet_member(o.outlet_id)
        AND public.has_permission('orders.create')
    ));

CREATE POLICY "Staff view order status history"
    ON public.order_status_history FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_status_history.order_id
        AND public.is_outlet_member(o.outlet_id)
        AND public.has_permission('orders.view')
    ));

CREATE POLICY "Staff insert order status history"
    ON public.order_status_history FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_status_history.order_id
        AND public.is_outlet_member(o.outlet_id)
        AND public.has_permission('orders.update_status')
    ));

-- Payments & Refunds
CREATE POLICY "Staff view payments"
    ON public.order_payments FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('payments.view'));

CREATE POLICY "Staff insert payments"
    ON public.order_payments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('payments.create'));

CREATE POLICY "Staff update / verify payments"
    ON public.order_payments FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('payments.verify'));

CREATE POLICY "Staff view refunds"
    ON public.payment_refunds FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('payments.view'));

CREATE POLICY "Staff request refund"
    ON public.payment_refunds FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('payments.refund.request'));

CREATE POLICY "Staff approve refund"
    ON public.payment_refunds FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('payments.refund.approve'));

CREATE POLICY "Staff view payment events"
    ON public.payment_events FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.order_payments op
        WHERE op.id = payment_events.payment_id
        AND public.is_outlet_member(op.outlet_id)
        AND public.has_permission('payments.view')
    ));

CREATE POLICY "Staff insert payment events"
    ON public.payment_events FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.order_payments op
        WHERE op.id = payment_events.payment_id
        AND public.is_outlet_member(op.outlet_id)
        AND (public.has_permission('payments.create') OR public.has_permission('payments.verify'))
    ));

-- Inventory Stock Movements
CREATE POLICY "Staff view stock movements"
    ON public.stock_movements FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id));

CREATE POLICY "Staff insert stock adjustment"
    ON public.stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('inventory.adjust'));

-- Cash Sessions & Expenses
CREATE POLICY "Staff view cash sessions"
    ON public.cash_sessions FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id));

CREATE POLICY "Staff open cash session"
    ON public.cash_sessions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id) AND public.has_permission('cash_sessions.open'));

CREATE POLICY "Staff close cash session"
    ON public.cash_sessions FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND (public.has_permission('cash_sessions.close') OR opened_by = auth.uid()));

CREATE POLICY "Staff manage cash transactions"
    ON public.cash_transactions FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.cash_sessions cs
        WHERE cs.id = cash_transactions.session_id
        AND public.is_outlet_member(cs.outlet_id)
    ));

CREATE POLICY "Staff view expenses"
    ON public.expenses FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id));

CREATE POLICY "Staff create expenses"
    ON public.expenses FOR INSERT
    TO authenticated
    WITH CHECK (public.is_outlet_member(outlet_id));

-- Settings Update (Manager/Owner only)
CREATE POLICY "Managers update store settings"
    ON public.store_settings FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

CREATE POLICY "Managers update payment settings"
    ON public.payment_settings FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

CREATE POLICY "Managers update tax settings"
    ON public.tax_settings FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

CREATE POLICY "Managers update service settings"
    ON public.service_charge_settings FOR UPDATE
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('settings.manage'));

-- Notifications
CREATE POLICY "Staff view own and outlet notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (
        (recipient_user_id IS NULL AND public.is_outlet_member(outlet_id))
        OR recipient_user_id = auth.uid()
    );

CREATE POLICY "Staff update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (recipient_user_id = auth.uid());

-- Audit Logs
CREATE POLICY "Staff view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_outlet_member(outlet_id) AND public.has_permission('audit.view'));

CREATE POLICY "Allow system insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
