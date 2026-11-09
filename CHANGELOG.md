# CHANGELOG — FOODPOS

All notable changes to the FOODPOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-11-09
### Phase 1 — Database & Supabase Foundation

#### Added
- **Arsitektur Database PostgreSQL:**
  - Perancangan lengkap 28 tabel domain bisnis: `outlets`, `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_outlets`, `categories`, `products`, `product_variants`, `product_addons`, `customers`, `orders`, `order_items`, `order_status_history`, `public_order_tokens`, `order_payments`, `payment_refunds`, `payment_events`, `payment_settings`, `tax_settings`, `service_charge_settings`, `stock_movements`, `cash_sessions`, `cash_transactions`, `expenses`, `store_settings`, `notifications`, `audit_logs`.
- **12 Migrasi SQL Terstruktur:**
  - `20261109000001_extensions_and_helpers.sql`
  - `20261109000002_outlets_and_identity.sql`
  - `20261109000003_roles_and_permissions.sql`
  - `20261109000004_product_catalog.sql`
  - `20261109000005_customers.sql`
  - `20261109000006_orders_and_items.sql`
  - `20261109000007_payments_and_refunds.sql`
  - `20261109000008_inventory.sql`
  - `20261109000009_cash_sessions_and_expenses.sql`
  - `20261109000010_settings_notifications_audit.sql`
  - `20261109000011_rls_policies.sql`
  - `20261109000012_storage_and_bootstrap.sql`
- **Initial Seed Data (`supabase/seed.sql`):**
  - Master Outlet Pusat (`OUT-01`), peran (`OWNER`, `ADMIN`, `CASHIER`), 18 granular permissions, pengaturan pajak (PB1 10%), pengaturan pembayaran, dan data katalog menu awal.
- **Keamanan & Otorisasi:**
  - Proteksi Row Level Security (RLS) di seluruh tabel public.
  - Partial unique index untuk single full payment: `idx_order_payments_single_paid`.
  - Constraint larangan kasir menyetujui refund sendiri: `chk_refund_requester_not_approver`.
  - Constraint pencegahan stok negatif: `chk_products_stock`.
  - Prosedur server-side `bootstrap_initial_owner` dengan proteksi one-time initialization.
  - RPC function `track_order_by_token` untuk pelacakan tamu dengan token hash SHA-256 (256-bit entropy).
- **Supabase Storage Configuration:**
  - Bucket publik `product-images` (maks 5MB) dan bucket privat `payment-proofs` (maks 5MB).
- **Frontend Supabase Client & Typing:**
  - `src/lib/supabase.ts` dengan persistent auth session.
  - `src/types/database.types.ts` dengan TypeScript interfaces lengkap untuk database.
  - `src/vite-env.d.ts` untuk type definitions `import.meta.env`.
- **Dokumentasi Database:**
  - `docs/database/ERD.md` (Diagram relasi Mermaid lengkap).
  - `docs/database/DATA_DICTIONARY.md` (Kamus data kolom, tipe data, dan constraints).
  - `docs/database/DATABASE_DESIGN.md` (Rasionalitas arsitektur & snapshot immutability).
  - `docs/database/RLS_MATRIX.md` (Matriks otorisasi hak akses RLS).
  - `docs/database/STORAGE_POLICIES.md` (Kebijakan bucket storage).
  - `docs/security/OWNER_BOOTSTRAP.md` (Panduan administrasi akun Owner).
- **Pengujian Unit:**
  - `tests/unit/phase1_database.test.ts` (5 test cases verifikasi migrasi, seed, constraints, client).

---

## [0.1.0] - 2026-11-09
### Phase 0 — Project Foundation and Environment
- Inisialisasi arsitektur Modular Monolithic SPA menggunakan React 18, TypeScript, dan Vite.
- Konfigurasi Tailwind CSS, routing HashRouter, Public Layout, Backoffice Layout, dan halaman awal.
- Vitest unit testing, ESLint configuration, dan GitHub Actions CI/CD setup.
