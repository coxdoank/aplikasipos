# CHANGELOG — FOODPOS

All notable changes to the FOODPOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.7.0] - 2026-11-10
### Phase 6 — Product, Category, and Catalog Management

#### Added
- **Service Layer Manajemen Katalog (`src/services/catalogService.ts`):**
  - CRUD Kategori dengan auto-slug generator dan proteksi pencegahan penghapusan kategori berproduk.
  - CRUD Produk Menu dengan validasi kode SKU unik, relasi kategori, deskripsi, dan stok fisik.
  - Pengelolaan dinamis varian porsi (`ProductVariantItem`) dan topping add-on (`ProductAddonItem`).
  - Toggle cepat 1-klik untuk status ketersediaan dapur (*Tersedia / Habis*) dan status visibilitas menu (*Aktif / Nonaktif*).
  - Sinkronisasi persistensi ganda (`localStorage` dan Supabase PostgreSQL).
- **Halaman Manajemen Kategori Menu (`CategoriesPage.tsx` & `CategoryModal.tsx`):**
  - Tabel kategori dengan urutan prioritas tampilan, badge slug, jumlah produk terhubung, dan status aktif.
  - Form modal pembuatan/pengubahan kategori dengan validasi Zod & React Hook Form.
- **Halaman Katalog Produk & Menu Backoffice (`ProductsPage.tsx` & `ProductModal.tsx`):**
  - Ringkasan KPI: Total Menu, Menu Aktif, Menu Tersedia, dan Menu Habis.
  - Toolbar pencarian nama/SKU, filter kategori menu, filter ketersediaan dapur, dan opsi pengurutan (A-Z, Harga Rendah/Tinggi).
  - Modal form produk 3 tab: Informasi & Stok, Varian Porsi, dan Topping / Add-on.
  - Tombol reset katalog default untuk pengujian operasional.
  - Proteksi otorisasi berbasis wewenang `products.view` dan `products.manage`.
- **Pengujian Unit & Integrasi Phase 6 (`tests/unit/phase6_catalog.test.tsx`):**
  - 17 pengujian menyeluruh untuk validasi integritas katalog, penolakan SKU duplikat, dan interaksi form UI.

---

## [0.6.0] - 2026-11-10
### Phase 5 — Point of Sale (POS) Cashier Interface

#### Added
- **State Management Kasir POS (`src/stores/posStore.ts`):**
  - Penyimpanan keranjang kasir terisolasi di `localStorage` dengan penanganan composite key.
  - Pengaturan info pelanggan, nomor meja (*Meja 01 - 10, Bar, VIP, Outdoor*), dan tipe layanan (*Dine-in, Takeaway, Delivery, Pickup*).
  - Perhitungan diskon multi-tipe (persentase & nominal), Pajak Restoran PB1 (10%), dan Grand Total.
  - Fitur **Tahan & Lanjutkan Pesanan (*Hold Bill / Parked Carts*)** untuk fleksibilitas antrean kasir.
- **Grid Menu Cepat Kasir (`PosProductGrid.tsx`):**
  - Filter kategori responsif, pencarian cepat nama/SKU, dan deteksi kustomisasi varian.
- **Modal Kustomisasi Varian & Add-on (`PosItemModal.tsx`):**
  - Pemilihan varian porsi, topping tambahan, catatan koki, dan perhitungan instan harga item.
- **Modal Pengaturan Meja & Tamu (`PosCustomerModal.tsx`):**
  - Modal cepat pengaturan nama pemesan, nomor HP, nomor meja, dan catatan umum pesanan.
- **Modal Antrean Pesanan Ditahan (`PosParkedBillsModal.tsx`):**
  - Daftar transaksi yang sedang diparkir dengan opsi *Resume* dan *Delete*.
- **Modal Pembayaran Kasir POS Komprehensif (`PosPaymentModal.tsx`):**
  - Mode Tunai (Cash) dengan kalkulator uang kertas (+10k, +20k, +50k, +100k, Uang Pas) dan validasi kembalian.
  - Mode QRIS dengan simulasi visual QR Code dan verifikasi nomor transaksi.
  - Mode Mesin EDC / Kartu Debit & Kredit dengan approval code.
  - Mode Transfer Bank dengan rekening kasir.
  - Registrasi pesanan resmi ke antrean dapur berstatus `PROCESSING` dan pembayaran `PAID`.
- **Modal Umpan Balik Sukses Kasir (`PosSuccessModal.tsx`):**
  - Tampilan kembalian pelanggan, pencetakan struk fisik termal 58/80mm, dan tombol pesanan baru.
