# DEVELOPMENT PROGRESS — FOODPOS

## Current Phase: PHASE 2 — Public Website

### Status: COMPLETED & AWAITING USER APPROVAL ("Lanjut")

---

### 1. Pekerjaan Selesai (Completed Tasks - Phase 2)
- [x] **State Management Keranjang Publik (Zustand Cart Store):**
  - Implementasi `src/stores/cartStore.ts` dengan persistensi `localStorage`.
  - Dukungan composite item ID (`productId_variantId_addonIds`).
  - Penambahan item, pembaruan kuantitas (+ / -), penghapusan item individual, pengosongan keranjang dengan dialog konfirmasi.
  - Perhitungan subtotal, estimasi pajak restoran (PB1 10%), dan jumlah item aktif secara realtime.
- [x] **Layanan Data Publik & Enkripsi Token (Store Service):**
  - Implementasi `src/services/storeService.ts`.
  - Generator token acak berentropi tinggi 256-bit (CSPRNG 32 byte) dengan format `trk_<hex64>`.
  - Fungsi hashing SHA-256 via Web Crypto API (`crypto.subtle.digest`) untuk menjamin token disimpan dalam bentuk hash satu arah di database.
  - Fallback data katalog & simulator pesanan lokal yang cepat saat lingkungan Supabase remote belum tersinkronisasi.
- [x] **Modal Kustomisasi Produk (`ProductDetailModal`):**
  - Modal interaktif pemilihan varian menu (radio button dengan penyesuaian harga).
  - Pilihan topping / add-ons (checkbox multi-select dengan harga masing-masing).
  - Kontrol jumlah porsi (+ / -) dengan proteksi batas stok fisik.
  - Catatan khusus per menu untuk instruksi dapur.
  - Perhitungan harga total dinamis pada tombol aksi.
- [x] **Halaman Katalog Menu Interaktif (`MenuPage`):**
  - Kategori menu pills dengan indikator jumlah menu.
  - Filter pencarian teks realtime pada nama dan deskripsi menu.
  - Kartu produk modern dengan status ketersediaan stok, badge porsi tersisa, dan tombol pemesanan langsung.
- [x] **Halaman Keranjang Belanja (`CartPage`):**
  - Daftar item pesanan dengan rincian varian, topping terpilih, dan catatan dapur.
  - Kontrol kuantitas porsi langsung di keranjang.
  - Ringkasan tagihan kotor, kalkulasi pajak restoran 10%, dan navigasi ke checkout.
  - Tampilan *empty state* informatif.
- [x] **Halaman Checkout Pesanan (`CheckoutPage`):**
  - Validasi form data pelanggan (Nama Lengkap dan Nomor WhatsApp valid).
  - Pilihan opsi layanan: Dine-in, Takeaway, Delivery (ongkir flat Rp 10.000 dengan input alamat wajib), Pickup.
  - Pilihan metode pembayaran: QRIS Statis, Transfer Bank BCA, Tunai, Kartu Debit/EDC.
  - Catatan instruksi pengantaran / pesanan.
  - Pencegahan pengiriman ganda (*submitting loader*).
- [x] **Halaman Konfirmasi Pesanan (`OrderConfirmationPage`):**
  - Menampilkan Nomor Pesanan unik (contoh: `ORD-20261109-XXXX`).
  - Menampilkan rincian status pesanan (`NEW`) dan status pembayaran.
  - Petunjuk pembayaran khusus per metode (tampilan QRIS statis, nomor rekening BCA & atas nama, instruksi tunai).
  - Kotak Token Akses Pelacakan Rahasia 256-bit dengan tombol salin satu-klik dan tombol langsung lacak pesanan.
- [x] **Halaman Pelacakan Pesanan Aman (`TrackOrderPage`):**
  - Pencarian status menggunakan token acak atau membaca otomatis dari URL parameter `?token=...`.
  - Stepper visual progres pesanan: NEW -> PROCESSING -> READY -> COMPLETED.
  - Rincian snapshot menu yang dipesan, total tagihan, riwayat timestamp transisi, dan kontak bantuan WhatsApp.
- [x] **Halaman Beranda (`HomePage`):**
  - Hero banner promosi, banner diskon 15% pesanan online, nilai keunggulan restoran, teaser menu terpopuler terhubung ke modal pemesanan, arsitektur ulasan pelanggan, jam operasional, peta Google Maps, dan kontak WhatsApp.
- [x] **Router & Navigasi Publik (`AppRouter`, `PublicLayout`):**
  - Pendaftaran rute `/order-confirmation`.
  - Indikator badge keranjang realtime pada navbar publik.
- [x] **Migrasi Server-Side RPC (`20261109000013_create_online_order_rpc.sql`):**
  - Prosedur `create_online_order` dengan rekalkulasi harga dari database, verifikasi stok, pemotongan stok otomatis, pencatatan `stock_movements`, dan penyimpanan hash token.
- [x] **Pengujian & Kualitas:**
  - 17 unit tests passed (3 Phase 0, 5 Phase 1, 9 Phase 2).
  - ESLint 0 errors, 0 warnings.
  - Kompilasi produksi TypeScript & Vite sukses.

---

### 2. Pekerjaan Belum Selesai (Incomplete Tasks)
- Tidak ada untuk Phase 2. Seluruh modul website publik telah selesai dan teruji.

---

### 3. Berkas yang Dibuat / Dimodifikasi

#### Dibuat:
- `src/stores/cartStore.ts`
- `src/services/storeService.ts`
- `src/modules/public-store/components/ProductDetailModal.tsx`
- `src/modules/public-store/pages/OrderConfirmationPage.tsx`
- `supabase/migrations/20261109000013_create_online_order_rpc.sql`
- `tests/unit/phase2_public_website.test.tsx`
- `tests/unit/phase2_ui_integration.test.tsx`

#### Dimodifikasi:
- `src/layouts/public/PublicLayout.tsx`
- `src/app/router/index.tsx`
- `src/modules/public-store/pages/HomePage.tsx`
- `src/modules/public-store/pages/MenuPage.tsx`
- `src/modules/public-store/pages/CartPage.tsx`
- `src/modules/public-store/pages/CheckoutPage.tsx`
- `src/modules/public-store/pages/TrackOrderPage.tsx`
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
  - Total: **17 passed, 0 failed**.
- **ESLint:**
  - `npm run lint` -> **0 errors, 0 warnings**.
- **Typecheck & Production Build:**
  - `npm run build` -> **Exit code 0**, bundle `dist/assets/index-DmvMJVQ4.js` (584.88 kB).

---

### 5. Known Issues
- Tidak ada error atau issue tersisa pada Phase 2.

---

### 6. Next Phase
- **PHASE 3 — Backoffice Foundation and Authentication**
  - Implementasi login staf (Owner, Admin, Kasir) via Supabase Auth.
  - Session management & route protection (mencegah akses tanpa login).
  - Role & Permission checker hooks (`useAuthStore`, `usePermission`).
  - Profil staf & manajemen hak akses backoffice.
  - Dashboard eksekutif foundation dengan metrik penjualan, order berjalan, dan status shift kasir.

---

### 7. Approval Status
- **Phase 2 Status:** SELESAI (Pending user confirmation: **Lanjut**).
