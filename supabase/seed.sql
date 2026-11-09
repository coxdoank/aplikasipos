-- ==============================================================================
-- Seed: supabase/seed.sql
-- Description: Initial system seed data (Outlet, Roles, Permissions, Settings, Menu)
-- Note: NO passwords or owner credentials are included here.
-- ==============================================================================

-- 1. Initial Primary Outlet
INSERT INTO public.outlets (id, code, name, address, phone, is_active, created_at, updated_at)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'OUT-01',
    'FOODPOS Outlet Pusat',
    'Jl. Kuliner Rasa No. 88, Jakarta Selatan',
    '+62 812-3456-7890',
    true,
    now(),
    now()
) ON CONFLICT (code) DO NOTHING;

-- 2. System Roles
INSERT INTO public.roles (id, name, description)
VALUES 
    ('r0000000-0000-0000-0000-000000000001', 'OWNER', 'Pemilik Bisnis — Memiliki hak akses penuh ke seluruh cabang dan data keuangan'),
    ('r0000000-0000-0000-0000-000000000002', 'ADMIN', 'Manajer Restoran — Mengelola operasional, menu, stok, staf, dan persetujuan refund'),
    ('r0000000-0000-0000-0000-000000000003', 'CASHIER', 'Kasir Operasional — Mengoperasikan POS, menerima pembayaran, dan mengelola shift kasir')
ON CONFLICT (name) DO NOTHING;

-- 3. Granular Permissions
INSERT INTO public.permissions (id, code, module, description)
VALUES 
    -- Orders
    ('p0000000-0000-0000-0000-000000000001', 'orders.view', 'orders', 'Melihat daftar dan rincian pesanan'),
    ('p0000000-0000-0000-0000-000000000002', 'orders.create', 'orders', 'Membuat pesanan baru di kasir'),
    ('p0000000-0000-0000-0000-000000000003', 'orders.update_status', 'orders', 'Memperbarui status antrian pesanan (Processing, Ready, Completed)'),
    ('p0000000-0000-0000-0000-000000000004', 'orders.cancel', 'orders', 'Membatalkan transaksi pesanan'),

    -- Payments & Refunds
    ('p0000000-0000-0000-0000-000000000005', 'payments.view', 'payments', 'Melihat histori dan rincian transaksi pembayaran'),
    ('p0000000-0000-0000-0000-000000000006', 'payments.create', 'payments', 'Menerima dan memproses pembayaran tagihan'),
    ('p0000000-0000-0000-0000-000000000007', 'payments.verify', 'payments', 'Memverifikasi bukti transfer atau konfirmasi EDC/QRIS'),
    ('p0000000-0000-0000-0000-000000000008', 'payments.refund.request', 'payments', 'Mengajukan klaim permohonan refund transaksi'),
    ('p0000000-0000-0000-0000-000000000009', 'payments.refund.approve', 'payments', 'Menyetujui atau menolak permohonan refund transaksi'),

    -- Products & Catalog
    ('p0000000-0000-0000-0000-000000000010', 'products.view', 'products', 'Melihat katalog produk dan ketersediaan menu'),
    ('p0000000-0000-0000-0000-000000000011', 'products.manage', 'products', 'Menambah, mengubah harga, atau mengedit varian menu'),

    -- Inventory
    ('p0000000-0000-0000-0000-000000000012', 'inventory.adjust', 'inventory', 'Melakukan penyesuaian stok opname produk jadi'),

    -- Reports
    ('p0000000-0000-0000-0000-000000000013', 'reports.view', 'reports', 'Mengakses rekapitulasi penjualan dan laporan laba/rugi'),

    -- Users & Staff
    ('p0000000-0000-0000-0000-000000000014', 'users.manage', 'users', 'Mengelola akun staf kasir dan penugasan peran'),

    -- Settings
    ('p0000000-0000-0000-0000-000000000015', 'settings.manage', 'settings', 'Mengubah konfigurasi toko, QRIS, bank, dan tarif pajak'),

    -- Audit
    ('p0000000-0000-0000-0000-000000000016', 'audit.view', 'audit', 'Melihat log riwayat aktivitas sensitif sistem'),

    -- Cash Sessions
    ('p0000000-0000-0000-0000-000000000017', 'cash_sessions.open', 'finance', 'Membuka shift kasir dan mengisi modal kas awal'),
    ('p0000000-0000-0000-0000-000000000018', 'cash_sessions.close', 'finance', 'Menutup shift kasir dan menghitung rekonsiliasi kas')
ON CONFLICT (code) DO NOTHING;