- **Pengujian Unit & Integrasi Phase 5 (`tests/unit/phase5_pos.test.tsx`):**
  - 13 pengujian menyeluruh untuk kalkulasi diskon/pajak, Hold & Resume, interaksi kasir, dan pembayaran.

---

## [0.5.0] - 2026-11-09
### Phase 4 — Order Management and Kanban

#### Added
- **Order Service Layer (`src/services/orderService.ts`):**
  - Mesin status pesanan ketat (*Finite State Machine*): `NEW` -> `PROCESSING` -> `READY` -> `COMPLETED`.
  - Pembatalan pesanan terotorisasi (`orders.cancel`) dari setiap status non-terminal dengan alasan wajib.
  - Audit trail perubahan status tersimpan di `order_status_history` dengan catatan operator dan waktu.
  - Generator notifikasi audio dapur (*Kitchen Chime*) berbasis Web Audio API tanpa berkas eksternal.
  - Sinkronisasi otomatis pesanan baru dari pemesanan online publik ke antrean backoffice.
- **Papan Kanban Pesanan (`OrderKanban.tsx`):**
  - 4 kolom antrean status: Pesanan Baru, Sedang Dimasak, Siap Saji/Kirim, dan Selesai.
  - Drag-and-drop antar kolom dan tombol aksi cepat 1-klik untuk operasional tablet/layar sentuh.
  - Kartu pesanan lengkap dengan nomor order, saluran, tipe layanan, waktu tunggu urgensi, dan total harga.
- **Tampilan Tabel Pesanan Responsif (`OrdersPage.tsx`):**
  - Switcher mode Kanban vs Tabel responsif.
  - Kartu ringkasan KPI dan filter cepat status pesanan.
  - Filter saluran (Online/POS), jenis layanan (Dine-in, Takeaway, Delivery, Pickup), dan urutan waktu.
  - Fitur *live polling* berkala untuk mendeteksi pesanan online baru dengan *kitchen chime* dan toast alert.
- **Modal Detail Pesanan Komprehensif (`OrderDetailModal.tsx`):**
  - Snapshot informasi pelanggan, tautan WhatsApp langsung, dan alamat pengantaran.
  - Rincian menu hidangan, varian, topping add-on, dan instruksi khusus per item.
  - Rincian finansial (subtotal, PB1 10%, ongkir, grand total) dan detail pembayaran (metode, TRX ref, status).
  - Stepper visual riwayat perjalanan status pesanan.
- **Dialog Pembatalan Pesanan (`CancelOrderDialog.tsx`):**
  - Validasi izin pembatalan (`orders.cancel`), preset alasan pembatalan, dan input alasan spesifik.
- **Modal Cetak Struk Kasir Termal (`ReceiptPrintModal.tsx`):**
  - Format struk restoran termal 58mm/80mm siap cetak (`window.print()`).
- **Pengujian Unit & Integrasi Phase 4 (`tests/unit/phase4_orders.test.tsx`):**
  - 15 pengujian menyeluruh untuk validasi transisi FSM, pembatalan, permission guard, dan rendering UI.

---

## [0.4.0] - 2026-11-09
### Phase 3 — Backoffice Foundation and Authentication

#### Added
- **State Management Autentikasi Staf (`src/stores/authStore.ts`):**
  - Zustand auth store dengan sesi persistence di `localStorage`.
  - Dukungan peran staf (`OWNER`, `ADMIN`, `CASHIER`), hak akses granular, dan outlet aktif.
- **Layanan Autentikasi (`src/services/authService.ts`):**
  - Dukungan Supabase Auth dan simulator akun demo staf (Owner, Admin, Kasir).
- **Halaman Masuk Backoffice (`LoginPage.tsx`):**
  - Login form profesional dengan tombol akses cepat akun demo staf.
- **Proteksi Rute RBAC (`ProtectedRoute.tsx` & `AccessDeniedPage.tsx`):**
  - Otentikasi dan pengecekan hak akses granular dengan halaman 403 Forbidden informatif.
- **Layout Backoffice Dinamis (`BackofficeLayout.tsx`):**
  - Sidebar dinamis tersaring berdasarkan wewenang aktif pengguna, identitas staf, dan konfirmasi logout.
- **Dashboard Backoffice (`DashboardPage.tsx`):**
  - Kartu ringkasan KPI, kontrol sesi shift kasir, dan antrean pesanan aktif.
