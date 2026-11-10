# CHANGELOG — FOODPOS

All notable changes to the FOODPOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.13.0] - 2026-11-10
### Phase 12 — Audit Logs, Security & Notifications

#### Added
- **Service Layer Audit Trail & Kepatuhan Keamanan (`src/services/auditService.ts`):**
  - Pencatatan aktivitas operasional restoran secara menyeluruh (login, logout, order create, pembayaran, refund, buka/tutup shift kasir, penyesuaian stok opname, dan pembaruan pengaturan toko).
  - Mekanisme perlindungan privasi & sanitasi otomatis: masking data sensitif (password, token, apiKey, secret, PIN) sebelum disimpan ke log.
  - Perhitungan metrik ringkasan audit (`getAuditStats`) berdasarkan kategori finansial, stok, dan autentikasi.
  - Ekspor riwayat audit trail terstruktur ke file format CSV (`generateAuditCSV`).
- **Service Layer Notifikasi Operasional (`src/services/notificationService.ts`):**
  - Manajemen notifikasi internal restoran untuk tipe `ORDER_NEW`, `STOCK_LOW`, `PAYMENT_PENDING`, `REFUND_REQUEST`, dan `SYSTEM_SECURITY`.
  - Pelacakan status pesan dibaca / belum dibaca dan penghitung reaktif unread count.
  - Aksi pembaruan tanda baca per pesan (`markAsRead`) maupun massal (`markAllAsRead`).
- **Pusat Notifikasi Interaktif Topbar (`src/components/shared/NotificationBell.tsx`):**
  - Ikon lonceng notifikasi dengan lencana reaktif jumlah pesan baru di header backoffice.
  - Popover dropdown responsif dengan filter Semua vs Belum Dibaca, ikon pembeda tipe pesan, format waktu relatif (misal: "15 menit lalu"), dan tombol cepat Tandai Semua Dibaca.
- **Halaman Log Audit Backoffice (`src/modules/audit/pages/AuditLogsPage.tsx`):**
  - 4 Kartu Ringkasan Metrik (Total Aktivitas, Aksi Finansial, Perubahan Stok, dan Autentikasi).
  - Toolbar pencarian kata kunci dan filter multi-kriteria (Aksi, Entitas, Rentang Tanggal).
  - Tabel audit trail responsif dengan badge kategori warna, penunjuk waktu WIB, aktor, IP address, dan ringkasan metadata.
  - Modal Inspeksi JSON: Viewer kode JSON berformat rapi dengan fitur salin cepat ke clipboard dan jaminan privasi data tersanitasi.
  - Integrasi rute aman `/backoffice/audit` dengan penjagaan hak akses `audit.view`.
- **Pengujian Unit & Integrasi Phase 12 (`tests/unit/phase12_audit_security.test.tsx`):**
  - 8 pengujian otomatis mencakup sanitasi data sensitif, kalkulasi metrik audit, filter pencarian, ekspor CSV, alur notifikasi, interaksi UI lonceng notifikasi, dan modal inspeksi JSON.

## [0.12.0] - 2026-11-10
### Phase 11 — Settings & System Configuration

#### Added
- **Service Layer Pengaturan & Konfigurasi Toko (`src/services/settingService.ts`):**
  - Manajemen terintegrasi profil outlet (`outlets`), toko operasional (`store_settings`), metode pembayaran (`payment_settings`), pajak PB1 (`tax_settings`), biaya layanan (`service_charge_settings`), dan template cetak struk kasir.
  - Dukungan sinkronisasi ganda: persistensi data lokal terstruktur dengan kemampuan sinkronisasi ke tabel backend Supabase.
  - Kemampuan reset bawaan pabrik (`resetToDefaults`) untuk memulihkan konfigurasi sistem awal.
