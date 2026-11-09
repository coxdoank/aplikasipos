# DEVELOPMENT PROGRESS — FOODPOS

## Current Phase: PHASE 1 — Database & Supabase Foundation

### Status: COMPLETED & AWAITING USER APPROVAL ("Lanjut")

---

### 1. Pekerjaan Selesai (Completed Tasks)
- [x] Evaluasi dan verifikasi ketersediaan Docker dan Supabase CLI:
  - Docker: Tidak tersedia di local host (terdokumentasi).
  - Supabase CLI: Terinstalasi via devDependency npm (`supabase`).
  - Strategi validasi: Migrasi SQL berurutan, schema linting, dan pengujian unit otomatis.
- [x] Perancangan arsitektur database multi-outlet isolation, relational integrity, dan data dictionary:
  - `docs/database/ERD.md`: Diagram relasi entitas Mermaid lengkap untuk seluruh modul.
  - `docs/database/DATA_DICTIONARY.md`: Spesifikasi kolom, tipe data, constraints, dan index.
  - `docs/database/DATABASE_DESIGN.md`: Dokumentasi prinsip immutabilitas snapshot pesanan, single full payment policy, segregasi refund dua tahap, dan tokenisasi tracking.
  - `docs/database/RLS_MATRIX.md`: Matriks otorisasi Row Level Security untuk Anonymous, Cashier, Admin, dan Owner.
  - `docs/database/STORAGE_POLICIES.md`: Kebijakan bucket `product-images` (Public) dan `payment-proofs` (Private).
  - `docs/security/OWNER_BOOTSTRAP.md`: Prosedur server-side aman inisialisasi akun OWNER pertama.
- [x] Penyusunan 12 berkas migrasi PostgreSQL terstruktur:
  1. `20261109000001_extensions_and_helpers.sql`: `pgcrypto` dan trigger `handle_updated_at`.
  2. `20261109000002_outlets_and_identity.sql`: Tabel `outlets` dan `profiles` terhubung ke `auth.users`.
  3. `20261109000003_roles_and_permissions.sql`: Tabel RBAC (`roles`, `permissions`, `role_permissions`, `user_roles`, `user_outlets`) dan helper RLS `has_permission`, `is_outlet_member`.
  4. `20261109000004_product_catalog.sql`: Tabel `categories`, `products`, `product_variants`, `product_addons`.
  5. `20261109000005_customers.sql`: Tabel `customers`.
  6. `20261109000006_orders_and_items.sql`: Tabel `orders`, `order_items`, `order_status_history`, `public_order_tokens`.
  7. `20261109000007_payments_and_refunds.sql`: Tabel `order_payments`, `payment_refunds` (dengan proteksi `chk_refund_requester_not_approver`), `payment_events`, `payment_settings`, `tax_settings`, `service_charge_settings`.
  8. `20261109000008_inventory.sql`: Tabel `stock_movements` (finished goods only, non-negative stock).
  9. `20261109000009_cash_sessions_and_expenses.sql`: Tabel `cash_sessions`, `cash_transactions`, `expenses`.
  10. `20261109000010_settings_notifications_audit.sql`: Tabel `store_settings`, `notifications`, `audit_logs`.
  11. `20261109000011_rls_policies.sql`: Pengaktifan RLS pada seluruh 28 tabel dan penyusunan policy.
  12. `20261109000012_storage_and_bootstrap.sql`: Konfigurasi bucket storage, storage policies, fungsi `bootstrap_initial_owner`, dan RPC `track_order_by_token`.
- [x] Penyusunan Initial Seed Data (`supabase/seed.sql`):
  - Outlet Pusat (`OUT-01`).
  - Master Roles (`OWNER`, `ADMIN`, `CASHIER`) dan 18 permissions granular.
  - Konfigurasi default Toko, Pembayaran (BCA, QRIS, EDC), dan Pajak Restoran (PB1 10%).
  - Menu awal (Makanan Utama, Minuman, Snack, Paket Hemat) beserta varian & add-on.
- [x] Integrasi Frontend Client Supabase:
  - `src/types/database.types.ts`: TypeScript interfaces lengkap untuk database Supabase.
  - `src/lib/supabase.ts`: Inisialisasi Supabase client dengan persistent session.
  - `src/vite-env.d.ts`: TypeScript definition untuk `import.meta.env`.
  - `.env.example`: Template environment variable yang aman.
- [x] Pengujian otomatis:
  - 8 unit tests passed (3 Phase 0 + 5 Phase 1).
  - ESLint 0 errors, 0 warnings.
  - TypeScript & Vite build clean (`dist/` dihasilkan).

---

