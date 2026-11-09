# DEVELOPMENT PROGRESS — FOODPOS

## Current Phase: PHASE 4 — Order Management and Kanban

### Status: COMPLETED & AWAITING USER APPROVAL ("Lanjut")

---

### 1. Pekerjaan Selesai (Completed Tasks - Phase 4)
- [x] **Service Layer Pesanan (`src/services/orderService.ts`):**
  - Implementasi Finite State Machine (FSM) yang ketat untuk transisi status pesanan:
    - Maju: `NEW` -> `PROCESSING` -> `READY` -> `COMPLETED`.
    - Pembatalan: `NEW` -> `CANCELLED`, `PROCESSING` -> `CANCELLED`, `READY` -> `CANCELLED` (memerlukan alasan pembatalan wajib & hak akses).
    - Status terminal: `COMPLETED` dan `CANCELLED` dikunci secara permanen.
  - Pencatatan otomatis ke riwayat audit perjalanan status (`order_status_history`) mencakup status lama, status baru, nama operator, alasan, dan timestamp.
  - Dukungan filter pencarian (`search`), status pesanan, saluran (`channel`), jenis layanan (`service_type`), dan pengurutan (`newest` / `oldest`).
  - Perhitungan statistik ringkasan antrean pesanan (`getOrdersSummary`).
  - Generator nada notifikasi dapur restoran (*Kitchen Chime Alert*) menggunakan Web Audio API tanpa ketergantungan berkas audio eksternal.
  - Sinkronisasi instan pesanan dari toko online publik (`storeService.ts`) langsung ke daftar pesanan backoffice.
- [x] **Tampilan Papan Kanban Interaktif (`OrderKanban.tsx`):**
  - 4 kolom status utama: *Pesanan Baru (NEW)*, *Sedang Dimasak (PROCESSING)*, *Siap Saji / Kirim (READY)*, dan *Selesai (COMPLETED)*.
  - Drag-and-drop antar kolom status dengan validasi FSM otomatis.
  - Tombol aksi 1-klik untuk perangkat sentuh / tablet / kasir: "Masak", "Siap", "Selesai".
  - Kartu pesanan kaya informasi: nomor order, waktu berlalu (*elapsed time* dengan penanda urgensi jika > 20 mnt), saluran (`ONLINE` / `POS`), tipe layanan (`DINE_IN`, `DELIVERY`, dll), ringkasan item, total tagihan, dan tombol pembatalan cepat.
- [x] **Tampilan Tabel Responsif (`OrdersPage.tsx`):**
  - Toggle pergantian tampilan: Mode Papan Kanban vs Mode Tabel Data.
  - Kartu KPI metrik interaktif yang juga berfungsi sebagai tombol filter cepat status pesanan.
  - Toolbar pencarian fleksibel dan dropdown penyaringan multi-dimensi (saluran, tipe layanan, waktu).
  - Saklar notifikasi audio (*sound alert toggle*).
  - Pengecekan *polling* berkala (setiap 10 detik) untuk mendeteksi pesanan online baru dengan *kitchen chime* dan *toast notification*.
- [x] **Modal Detail Pesanan Komprehensif (`OrderDetailModal.tsx`):**
  - Pratinjau lengkap informasi pelanggan, nomor WhatsApp dengan tautan langsung, alamat pengantaran, dan catatan khusus.
  - Rincian hidangan: varian, *topping/addons*, catatan per item masakan, kuantitas, harga satuan, dan subtotal.
  - Rincian finansial: subtotal, pajak resto PB1 (10%), ongkos kirim, dan grand total.
  - Informasi pembayaran: metode (QRIS, Tunai, Transfer Bank, EDC Debit), status lunas, nomor referensi TRX, dan uang kembalian.
  - *Vertical Stepper Timeline* yang menampilkan seluruh riwayat perubahan status beserta nama staf dan alasan.
  - Tombol aksi cetak struk kasir dan tombol eksekusi status berikutnya.
- [x] **Dialog Pembatalan Pesanan Aman (`CancelOrderDialog.tsx`):**
  - Otorisasi berbasis hak akses: memvalidasi izin `orders.cancel` (hanya Admin/Owner).
  - Validasi alasan pembatalan wajib dengan pilihan alasan cepat (*preset*) dan masukan teks spesifik.
  - Konfirmasi peringatan sebelum eksekusi pembatalan.
- [x] **Pratinjau Cetak Struk Kasir Termal (`ReceiptPrintModal.tsx`):**
  - Format struk restoran termal 58mm/80mm siap cetak (`window.print()`).
  - Lengkap dengan identitas resto, nomor order, daftar item terperinci, rincian pajak & total, serta metode pembayaran.
- [x] **Pengujian & Kualitas:**
  - 38 unit & integration tests lulus di 6 test suites (`tests/unit/phase4_orders.test.tsx` dkk).
  - ESLint 0 errors, 0 warnings.
  - Kompilasi produksi TypeScript & Vite sukses.

---

### 2. Pekerjaan Belum Selesai (Incomplete Tasks)
- Tidak ada untuk Phase 4. Seluruh acceptance criteria telah terpenuhi.

---

### 3. Berkas yang Dibuat / Dimodifikasi

#### Dibuat:
- `src/services/orderService.ts`
- `src/modules/orders/components/OrderKanban.tsx`
- `src/modules/orders/components/OrderDetailModal.tsx`
- `src/modules/orders/components/CancelOrderDialog.tsx`
- `src/modules/orders/components/ReceiptPrintModal.tsx`
- `tests/unit/phase4_orders.test.tsx`

#### Dimodifikasi:
- `src/modules/orders/pages/OrdersPage.tsx`
- `src/services/storeService.ts`
- `src/types/database.types.ts`
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
  - `tests/unit/phase4_orders.test.tsx` (15 passed)
  - Total: **38 passed, 0 failed**.
- **ESLint:**
  - `npm run lint` -> **0 errors, 0 warnings**.
- **Typecheck & Production Build:**
  - `npm run build` -> **Exit code 0**, bundle `dist/assets/index-CdLcO1TI.js` (659.57 kB).

---

### 5. Known Issues
- Tidak ada issue tersisa pada Phase 4.

---

### 6. Next Phase
- **PHASE 5 — Point of Sale (POS) Cashier Interface**