- **Halaman Pengaturan Backoffice Terpadu (`src/modules/settings/pages/SettingsPage.tsx`):**
  - **Tab 1: Profil Outlet & Restoran:** Konfigurasi nama brand usaha, slogan, deskripsi, alamat lengkap, kode outlet (JKT-01), kontak telepon/WhatsApp, tautan Google Maps, jam buka, estimasi waktu masak, dan sakelar penerimaan pesanan online.
  - **Tab 2: Pajak PB1 & Service Charge:** Sakelar aktif/nonaktif pajak restoran PB1, penamaan label struk, pengaturan persentase tarif pajak, pengaturan service charge, dan simulasi kalkulasi tagihan dinamis untuk transaksi Rp 100.000 secara real-time.
  - **Tab 3: Metode Pembayaran:** Sakelar aktivasi metode Tunai (Cash), QRIS Dinamis/Statis, Transfer Bank, dan Mesin EDC Kartu. Form konfigurasi nama merchant QRIS, URL QR Code, nomor rekening, nama bank, dan nama pemilik rekening.
  - **Tab 4: Struk & Printer POS:** Pengaturan header struk, sub-header alamat, pesan ucapan terima kasih footer, seleksi lebar kertas printer thermal (58mm vs 80mm), sakelar rincian pajak, dan konfigurasi kredensial Wi-Fi restoran (SSID & Password).
  - **Live Interactive Thermal Receipt Preview:** Pratinjau struk kasir thermal retro dengan efek sobekan zigzag, font monospace presisi, kalkulasi pajak/service otomatis, dan info Wi-Fi yang berubah langsung sesuai input pengguna.
  - **Otorisasi Keamanan Granular:** Proteksi hak akses `settings.manage` (hanya Owner & Admin yang dapat menyimpan perubahan; kasir ditempatkan pada mode hanya lihat dengan banner peringatan).
- **Pengujian Unit & Integrasi Phase 11 (`tests/unit/phase11_settings.test.tsx`):**
  - 14 pengujian komprehensif mencakup logika CRUD service layer, navigasi tab antarmuka, pengujian simulasi pajak, pratinjau struk kasir, mekanisme reset bawaan, dan penegakan izin otorisasi kasir vs owner.

## [0.11.0] - 2026-11-10
### Phase 10 — Backoffice Analytics, Reports, and Business Insights

#### Added
- **Service Layer Analitik & Laporan Bisnis (`src/services/reportService.ts`):**
  - Kalkulasi metrik KPI utama dalam rentang tanggal fleksibel: Penjualan Bersih (Net Sales), Pesanan Selesai (Completed Orders), Rata-rata Nilai Belanja (AOV), dan Akumulasi Pajak PB1 10%.
  - Agregasi tren penjualan harian (`getDailySalesTrend`) untuk visualisasi pendapatan per hari.
  - Peringkat 10 menu terlaris (`getTopSellingProducts`) berdasarkan kuantitas terjual dan kontribusi omset.
  - Analisis komposisi saluran penjualan (`getChannelBreakdown`) antara transaksi langsung POS Kasir vs Pesanan Online.
  - Analisis metode pembayaran (`getPaymentMethodBreakdown`) antara Tunai, QRIS, Transfer Bank, dan Kartu Debit/Kredit.
  - Analisis jam sibuk restoran / peak dining hours (`getHourlySalesTrend`) dari pukul 08:00 hingga 21:00.
  - Utilitas ekspor data laporan komprehensif ke format CSV (`generateCSV`) yang aman untuk unduhan browser.
- **Halaman Laporan & Analisis Bisnis (`src/modules/reports/pages/ReportsPage.tsx`):**
  - Filter rentang waktu dinamis: Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini, dan Semua Periode.
  - 4 Kartu Metrik KPI Eksekutif dengan perbandingan indikator pertumbuhan.
  - 4 Visualisasi Grafik Interaktif Recharts:
    - *BarChart*: Tren Penjualan Harian dengan tooltips mata uang Rupiah.
    - *LineChart*: Analisis Jam Sibuk Restoran (*Peak Dining Hours*).
    - *PieChart/Donut*: Komposisi Metode Pembayaran pelanggan dengan palet warna representatif.
    - *Channel Composition Progress Bar*: Proporsi pesanan Dine-In/Takeaway kasir dibandingkan Pesanan Online & Delivery.
  - Tabel Peringkat Menu Terlaris (*Top Selling Products*) dengan indikator persentase kontribusi dan status inventori.
  - Tombol Ekspor CSV instan dan pintasan Cetak Laporan (`window.print()`).
