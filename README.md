# FOODPOS — Integrated Point of Sale & Restaurant Management System

FOODPOS adalah sistem Point of Sale (POS) dan manajemen operasional restoran modern berbasis **Modular Monolithic Single Page Application (SPA)**. Dirancang untuk kecepatan transaksi kasir, keteraturan alur dapur, pelacakan pesanan publik yang aman, serta integrasi manajemen keuangan dan inventori produk siap saji.

---

## 🛠️ Technology Stack

- **Frontend Core:** React 18, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, shadcn/ui design tokens, Lucide React
- **Routing:** React Router v6 (`HashRouter` untuk kompatibilitas GitHub Pages)
- **State Management:** Zustand, TanStack Query (React Query)
- **Forms & Validation:** React Hook Form, Zod
- **Visuals & Charts:** Recharts
- **Interactions:** dnd-kit
- **Testing:** Vitest, React Testing Library, JSDOM
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Storage, Edge Functions)

---

## 📂 Struktur Project

```
FOODPOS/
├── public/                 # Static assets
├── src/
│   ├── app/                # Router, providers, configuration
│   ├── components/         # Shared & UI components (shadcn/ui style)
│   ├── layouts/            # Public & Backoffice layouts
│   ├── modules/            # Domain-driven feature modules
│   │   ├── auth/           # Login & session management
│   │   ├── dashboard/      # Executive KPIs & real-time monitor
│   │   ├── public-store/   # Customer storefront & tracking
│   │   ├── orders/         # Kitchen & orders Kanban
│   │   ├── pos/            # Fast cashier POS & payments
│   │   ├── products/       # Products & variants catalog
│   │   ├── categories/     # Menu categorization
│   │   ├── inventory/      # Finished goods stock tracking
│   │   ├── customers/      # Customer history & profiles
│   │   ├── payments/       # Verification, refunds, and events
│   │   ├── finance/        # Cashier shift & expenses
│   │   ├── reports/        # Analytics & sales reports
│   │   ├── notifications/  # System & order alerts
│   │   ├── users/          # Staff roles & permissions
│   │   └── settings/       # Store & tax configuration
│   ├── services/           # Supabase & API services
│   ├── hooks/              # Custom reusable hooks
│   ├── stores/             # Global Zustand stores
│   ├── lib/                # Utilities, helpers, and Supabase client
│   ├── types/              # TypeScript declarations & database types
│   └── styles/             # Global styles & Tailwind entry
├── supabase/
│   ├── config.toml         # Supabase CLI configuration
│   ├── migrations/         # 12 Migrasi PostgreSQL terurut & modular
│   ├── functions/          # Edge Functions (Checkout, Tracking, etc.)
│   └── seed.sql            # Initial data seed (outlet, roles, permissions, menu)
├── tests/
│   ├── unit/               # Unit tests (Vitest)
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end test scenarios
├── docs/
│   ├── database/           # ERD, Data Dictionary, RLS Matrix, Storage Policies
│   └── security/           # Secure Owner Bootstrap procedure
├── .github/workflows/      # GitHub Actions CI/CD workflows
├── .env.example            # Environment variables blueprint
└── package.json
```

---

