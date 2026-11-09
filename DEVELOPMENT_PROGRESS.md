# DEVELOPMENT PROGRESS — FOODPOS

## Current Phase: PHASE 3 — Backoffice Foundation and Authentication

### Status: COMPLETED & AWAITING USER APPROVAL ("Lanjut")

---

### 1. Pekerjaan Selesai (Completed Tasks - Phase 3)
- [x] **State Management Autentikasi Staf (`src/stores/authStore.ts`):**
  - Session persistence dengan `localStorage`.
  - Penyimpanan status login (`isAuthenticated`), identitas user, profil staf (`StaffProfile`), peran aktif (`OWNER` | `ADMIN` | `CASHIER`), hak akses (`permissions: string[]`), dan data cabang (`outlet`).
  - Method `hasPermission(code)` yang mengizinkan role `OWNER` secara otomatis (*super admin*) dan memeriksa izin staf lain.
  - Method `hasRole(name)` untuk verifikasi peran.
  - Logout bersih yang menghapus seluruh kredensial lokal dan sesi Supabase.
- [x] **Layanan Autentikasi (`src/services/authService.ts`):**
  - Integrasi dengan Supabase Auth `signInWithPassword`.
  - Pengambilan data profil dari tabel `profiles`.
  - Pengambilan role dari tabel `user_roles` dan permissions dari tabel `role_permissions`.
  - Penyediaan akun demo staf (Owner, Admin, Kasir) untuk kemudahan pengujian di lingkungan simulasi offline.
- [x] **Halaman Masuk Backoffice (`src/modules/auth/pages/LoginPage.tsx`):**
  - Antarmuka login kasir/staf modern dan profesional.
  - Form email & kata sandi dengan toggle lihat/sembunyikan password.
  - Tombol akses cepat demo staf (Owner, Admin, Kasir) dengan kredensial simulator siap uji.
  - Catatan keamanan: Penjelasan pendaftaran Owner yang terlindungi tanpa registrasi publik.
- [x] **Sistem Proteksi Rute & Wewenang (`ProtectedRoute.tsx` & `AccessDeniedPage.tsx`):**
  - Pengalihan otomatis (*redirect*) pengguna yang belum login ke rute `#/backoffice/login` dengan preserving `location.state.from`.
  - Komponen halaman **403 Forbidden** yang informatif menampilkan staf login, peran aktif, dan kode izin yang dibutuhkan.
  - Proteksi rute modular:
    - `/backoffice/pos` memerlukan izin `orders.create`.
    - `/backoffice/orders` memerlukan izin `orders.view`.
    - `/backoffice/products` memerlukan izin `products.view`.
    - `/backoffice/categories` memerlukan izin `products.manage`.
    - `/backoffice/inventory` memerlukan izin `inventory.adjust`.
    - `/backoffice/reports` memerlukan izin `reports.view`.
    - `/backoffice/settings` memerlukan izin `settings.manage`.
- [x] **Layout Backoffice Dinamis (`BackofficeLayout.tsx`):**
  - Penyaringan menu navigasi sidebar secara dinamis berdasarkan wewenang aktif pengguna.
  - Tampilan nama staf, badge peran (`OWNER`, `ADMIN`, `CASHIER`), dan outlet pada sidebar & topbar.
  - Tombol logout dengan konfirmasi pengguna di sidebar bawah dan topbar.
- [x] **Dashboard Backoffice Terintegrasi (`DashboardPage.tsx`):**
  - Sambutan personal dengan nama dan peran staf.
  - Kartu KPI pendapatan, total pesanan, rata-rata waktu masak, dan peringatan stok.
  - Status sesi shift kasir dengan tombol aksi cepat buka/tutup shift.
  - Antrian pesanan berjalan terkini.
- [x] **Pengujian & Kualitas:**
  - 23 unit & integration tests passed across 5 test suites.
  - ESLint 0 errors, 0 warnings.
  - Kompilasi produksi TypeScript & Vite sukses.

---

### 2. Pekerjaan Belum Selesai (Incomplete Tasks)
- Tidak ada untuk Phase 3. Seluruh acceptance criteria telah terpenuhi.

---

### 3. Berkas yang Dibuat / Dimodifikasi

#### Dibuat:
- `src/services/authService.ts`
- `src/stores/authStore.ts`
- `src/components/shared/ProtectedRoute.tsx`
- `src/components/shared/AccessDeniedPage.tsx`
- `src/modules/auth/pages/LoginPage.tsx`
- `tests/unit/phase3_auth_backoffice.test.tsx`

#### Dimodifikasi:
- `src/app/router/index.tsx`
- `src/layouts/backoffice/BackofficeLayout.tsx`
- `src/modules/dashboard/pages/DashboardPage.tsx`
- `tests/unit/phase0.test.tsx`
- `README.md`
- `CHANGELOG.md`
- `DEVELOPMENT_PROGRESS.md`

---

### 4. Test yang Dijalankan & Hasil Aktual
- **Vitest Unit & Integration Tests:**
  - `tests/unit/phase0.test.tsx` (3 passed)
  - `tests/unit/phase1_database.test.ts` (5 passed)
  - `tests/unit/phase2_public_website.test.tsx` (5 passed)
  - `tests/unit/phase2_ui_integration.test.tsx` (4 passed)
  - `tests/unit/phase3_auth_backoffice.test.tsx` (6 passed)
  - Total: **23 passed, 0 failed**.
- **ESLint:**
  - `npm run lint` -> **0 errors, 0 warnings**.
- **Typecheck & Production Build:**
  - `npm run build` -> **Exit code 0**, bundle `dist/assets/index-B4nhuPuP.js` (602.58 kB).

---

### 5. Known Issues
- Tidak ada error tersisa pada Phase 3.

---

### 6. Next Phase
- **PHASE 4 — Order Management and Kanban**
  - Implementasi Order List dengan pencarian, filter channel, dan filter status.
  - Implementasi Order Kanban board (NEW -> PROCESSING -> READY -> COMPLETED).
  - Implementasi transisi status pesanan dengan validasi alur transisi server-side (`order_status_history`).
  - Implementasi pembatalan pesanan (Cancellation dialog dengan alasan wajib).
  - Modal rincian pesanan (Order Details snapshot).
  - Audio / visual notification saat pesanan baru masuk.

---

### 7. Approval Status
- **Phase 3 Status:** SELESAI (Pending user confirmation: **Lanjut**).