- **Pengujian Unit & Integrasi Phase 10 (`tests/unit/phase10_reports.test.tsx`):**
  - 12 pengujian mencakup perhitungan metrik penjualan, tren harian, ranking top produk, breakdown kanal/metode pembayaran, jam sibuk, sanitasi ekspor CSV, dan render UI laporan dengan mock Recharts.

## [0.10.0] - 2026-11-10
### Phase 9 — Customer Management & History

#### Added
- **Service Layer Manajemen Pelanggan (`src/services/customerService.ts`):**
  - CRUD database pelanggan dengan validasi format dan keunikan nomor telepon/WhatsApp.
  - Proteksi integritas keuangan: penolakan penghapusan pelanggan jika memiliki riwayat transaksi (`total_orders > 0`).
  - Pencarian fleksibel (nama, telepon, email, alamat) dan opsi pengurutan (*recent*, *total_spent*, *orders_count*, *name*).
  - Penarikan riwayat pesanan pelanggan lintas saluran POS kasir dan online (`getCustomerOrderHistory`).
  - Perhitungan metrik direktori `getCustomerStats` (Pelanggan Terdaftar, Pelanggan Aktif, Omset Profil, dan Rata-rata Nilai Belanja / AOV).
- **Formulir Pendaftaran & Edit Pelanggan (`CustomerModal.tsx`):**
  - Validasi Zod & React Hook Form untuk nama, telepon, email, alamat pengiriman default, catatan alergi/preferensi, dan status aktif.
- **Modal Profil & Riwayat Belanja Pelanggan (`CustomerDetailModal.tsx`):**
  - Tampilan profil lengkap: avatar inisial, lencana status, 4 KPI finansial pelanggan (Total Transaksi, LTV, AOV, Kategori Loyal VIP/Reguler/Baru), dan tabel riwayat pesanan terintegrasi.
- **Halaman Direktori Pelanggan Backoffice (`CustomersPage.tsx`):**
  - 4 Kartu KPI Pelanggan, toolbar pencarian, filter status, pengurutan data, dan tabel responsif dengan aksi Lihat Riwayat, Edit Profil, dan Hapus.
- **Pengujian Unit & Integrasi Phase 9 (`tests/unit/phase9_customers.test.tsx`):**
  - 13 pengujian menyeluruh mencakup validasi data pelanggan, proteksi hapus data bertransaksi, kalkulasi metrik, dan interaksi form modal.

---

## [0.9.0] - 2026-11-10
### Phase 8 — Payments, Verification, Refunds, and Financial Cash Drawer

#### Added
- **Service Layer Pembayaran & Keuangan (`src/services/paymentService.ts`):**
  - Manajemen transaksi multi-metode (Tunai, QRIS, Transfer Bank, Kartu Debit/Kredit) dan status pembayaran lengkap.
  - Verifikasi bukti transfer manual (`verifyPayment`) dengan audio chime dapur dan pemajuan otomatis pesanan ke status `PROCESSING`.
  - Penolakan bukti transfer palsu (`rejectPayment`) dengan alasan penolakan dan pembatalan pesanan otomatis.
  - Alur pengembalian dana dual-custody (`requestRefund`, `approveRefund`, `rejectRefund`) dengan proteksi pencegahan persetujuan sendiri (*anti self-approval*).
  - Manajemen shift kasir (`openCashSession`, `closeCashSession`) dengan kalkulasi otomatis selisih kas fisik di laci (*discrepancy*).
  - Pencatatan arus kas operasional kasir (`addCashTransaction` / petty cash).
  - Metrik statistik keuangan `getPaymentStats` (Total Pendapatan Lunas, Tunai vs Non-Tunai, Antrean Verifikasi, dan Total Refund).
