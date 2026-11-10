# FOODPOS — Integrated Point of Sale & Restaurant Management System

[![Build & Deploy](https://github.com/owner/foodpos/actions/workflows/deploy.yml/badge.svg)](https://github.com/owner/foodpos/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-emerald.svg)](https://github.com/owner/foodpos)
[![Tests](https://img.shields.io/badge/tests-162%20passed-success.svg)](https://github.com/owner/foodpos)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

FOODPOS adalah sistem Point of Sale (POS) dan manajemen operasional restoran modern berskala enterprise berbasis **Modular Monolithic Single Page Application (SPA)**. Dirancang untuk efisiensi transaksi kasir berkecepatan tinggi, keteraturan alur produksi dapur berbasis Kanban, pelacakan pesanan publik pelanggan dengan token 256-bit CSPRNG, serta manajemen keuangan terintegrasi (sesi kasir, rekonsiliasi laci kas, dual-custody refund, mutasi stok, laporan eksekutif, dan multi-outlet).

---

## 🛠️ Technology Stack

- **Frontend Core:** React 18, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, shadcn/ui design tokens, Lucide React
- **Routing:** React Router v6 (`HashRouter` untuk kompatibilitas penuh GitHub Pages)
- **State Management:** Zustand, TanStack Query (React Query)
- **Forms & Validation:** React Hook Form, Zod
- **Visuals & Charts:** Recharts
- **Interactions:** dnd-kit (Kanban Drag-and-Drop)
- **Audio API:** Web Audio API (Kitchen Chime Synthesizer)
- **Testing:** Vitest, React Testing Library, JSDOM (162 tests across 16 suites)
- **Backend & Database:** Supabase (PostgreSQL 15+, Row Level Security, Storage Buckets, RPC Functions)
- **CI/CD:** GitHub Actions (Automated Lint, Test, Vite Build, & GitHub Pages Deployment)

---

## 📂 Struktur Direktori Proyek

```
FOODPOS/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD (Lint, Test, Build, Deploy Pages)
├── public/                     # Static assets (favicon, images, audio)
├── src/
│   ├── app/                    # Root App, Providers, HashRouter config
│   ├── components/             # Shared & UI components (shadcn/ui style, error boundary, outlet switcher)
│   ├── layouts/                # Public Storefront & Backoffice Layouts
│   ├── modules/                # Domain-driven feature modules
│   │   ├── audit/              # Audit Trail & Log Viewer
│   │   ├── auth/               # Login, Guard & RBAC Sessions
│   │   ├── categories/         # Menu Category CRUD & Slugs
│   │   ├── customers/          # Customer Directory, AOV/LTV & Order History
│   │   ├── dashboard/          # Executive KPI & Live Metrics
│   │   ├── inventory/          # Stock Movement Ledger & Physical Opname
│   │   ├── orders/             # Kitchen Kanban dnd-kit, Status FSM & Order Modal
│   │   ├── payments/           # Bank Verification, Dual-Custody Refunds, Cash Drawer
│   │   ├── pos/                # High-speed Cashier Grid, Variants, Parked Bills
│   │   ├── products/           # Product Catalog, SKU & Availability
│   │   ├── public-store/       # Customer Menu, Cart, Checkout & Token Tracking
│   │   ├── reports/            # Sales Analytics, Peak Hours & CSV Export
│   │   └── settings/           # Outlet, Taxes PB1, QRIS, & Thermal Receipt Preview
│   ├── services/               # Modular Data Services & Supabase Connectors
│   ├── stores/                 # Zustand Stores (Auth, Cart)
│   ├── types/                  # TypeScript Data Models & DTOs
│   └── styles/                 # Global Tailwind Styles
├── supabase/
│   ├── migrations/             # 13 Migrasi PostgreSQL Terurut & Modular
│   └── seed.sql                # Initial Data Seed (Outlets, Roles, Menu, Staff)
├── tests/
│   └── unit/                   # 16 Test Suites (162 Unit & E2E Integration Tests)
├── docs/                       # Arsitektur Database, ERD, RLS, & Owner Bootstrap
├── DEVELOPMENT_PROGRESS.md     # Catatan Progres 100% Selesai (Phase 0 - 14)
├── CHANGELOG.md                # Riwayat Versi v1.0.0
└── package.json
```

---

## 👥 Akun Demo Staf & Hak Akses (RBAC Simulator)

Sistem dilengkapi dengan simulator akun staf bawaan untuk pengujian instan tanpa harus mengatur Supabase Auth terlebih dahulu. Klik tombol **Akun Demo Cepat** pada halaman Login Backoffice (`/#/backoffice/login`):

| Peran | Email | Kata Sandi Default | Cakupan Akses & Wewenang |
| :--- | :--- | :--- | :--- |
| **OWNER** | `owner@foodpos.local` | `DemoPassword123!` | **Akses Penuh:** Konfigurasi Sistem, Outlet Switcher, Persetujuan Refund, Manajemen Karyawan, Penyesuaian Pajak PB1, Audit Trail, dan Laporan Finansial. |
| **ADMIN** | `admin@foodpos.local` | `DemoPassword123!` | **Manajer Resto:** Manajemen Menu & Kategori, Penyesuaian Stok Opname, Persetujuan Refund Dual-Custody, Laporan Penjualan, dan Pengawasan Pesanan. |
| **CASHIER** | `cashier@foodpos.local` | `DemoPassword123!` | **Kasir POS:** Buka/Tutup Sesi Kas, Transaksi POS, Parkir Tagihan, Verifikasi Bukti Transfer, Pengajuan Refund (Wajib Disetujui Manajer/Owner). Cabang terkunci. |

---

## 🌟 Fitur Utama & Modul Sistem (Phase 0 - 14)

1. **Website Publik & Pelacakan Pesanan Pelanggan (Phase 2):**
   - Katalog menu responsif dengan filter kategori dan pencarian instan.
   - Keranjang belanja interaktif dengan kustomisasi porsi dan varian topping.
   - Checkout multi-layanan (Dine-In, Takeaway, Delivery) dengan kalkulasi otomatis pajak restoran PB1 (10%) dan ongkos kirim.
   - Pembuatan token pelacakan unik 256-bit CSPRNG (`hashTokenSHA256`) untuk keamanan privasi tanpa membutuhkan akun pelanggan.
   - Stepper pelacakan pesanan publik real-time (*Baru -> Diproses -> Siap -> Selesai*).

2. **Kasir POS Berkecepatan Tinggi (Phase 5):**
   - Grid katalog produk cepat dengan tombol pintas kategori dan pencarian SKU.
   - Pemilihan nomor meja atau pelanggan terdaftar.
   - Fitur **Tahan Tagihan (Hold & Resume Bill)** untuk menangani antrean kasir yang dinamis.
   - Kalkulator pembayaran tunai dengan validasi kembalian instan serta integrasi QRIS & EDC.
   - Cetak struk termal kasir otomatis (format 58mm & 80mm).

3. **Manajemen Pesanan & Dapur Kanban (Phase 4):**
   - Papan Kanban dapur interaktif berbasis *Drag-and-Drop* (`dnd-kit`).
   - Finite State Machine (FSM) status pesanan yang divalidasi ketat mencegah loncatan status yang tidak valid.
   - Notifikasi audio dapur otomatis (*Kitchen Chime*) berbasis Web Audio API sintetis saat ada pesanan baru.
   - Dialog pembatalan pesanan aman dengan pencatatan alasan pembatalan ke log audit.

4. **Katalog Produk, Kategori & Mutasi Stok (Phase 6 & 7):**
   - Manajemen kategori dengan auto-slug dan proteksi penghapusan jika memiliki relasi produk.
   - Manajemen produk hidangan dengan validasi keunikan SKU dan form validasi Zod.
   - Buku besar pergerakan stok (*Stock Movement Ledger*) 5 tipe transaksi (IN, OUT, ADJUSTMENT, SALE, REFUND).
   - Validasi pencegahan stok negatif dan sinkronisasi otomatis status ketersediaan dapur (*Tersedia / Habis*).

5. **Keuangan Kasir, Verifikasi Transfer & Dual-Custody Refund (Phase 8):**
   - Pembukaan dan penutupan shift laci kasir dengan rekonsiliasi kas fisik vs sistem (perhitungan selisih/discrepancy).
   - Verifikasi bukti transfer manual pelanggan bank dengan audit trail verifikator.
   - Alur refund *Dual-Custody* berstandar kepatuhan perbankan: Kasir mengajukan refund, namun tidak dapat menyetujui refund buatannya sendiri (*anti-self-approval rule*). Persetujuan wajib dilakukan oleh Manajer (Admin) atau Owner.

6. **Analitik Penjualan & Laporan Eksekutif (Phase 10):**
   - Filter rentang waktu: Hari Ini, 7 Hari, 30 Hari, Bulan Ini, dan Semua Periode.
   - 4 Kartu KPI: Total Omset Kotor, Penjualan Bersih, Total Pajak PB1, dan Rata-rata Nilai Belanja (AOV).
   - Visualisasi Recharts interaktif: Tren Penjualan Harian, Analisis Jam Sibuk Restoran (*Peak Hours*), Komposisi Metode Pembayaran, dan Komposisi Kanal POS vs Online.
   - Tabel Top 10 Menu Terlaris dan ekspor data laporan ke format CSV.

7. **Konfigurasi Toko & Kesiapan Multi-Outlet (Phase 11 & 13):**
   - Simulasi kalkulasi pajak PB1 dan biaya layanan dinamis real-time.
   - Pratinjau struk termal interaktif (*Live Thermal Receipt Preview*) dengan gaya sobekan zigzag retro.
   - Multi-Outlet Switcher di header Backoffice (Senopati, Kemang, Bandung) dengan isolasi data per cabang.
   - Detektor status jaringan online/offline dengan pemberitahuan floating pill.
   - Komponen penanganan error runtime (*React Error Boundary*).

8. **Log Audit & Pusat Notifikasi (Phase 12):**
   - Pencatatan seluruh mutasi data sensitif dengan masking otomatis (password, token, apiKey, PIN).
   - Modal inspeksi detail payload JSON dengan syntax highlighter dan tombol salin ke clipboard.
   - Pusat notifikasi lonceng interaktif topbar dengan lencana jumlah pesan belum dibaca.

9. **Pengujian E2E & CI/CD Pipeline (Phase 14):**
   - 162 pengujian lulus (100% passing) di 16 berkas test suite Vitest.
   - Pipeline GitHub Actions otomatis untuk linting, eksekusi test, kompilasi build produksi, dan deployment GitHub Pages.

---

## 🚀 Panduan Instalasi & Pengembangan Lokal

### 1. Prasyarat Sistem
- **Node.js:** Versi LTS (v20+ atau v24+)
- **npm:** Versi 10+
- **Git**
- *(Opsional)* Akun Supabase ([supabase.com](https://supabase.com)) untuk koneksi backend cloud.

### 2. Kloning & Instalasi Paket
```bash
git clone https://github.com/owner/foodpos.git
cd FOODPOS
npm install
```

### 3. Konfigurasi Environment
Salin berkas blueprint `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi konfigurasi berikut sesuai proyek Supabase Anda:
```env
VITE_APP_NAME=FOODPOS
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> **Catatan:** Jika variabel lingkungan Supabase dibiarkan kosong, sistem secara otomatis beralih ke **Mode Simulator Lokal Cerdas** menggunakan penyimpanan peramban (`localStorage`), sehingga aplikasi tetap dapat diuji coba 100% tanpa hambatan.

### 4. Eksekusi Skrip Database Supabase
Jika menghubungkan ke instance Supabase PostgreSQL, jalankan berkas migrasi pada direktori `supabase/migrations/` secara berurutan di SQL Editor Supabase:
1. `20261109000001_extensions_and_helpers.sql`
2. `20261109000002_outlets_and_identity.sql`
3. `20261109000003_roles_and_permissions.sql`
4. `20261109000004_product_catalog.sql`
5. `20261109000005_customers.sql`
6. `20261109000006_orders_and_items.sql`
7. `20261109000007_payments_and_refunds.sql`
8. `20261109000008_inventory.sql`
9. `20261109000009_cash_sessions_and_expenses.sql`
10. `20261109000010_settings_notifications_audit.sql`
11. `20261109000011_rls_policies.sql`
12. `20261109000012_storage_and_bootstrap.sql`
13. `20261109000013_create_online_order_rpc.sql`
14. `supabase/seed.sql` *(Memasukkan data outlet awal, role, wewenang, dan katalog menu)*.

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka tautan lokal di browser: `http://localhost:5173`.

---

## 🧪 Eksekusi Pengujian & Verifikasi Kualitas

Sistem FOODPOS diuji secara ketat untuk menjamin keandalan sistem transaksi:

```bash
# 1. Menjalankan seluruh pengujian unit & E2E (162 tests)
npm run test

# 2. Menjalankan pemeriksaan format & linter ESLint 9
npm run lint

# 3. Menjalankan typecheck TypeScript & kompilasi produksi Vite
npm run build
```

---

## 🚢 Penerapan Produksi (GitHub Pages CI/CD)

Aplikasi telah dikonfigurasi untuk rilis otomatis ke **GitHub Pages** melalui GitHub Actions Workflow:
1. Pastikan fitur **GitHub Pages** pada repositori telah diatur ke sumber **GitHub Actions** (`Settings > Pages > Build and deployment > Source: GitHub Actions`).
2. Setiap kali melakukan push ke cabang `main` atau `master`, workflow `.github/workflows/deploy.yml` akan secara otomatis mengeksekusi pemeriksaan dependensi, linter, 162 unit tests, proses build produksi Vite, dan mempublikasikan artefak ke GitHub Pages.

---

## 📄 Lisensi
Hak Cipta © 2026 Tim FOODPOS. Didistribusikan di bawah lisensi MIT.