### 2. Pekerjaan Belum Selesai (Incomplete Tasks)
- Tidak ada untuk cakupan Phase 1. Seluruh acceptance criteria telah terpenuhi.

---

### 3. Daftar Berkas yang Dibuat / Dimodifikasi
#### Dibuat:
- `supabase/config.toml`
- `supabase/migrations/20261109000001_extensions_and_helpers.sql`
- `supabase/migrations/20261109000002_outlets_and_identity.sql`
- `supabase/migrations/20261109000003_roles_and_permissions.sql`
- `supabase/migrations/20261109000004_product_catalog.sql`
- `supabase/migrations/20261109000005_customers.sql`
- `supabase/migrations/20261109000006_orders_and_items.sql`
- `supabase/migrations/20261109000007_payments_and_refunds.sql`
- `supabase/migrations/20261109000008_inventory.sql`
- `supabase/migrations/20261109000009_cash_sessions_and_expenses.sql`
- `supabase/migrations/20261109000010_settings_notifications_audit.sql`
- `supabase/migrations/20261109000011_rls_policies.sql`
- `supabase/migrations/20261109000012_storage_and_bootstrap.sql`
- `supabase/seed.sql`
- `docs/database/ERD.md`
- `docs/database/DATA_DICTIONARY.md`
- `docs/database/DATABASE_DESIGN.md`
- `docs/database/RLS_MATRIX.md`
- `docs/database/STORAGE_POLICIES.md`
- `docs/security/OWNER_BOOTSTRAP.md`
- `src/types/database.types.ts`
- `src/lib/supabase.ts`
- `src/vite-env.d.ts`
- `tests/unit/phase1_database.test.ts`

#### Dimodifikasi:
- `.env.example`
- `README.md`
- `CHANGELOG.md`
- `DEVELOPMENT_PROGRESS.md`

---

### 4. Test yang Dijalankan & Hasil Aktual
- **Vitest Unit Test:**
  - `tests/unit/phase0.test.tsx` (3 tests passed)
  - `tests/unit/phase1_database.test.ts` (5 tests passed)
  - Total: **8 passed, 0 failed**.
- **ESLint:**
  - `npm run lint` -> **0 errors, 0 warnings**.
- **Typecheck & Production Build:**
  - `npm run build` -> **Exit code 0**, bundle `dist/assets/index-BUVG47eT.js` (296.53 kB).

---

### 5. Known Issues & Keterbatasan Lingkungan
- **Ketiadaan Docker Local:** Docker tidak terinstalasi pada host lokal Windows pengguna, sehingga container Supabase lokal (`supabase start`) tidak dapat dijalankan secara virtual di mesin lokal. Seluruh pengujian struktur, constraint, trigger, dan sanitasi query dilakukan melalui verifikasi skrip migrasi SQL deklaratif dan unit testing frontend.
- **Remote Database Protection:** Sesuai aturan keamanan prompt, migrasi tidak dieksekusi langsung ke remote Supabase project tanpa persetujuan eksplisit pengguna.

---

### 6. Langkah Manual yang Masih Dibutuhkan Pengguna
1. **Membuat / Membuka Proyek di Supabase Cloud:**
   - Masuk ke [https://database.new](https://database.new) dan buat project baru (atau gunakan project yang sudah ada).
2. **Menjalankan Berkas Migrasi:**
   - Buka **Supabase Dashboard** -> **SQL Editor**.
   - Salin dan jalankan berkas migrasi `20261109000001` hingga `20261109000012` secara berurutan, lalu jalankan `supabase/seed.sql`.
   - Atau gunakan Supabase CLI: `npx supabase db push` jika CLI telah di-link ke project remote (`npx supabase link`).
3. **Mengisi Kredensial `.env`:**
   - Salin `Project URL` dan `Project API Anon Key` dari menu **Project Settings -> API** ke file `.env` lokal.
4. **Menjalankan Owner Bootstrap:**
   - Ikuti panduan di `docs/security/OWNER_BOOTSTRAP.md` untuk membuat akun Owner pertama melalui SQL Editor.

---

### 7. Status Persetujuan Remote Database
- **Status:** **PENDING / HOLD.** Tidak ada perubahan destruktif atau push remote yang dijalankan secara otomatis tanpa izin pengguna.

---

### 8. Rekomendasi Phase 2 (Public Website)
- Mengembangkan katalog menu publik interaktif terhubung Supabase (`categories`, `products`, `product_variants`, `product_addons`).
- Mengembangkan shopping cart interaktif (Zustand store).
- Mengembangkan checkout pesanan publik (Delivery & Pickup).
- Mengembangkan integrasi token tracking pesanan tamu menggunakan RPC `track_order_by_token`.
- Memastikan validasi harga dan stok tetap terverifikasi secara server-side.