-- 4. Role Permissions Mapping
-- OWNER: All permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'r0000000-0000-0000-0000-000000000001', id FROM public.permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN: All operational permissions except sensitive owner actions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'r0000000-0000-0000-0000-000000000002', id FROM public.permissions
WHERE code IN (
    'orders.view', 'orders.create', 'orders.update_status', 'orders.cancel',
    'payments.view', 'payments.create', 'payments.verify', 'payments.refund.request', 'payments.refund.approve',
    'products.view', 'products.manage', 'inventory.adjust', 'reports.view',
    'users.manage', 'settings.manage', 'audit.view', 'cash_sessions.open', 'cash_sessions.close'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CASHIER: POS cashier operational permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 'r0000000-0000-0000-0000-000000000003', id FROM public.permissions
WHERE code IN (
    'orders.view', 'orders.create', 'orders.update_status',
    'payments.view', 'payments.create', 'payments.verify', 'payments.refund.request',
    'products.view', 'cash_sessions.open', 'cash_sessions.close'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. Default Outlet Settings
INSERT INTO public.store_settings (outlet_id, business_name, business_tagline, description, operating_hours, whatsapp_number, email, estimated_prep_time_minutes, is_online_ordering_enabled)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'FOODPOS Resto & Cafe',
    'Sajian Lezat Berkualitas untuk Setiap Momen Berharga',
    'Restoran keluarga dengan cita rasa khas Nusantara dan aneka kopi pilihan.',
    'Senin - Minggu: 10:00 - 22:00 WIB',
    '+62 812-3456-7890',
    'info@foodpos.local',
    15,
    true
) ON CONFLICT (outlet_id) DO NOTHING;

INSERT INTO public.payment_settings (outlet_id, qris_merchant_name, bank_name, bank_account_number, bank_account_holder, is_cash_enabled, is_qris_enabled, is_transfer_enabled, is_card_enabled)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'FOODPOS OUTLET PUSAT',
    'BCA',
    '8820192831',
    'PT KULINER MAKMUR POS',
    true,
    true,
    true,
    true
) ON CONFLICT (outlet_id) DO NOTHING;

INSERT INTO public.tax_settings (outlet_id, is_enabled, tax_rate_percent, tax_name)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    true,
    10.00,
    'PB1 / Pajak Restoran'
) ON CONFLICT (outlet_id) DO NOTHING;

INSERT INTO public.service_charge_settings (outlet_id, is_enabled, service_rate_percent)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    false,
    0.00
) ON CONFLICT (outlet_id) DO NOTHING;

-- 6. Initial Menu Categories
INSERT INTO public.categories (id, outlet_id, name, slug, description, display_order, is_active)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Makanan Utama', 'makanan-utama', 'Aneka hidangan nasi, mie, dan olahan ayam spesial', 1, true),
    ('c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Minuman Segar', 'minuman-segar', 'Kopi susu gula aren, teh leci, dan jus buah asli', 2, true),
    ('c0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Snack & Camilan', 'snack-camilan', 'Pisang karamel krispi dan kentang goreng gurih', 3, true),
    ('c0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Paket Hemat', 'paket-hemat', 'Kombinasi makanan dan minuman lezat dengan harga hemat', 4, true)
ON CONFLICT (outlet_id, slug) DO NOTHING;

-- 7. Initial Products
INSERT INTO public.products (id, outlet_id, category_id, sku, name, description, base_price, is_active, is_available, display_order, current_stock)
VALUES 
    ('m0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'FOOD-001', 'Nasi Goreng Spesial Resto', 'Nasi goreng bumbu rempah dengan ayam suwir, telur mata sapi, kerupuk udang, dan acar', 38000, true, true, 1, 50),
    ('m0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'FOOD-002', 'Ayam Bakar Madu Gurih', 'Potongan ayam bakar bumbu madu khas dipanggang arang harum dengan sambal terasi', 42000, true, true, 2, 40),
    ('m0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'FOOD-003', 'Mie Goreng Seafood Spesial', 'Mie kenyal dengan udang, cumi, dan sayuran segar berpadu saus tiram gurih', 45000, true, true, 3, 35),
    ('m0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'DRK-001', 'Es Kopi Susu Gula Aren', 'Espresso robusta & arabika blend dengan susu segar dan sirup aren organik murni', 22000, true, true, 4, 100),
    ('m0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'DRK-002', 'Ice Lychee Tea Segar', 'Teh melati wangi dengan buah leci utuh dan daun mint segar', 24000, true, true, 5, 80),
    ('m0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'SNK-001', 'Pisang Goreng Karamel Crispy', 'Pisang raja goreng krispi dengan lelehan saus karamel manis legit', 20000, true, true, 6, 60),
    ('m0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'SNK-002', 'Kentang Goreng Truffle Savory', 'French fries renyah bertabur garam laut dan aroma minyak truffle gurih', 28000, true, true, 7, 45)
ON CONFLICT (outlet_id, sku) DO NOTHING;

-- 8. Product Variants & Addons
INSERT INTO public.product_variants (product_id, name, price_adjustment, display_order)
VALUES 
    ('m0000000-0000-0000-0000-000000000001', 'Porsi Standar', 0.00, 1),
    ('m0000000-0000-0000-0000-000000000001', 'Porsi Jumbo (+Nasi)', 8000.00, 2),
    ('m0000000-0000-0000-0000-000000000004', 'Reguler (Less Ice)', 0.00, 1),
    ('m0000000-0000-0000-0000-000000000004', 'Large Cup (+50% Kopi)', 6000.00, 2);

INSERT INTO public.product_addons (product_id, name, price, display_order)
VALUES 
    ('m0000000-0000-0000-0000-000000000001', 'Ekstra Telur Ceplok', 5000.00, 1),
    ('m0000000-0000-0000-0000-000000000001', 'Ekstra Kerupuk Kaleng', 3000.00, 2),
    ('m0000000-0000-0000-0000-000000000004', 'Ekstra Espresso Shot', 5000.00, 1),
    ('m0000000-0000-0000-0000-000000000004', 'Grass Jelly / Cincau', 4000.00, 2);
