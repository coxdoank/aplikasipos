# CHANGELOG — FOODPOS

All notable changes to the FOODPOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-11-09
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
