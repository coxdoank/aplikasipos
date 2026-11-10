# FOODPOS — Integrated Point of Sale & Restaurant Management System

[![Build & Deploy](https://github.com/coxdoank/aplikasipos/actions/workflows/deploy.yml/badge.svg)](https://github.com/coxdoank/aplikasipos/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-emerald.svg)](https://github.com/coxdoank/aplikasipos)
[![Tests](https://img.shields.io/badge/tests-164%20passed-success.svg)](https://github.com/coxdoank/aplikasipos)
[![Production URL](https://img.shields.io/badge/live-GitHub%20Pages-blue.svg)](https://coxdoank.github.io/aplikasipos/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **Aplikasi Live Production:** [https://coxdoank.github.io/aplikasipos/](https://coxdoank.github.io/aplikasipos/)

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
- **Testing:** Vitest, React Testing Library, JSDOM (164 tests across 16 suites)
- **Backend & Database:** Supabase Cloud (PostgreSQL 15+, Row Level Security, Storage Buckets, RPC Functions)
- **CI/CD:** GitHub Actions (Automated Lint, Test, Vite Build, & GitHub Pages Deployment)

---

## 📂 Struktur Direktori Proyek

```
FOODPOS/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD (Lint, Test, Build, Deploy Pages)
├── public/
│   └── favicon.svg             # Branded FOODPOS SVG Favicon
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
│   └── unit/                   # 16 Test Suites (164 Unit & E2E Integration Tests)
├── docs/                       # Arsitektur Database, ERD, RLS, & Owner Bootstrap
├── DEVELOPMENT_PROGRESS.md     # Catatan Progres 100% Selesai (Phase 0 - 14)
├── CHANGELOG.md                # Riwayat Versi v1.0.0
└── package.json
```

---

## 👥 Struktur Peran & Hak Akses (RBAC)

Autentikasi staf dikelola secara aman menggunakan **Supabase Auth** terintegrasi dengan tabel `profiles`, `user_roles`, dan `role_permissions` di PostgreSQL. Akses masuk hanya dapat dilakukan melalui kredensial resmi staf pada halaman Login Backoffice (`/#/backoffice/login`):

| Peran | Tingkat Otoritas | Cakupan Akses & Wewenang |
| :--- | :--- | :--- |
| **OWNER** | Pemilik Bisnis (Akses Tertinggi) | **Akses Penuh:** Konfigurasi Sistem, Outlet Switcher, Persetujuan Refund, Manajemen Karyawan, Penyesuaian Pajak PB1, Audit Trail, dan Laporan Finansial. |
| **ADMIN** | Manajer Restoran | **Manajer Resto:** Manajemen Menu & Kategori, Penyesuaian Stok Opname, Persetujuan Refund Dual-Custody, Laporan Penjualan, dan Pengawasan Pesanan. |
| **CASHIER** | Kasir Operasional | **Kasir POS:** Buka/Tutup Sesi Kas, Transaksi POS, Parkir Tagihan, Verifikasi Bukti Transfer, Pengajuan Refund (Wajib Disetujui Manajer/Owner). Cabang terkunci. |

---

## 🌟 Fitur Utama & Modul Sistem

1. **Website Publik & Pelacakan Pesanan Pelanggan:**
   - Katalog menu responsif dengan filter kategori dan pencarian instan.
   - Keranjang belanja interaktif dengan kustomisasi porsi dan varian topping.
   - Checkout multi-layanan (Dine-In, Takeaway, Delivery) dengan kalkulasi otomatis pajak restoran PB1 (10%) dan ongkos kirim.
   - Pembuatan token pelacakan unik 256-bit CSPRNG (`hashTokenSHA256`) untuk keamanan privasi tanpa membutuhkan akun pelanggan.
   - Stepper pelacakan pesanan publik real-time (*Baru -> Diproses -> Siap -> Selesai*).

2. **Kasir POS Berkecepatan Tinggi:**
   - Grid katalog produk cepat dengan tombol pintas kategori dan pencarian SKU.
   - Pemilihan nomor meja atau pelanggan terdaftar.
   - Fitur **Tahan Tagihan (Hold & Resume Bill)** untuk menangani antrean kasir yang dinamis.
   - Kalkulator pembayaran tunai dengan validasi kembalian instan serta integrasi QRIS & EDC.
   - Cetak struk termal kasir otomatis (format 58mm & 80mm).

3. **Manajemen Pesanan & Dapur Kanban:**
   - Papan Kanban dapur interaktif berbasis *Drag-and-Drop* (`dnd-kit`).
   - Finite State Machine (FSM) status pesanan yang divalidasi ketat mencegah loncatan status yang tidak valid.
   - Notifikasi audio dapur otomatis (*Kitchen Chime*) berbasis Web Audio API sintetis saat ada pesanan baru.
   - Dialog pembatalan pesanan aman dengan pencatatan alasan pembatalan ke log audit.

4. **Katalog Produk, Kategori & Mutasi Stok:**
   - Manajemen kategori dengan auto-slug dan proteksi penghapusan jika memiliki relasi produk.
   - Manajemen produk hidangan dengan validasi keunikan SKU dan form validasi Zod.
   - Buku besar pergerakan stok (*Stock Movement Ledger*) 5 tipe transaksi (IN, OUT, ADJUSTMENT, SALE, REFUND).
   - Validasi pencegahan stok negatif dan sinkronisasi otomatis status ketersediaan dapur (*Tersedia / Habis*).

5. **Keuangan Kasir, Verifikasi Transfer & Dual-Custody Refund:**
   - Pembukaan dan penutupan shift laci kasir dengan rekonsiliasi kas fisik vs sistem (perhitungan selisih/discrepancy).
   - Verifikasi bukti transfer manual pelanggan bank dengan audit trail verifikator.
   - Alur refund *Dual-Custody* berstandar kepatuhan perbankan: Kasir mengajukan refund, namun tidak dapat menyetujui refund buatannya sendiri (*anti-self-approval rule*). Persetujuan wajib dilakukan oleh Manajer (Admin) atau Owner.

6. **Analitik Penjualan & Laporan Eksekutif:**
   - Filter rentang waktu: Hari Ini, 7 Hari, 30 Hari, Bulan Ini, dan Semua Periode.
   - 4 Kartu KPI: Total Omset Kotor, Penjualan Bersih, Total Pajak PB1, dan Rata-rata Nilai Belanja (AOV).
   - Visualisasi Recharts interaktif: Tren Penjualan Harian, Analisis Jam Sibuk Restoran (*Peak Hours*), Komposisi Metode Pembayaran, dan Komposisi Kanal POS vs Online.
   - Tabel Top 10 Menu Terlaris dan ekspor data laporan ke format CSV.

7. **Konfigurasi Toko & Kesiapan Multi-Outlet:**
   - Simulasi kalkulasi pajak PB1 dan biaya layanan dinamis real-time.
   - Pratinjau struk termal interaktif (*Live Thermal Receipt Preview*) dengan gaya sobekan zigzag retro.
   - Multi-Outlet Switcher di header Backoffice (Senopati, Kemang, Bandung) dengan isolasi data per cabang.
   - Detektor status jaringan online/offline dengan pemberitahuan floating pill.
   - Komponen penanganan error runtime (*React Error Boundary*).

8. **Log Audit & Pusat Notifikasi:**
   - Pencatatan seluruh mutasi data sensitif dengan masking otomatis (password, token, apiKey, PIN).
   - Modal inspeksi detail payload JSON dengan syntax highlighter dan tombol salin ke clipboard.
   - Pusat notifikasi lonceng interaktif topbar dengan lencana jumlah pesan belum dibaca.

---

## 🚀 Konfigurasi CI/CD & GitHub Pages Deployment

### 1. Konfigurasi Repository Secrets di GitHub
Agar GitHub Actions dapat menyematkan kredensial Supabase Cloud saat mengompilasi frontend:
1. Buka repositori GitHub: `https://github.com/coxdoank/aplikasipos/settings/secrets/actions`.
2. Klik tombol **New repository secret**.
3. Tambahkan 2 secret berikut:
   - **`VITE_SUPABASE_URL`**: URL instance Supabase Anda (misal: `https://your-project-id.supabase.co`).
   - **`VITE_SUPABASE_ANON_KEY`**: Supabase Publishable Key / Anon Key publik dari dashboard Supabase.

### 2. Konfigurasi GitHub Pages
1. Buka menu **Settings > Pages** pada repositori GitHub.
2. Di bawah **Build and deployment > Source**, pilih **GitHub Actions**.
3. Setiap kali ada commit baru yang di-push ke branch `main`, GitHub Actions akan menjalankan linting, 164 unit tests, proses build produksi, dan merilis langsung ke:
   `https://coxdoank.github.io/aplikasipos/`

---

## 🔒 Konfigurasi Izin Database Supabase (PostgreSQL Grants)

Jika API REST Supabase mengembalikan pesan `permission denied for table ... (42501)`, jalankan skrip SQL non-destruktif berikut melalui **Supabase SQL Editor** untuk mengizinkan role `anon` dan `authenticated` mengakses tabel sesuai aturan RLS yang berlaku:

```sql
-- 1. Izin penggunaan skema publik
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Izin SELECT untuk katalog publik (dibatasi oleh RLS is_active = true)
GRANT SELECT ON public.outlets TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.product_addons TO anon, authenticated;
GRANT SELECT ON public.tax_settings TO anon, authenticated;
GRANT SELECT ON public.service_charge_settings TO anon, authenticated;
GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;

-- 3. Izin untuk staf yang terautentikasi (sepenuhnya dikendalikan oleh kebijakan RLS per peran)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
```

---

## 🧪 Eksekusi Pengujian & Verifikasi Kualitas

Sistem FOODPOS diuji secara ketat untuk menjamin keandalan sistem transaksi:

```bash
# 1. Menjalankan seluruh pengujian unit & E2E (164 tests)
npm run test

# 2. Menjalankan pemeriksaan format & linter ESLint 9
npm run lint

# 3. Menjalankan typecheck TypeScript & kompilasi produksi Vite
npm run build
```

---

## 📄 Lisensi
Hak Cipta © 2026 Tim FOODPOS. Didistribusikan di bawah lisensi MIT.