- **Komponen & Antarmuka Pembayaran (`src/modules/payments/`):**
  - `PaymentVerifyModal.tsx`: Pratinjau gambar bukti transfer, rincian pembayaran, dan aksi verifikasi/penolakan.
  - `RefundModal.tsx`: Formulir pengajuan refund kasir dan tinjauan persetujuan dengan deteksi aturan dual-custody.
  - `PaymentsPage.tsx`: Dashboard ringkasan KPI keuangan, pencarian transaksi, dan 3 Tab Navigasi (Semua Pembayaran, Antrean Verifikasi, Pengajuan Refund).
- **Komponen & Antarmuka Keuangan Sesi Kasir (`src/modules/finance/`):**
  - `CashSessionModal.tsx`: Pembukaan modal awal kasir dan penutupan shift kasir dengan analisis selisih kas.
  - `CashTransactionModal.tsx`: Pencatatan kas masuk tambahan dan kas keluar darurat operasional.
  - `FinancePage.tsx`: Monitoring shift aktif, indikator kas laci saat ini, tabel riwayat shift, dan buku kas kecil.
- **Pengujian Unit & Integrasi Phase 8 (`tests/unit/phase8_payments_finance.test.tsx`):**
  - 20 pengujian menyeluruh mencakup verifikasi transfer, alur dual-custody refund, rekonsiliasi shift kasir, dan interaksi UI modal.

---

## [0.8.0] - 2026-11-10
### Phase 7 — Finished Goods Inventory & Stock Movements

#### Added
- **Service Layer Inventori & Mutasi Stok (`src/services/inventoryService.ts`):**
  - Pencatatan buku besar mutasi stok (`stock_movements` ledger) untuk 5 tipe: `IN`, `OUT`, `ADJUSTMENT`, `SALE`, `REFUND`.
  - Fungsi penyesuaian stok opname `adjustStock` dengan validasi pencegahan nilai stok negatif.
  - Sinkronisasi otomatis ketersediaan produk: jika stok menyentuh 0, otomatis disetel *Habis*, dan jika bertambah di atas 0 otomatis kembali *Tersedia*.
  - Fungsi `recordSaleDeduction` untuk pemotongan stok otomatis saat pesanan kasir/online selesai dibayar.
  - Ringkasan statistik inventori `getInventoryStats` (Menu Dimonitor, Stok Fisik, Stok Menipis $\le 10$, dan Stok Habis).
- **Komponen Modal Penyesuaian Stok Opname (`StockAdjustmentModal.tsx`):**
  - Tiga mode penyesuaian: Opname Fisik (`ADJUSTMENT`), Barang Masuk (`IN`), dan Barang Keluar (`OUT`).
  - Pratinjau kalkulasi langsung (*Live Preview*) dengan status perubahan stok dan peringatan ambang batas.
  - Pilihan cepat alasan siap pakai (*Preset Reason Chips*) dan input nomor referensi dokumen/PO.
  - Proteksi wewenang `inventory.adjust` untuk membatasi aksi hanya bagi Owner dan Admin.
- **Halaman Inventori & Stok Backoffice (`InventoryPage.tsx`):**
  - 4 Kartu KPI Inventori dengan interaksi klik filter cepat: Menu Dimonitor, Total Unit Fisik, Stok Menipis, dan Stok Habis.
  - Tab 1: Daftar Stok Produk Jadi dengan foto menu, kode SKU, kategori, harga, status ketersediaan, badge kesehatan stok (*Aman, Menipis, Habis*), dan tombol aksi "Sesuaikan".
  - Tab 2: Riwayat Mutasi Stok (Ledger) lengkap dengan stempel waktu, produk & SKU, badge tipe mutasi, kuantitas selisih ($+/-$), pergerakan awal $\rightarrow$ akhir, alasan/referensi, dan nama petugas pelaksana.
  - Toolbar pencarian instan dan penyaringan multi-kategori serta kondisi kesehatan stok.
- **Pengujian Unit & Integrasi Phase 7 (`tests/unit/phase7_inventory.test.tsx`):**
  - 14 pengujian menyeluruh mencakup operasi ledger, penolakan stok negatif, toggle otomatis ketersediaan, pemotongan stok penjualan, rendering UI, dan proteksi otorisasi.

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