- **Pengujian Unit Phase 3 (`tests/unit/phase3_auth_backoffice.test.tsx`):**
  - 6 unit test untuk login flow, proteksi rute, dan permission filtering.

---
### Phase 2 — Public Website

#### Added
- **State Management Keranjang Belanja:**
  - `src/stores/cartStore.ts` berbasis Zustand dengan sinkronisasi otomatis ke `localStorage`.
  - Penanganan composite cart items (varian, add-on, catatan dapur per item).
  - Kontrol kuantitas porsi, subtotal, dan total item aktif.
- **Layanan Katalog & Token Keamanan:**
  - `src/services/storeService.ts` untuk memuat kategori, produk, varian, dan add-on.
  - Generator token acak berentropi 256-bit (CSPRNG) dan hashing SHA-256 via Web Crypto API.
  - Fallback data katalog & simulator pesanan lokal yang responsif.
- **Modal Interaktif Detail Produk:**
  - `src/modules/public-store/components/ProductDetailModal.tsx` dengan pilihan varian porsi (radio button), topping tambahan (checkbox), catatan instruksi dapur, dan penghitungan harga total instan.
- **Halaman Katalog Menu Publik (`MenuPage`):**
  - Penyaringan kategori menu, pencarian nama/deskripsi realtime, status stok fisik, dan tombol pesan langsung.
- **Halaman Keranjang (`CartPage`):**
  - Rincian pesanan lengkap, kontrol jumlah, estimasi pajak restoran (PB1 10%), dan navigasi checkout.
- **Halaman Checkout (`CheckoutPage`):**
  - Validasi data pemesan (nama dan nomor WhatsApp).
  - Opsi layanan: Dine-in, Takeaway, Delivery (ongkir Rp 10.000 + alamat wajib), Pickup.
  - Metode pembayaran: QRIS Statis, Transfer Bank BCA, Tunai, Kartu Debit/EDC.
  - Proteksi pencegahan transaksi ganda (submitting state loader).
- **Halaman Konfirmasi Pesanan (`OrderConfirmationPage`):**
  - Rincian Nomor Pesanan (`ORD-2026...`), status pesanan, dan status pembayaran.
  - Petunjuk pembayaran QRIS statis, rekening transfer BCA, atau tunai di kasir.
  - Kotak Token Akses Pelacakan Rahasia 256-bit dengan tombol salin dan tautan lacak langsung.
- **Halaman Pelacakan Pesanan Tamu (`TrackOrderPage`):**
  - Pelacakan pesanan tanpa akun dengan verifikasi hash token SHA-256 via RPC `track_order_by_token`.
  - Stepper visual progres (NEW -> PROCESSING -> READY -> COMPLETED), snapshot menu, dan riwayat status.
- **Halaman Beranda (`HomePage`):**
  - Banner hero, banner promosi diskon 15%, teaser menu unggulan, nilai keunggulan, ulasan pelanggan, jam operasional, dan kontak WhatsApp.
- **Database Server-Side RPC Migration:**
  - `supabase/migrations/20261109000013_create_online_order_rpc.sql` untuk pembuatan pesanan terotorisasi, validasi stok, pemotongan stok otomatis, dan pencatatan pergerakan stok.
- **Pengujian Unit & UI Integration:**
  - `tests/unit/phase2_public_website.test.tsx` (5 tests)
  - `tests/unit/phase2_ui_integration.test.tsx` (4 tests)

---

## [0.2.0] - 2026-11-09
### Phase 1 — Database & Supabase Foundation
- Arsitektur PostgreSQL 28 tabel domain bisnis multi-outlet isolation.
- 12 berkas migrasi modular di `supabase/migrations/` dan initial seed data di `supabase/seed.sql`.
- Row Level Security (RLS) di seluruh tabel publik, partial unique index untuk single full payment, dan constraint segregasi refund.
- Konfigurasi Supabase Storage: bucket publik `product-images` dan bucket privat `payment-proofs`.
- Prosedur server-side `bootstrap_initial_owner` dan RPC `track_order_by_token`.
- Dokumentasi lengkap di `docs/database/` dan `docs/security/`.

---

## [0.1.0] - 2026-11-09
### Phase 0 — Project Foundation and Environment
- Inisialisasi arsitektur Modular Monolithic SPA menggunakan React 18, TypeScript, dan Vite.
- Konfigurasi Tailwind CSS, routing HashRouter, Public Layout, Backoffice Layout, dan halaman awal.
- Vitest unit testing, ESLint configuration, dan GitHub Actions CI/CD setup.