## 📚 Dokumentasi Database (Phase 1)
- [Diagram Relasi Entitas (ERD)](file:///d:/Projects/FOODPOS/docs/database/ERD.md)
- [Kamus Data (Data Dictionary)](file:///d:/Projects/FOODPOS/docs/database/DATA_DICTIONARY.md)
- [Prinsip Desain Database & Snapshot](file:///d:/Projects/FOODPOS/docs/database/DATABASE_DESIGN.md)
- [Matriks Row Level Security (RLS Matrix)](file:///d:/Projects/FOODPOS/docs/database/RLS_MATRIX.md)
- [Kebijakan Penyimpanan (Storage Policies)](file:///d:/Projects/FOODPOS/docs/database/STORAGE_POLICIES.md)
- [Panduan Pembuatan Akun Owner (Owner Bootstrap)](file:///d:/Projects/FOODPOS/docs/security/OWNER_BOOTSTRAP.md)

---

## 📚 Status Pengembangan & Fitur Selesai
- **Phase 0:** Fondasi project React 18, TypeScript, Vite, Tailwind CSS, shadcn design tokens, HashRouter.
- **Phase 1:** Fondasi Database Supabase PostgreSQL 28 tabel, 12 migrasi SQL, RLS komprehensif, multi-outlet, dan Owner bootstrap.
- **Phase 2:** Website Publik (Katalog Menu, Keranjang Zustand, Checkout dengan PB1 & Delivery, Token Pelacakan CSPRNG 256-bit, Stepper Status).
- **Phase 3:** Backoffice & Autentikasi RBAC (Zustand Auth Store, Proteksi Rute `ProtectedRoute`, 403 Forbidden, Demo Staff accounts, Dashboard KPI).
- **Phase 4:** Manajemen Pesanan & Kanban (Papan Kanban Drag-and-Drop, FSM Status Mesin, Riwayat Audit Perjalanan Status, Notifikasi Audio Chime Web Audio API, Modal Detail Pesanan Komprehensif, Dialog Pembatalan Aman, Pratinjau Cetak Struk Kasir Termal 58/80mm).
- **Phase 5:** Antarmuka Kasir POS (Fast-checkout Grid, Kustomisasi Varian & Topping, Pemilihan Meja & Tipe Layanan, Diskon & PB1 10%, Fitur Tahan Pesanan/Hold Bill, Modal Pembayaran Multi-Metode Tunai/QRIS/EDC, Validasi Kembalian, dan Cetak Struk Instan).
- **Phase 6:** Manajemen Produk, Kategori & Katalog Menu (CRUD Kategori dengan Auto-slug & Proteksi Hapus, CRUD Menu Hidangan dengan SKU Unik & Zod Form, Pengelolaan Dinamis Varian Porsi & Topping Tambahan, Toggle Cepat Ketersediaan Dapur Tersedia/Habis, dan Kontrol Hak Akses `products.manage`).
- **Phase 7:** Inventori Produk Siap Jual & Mutasi Stok (Buku Besar/Ledger Pergerakan Stok 5 Tipe IN/OUT/ADJUSTMENT/SALE/REFUND, Validasi Anti-Stok Negatif, Penyesuaian Opname Fisik dengan Live Preview, Sinkronisasi Otomatis Status Ketersediaan Habis/Tersedia, 4 KPI Inventori, serta Proteksi Wewenang `inventory.adjust`).
- **Phase 8:** Manajemen Pembayaran & Keuangan Sesi Kasir (Verifikasi Bukti Transfer Manual, Alur Refund Dual-Custody Anti-Self-Approval, Buka/Tutup Shift Kasir dengan Rekonsiliasi Kas di Laci, Pencatatan Petty Cash Masuk/Keluar, dan Dashboard Pembayaran 3 Tab).
- **Phase 9:** Manajemen & Direktori Pelanggan (Database Profil Pelanggan Guest vs Terdaftar, Validasi Keunikan Kontak, Proteksi Penghapusan Berdasarkan Riwayat Transaksi, Metrik LTV & AOV per Pelanggan, Modal Riwayat Pesanan Lengkap, serta Navigasi Menu Pelanggan).
- **Phase 10:** Analitik Backoffice, Laporan Penjualan & Business Insights (Filter Periode Waktu Fleksibel, 4 KPI Penjualan & Pajak PB1, Visualisasi Grafik Recharts Tren Harian & Jam Sibuk, Analisis Metode Pembayaran & Kanal POS vs Online, Tabel Top 10 Menu Terlaris, serta Ekspor Laporan CSV).
- **Phase 11:** Pengaturan Sistem & Konfigurasi Toko (Profil Restoran & Outlet, Tarif Pajak PB1 & Service Charge dengan Simulasi Real-Time, Konfigurasi Pembayaran QRIS/Bank, Template Cetak Struk POS 58/80mm dengan Live Thermal Preview, dan Kontrol Wewenang `settings.manage`).
- **Phase 12:** Log Audit, Keamanan & Pusat Notifikasi (Audit Trail Aktivitas Operasional & Keuangan, Sanitasi Otomatis Data Sensitif/Password, Ekspor CSV Audit, Lonceng Notifikasi Interaktif Topbar dengan Lencana Reaktif, Halaman Audit Backoffice dengan Modal Inspeksi JSON, serta Proteksi Wewenang `audit.view`).

---

## 🚀 Panduan Instalasi & Pengembangan Lokal

### 1. Prasyarat
- Node.js LTS (v20+ direkomendasikan)
- npm (v10+)
- Git
- Akun Supabase ([supabase.com](https://supabase.com))

### 2. Instalasi Dependency
```bash
git clone <repository-url>
cd FOODPOS
npm install
```

### 3. Konfigurasi Environment
Salin template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi kredensial Supabase Anda dari dashboard Supabase:
```env
VITE_APP_NAME=FOODPOS
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Eksekusi Migrasi Database ke Supabase
Jalankan berkas migrasi pada direktori `supabase/migrations/` secara berurutan pada Supabase SQL Editor atau melalui Supabase CLI:
```bash
# Melalui Supabase SQL Editor:
# Jalankan berkas 20261109000001 hingga 20261109000012, lalu jalankan supabase/seed.sql
```

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses `http://localhost:5173`.

### 6. Pengujian & Quality Check
```bash
npm run test    # Menjalankan seluruh unit tests
npm run lint    # Memeriksa standard kode ESLint
npm run build   # Menguji build produksi TypeScript & Vite
```
