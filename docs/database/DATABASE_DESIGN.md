# FOODPOS — Prinsip & Keputusan Arsitektur Database (Database Design)

Dokumen ini menjelaskan rasionalitas teknis, prinsip desain, dan pertahanan integritas data dalam perancangan database PostgreSQL FOODPOS.

---

## 1. Multi-Outlet Isolation Ready
Meskipun fase awal (Phase 1) berfokus pada operasional 1 outlet, seluruh tabel operasional menyertakan `outlet_id`:
- `categories`, `products`, `customers`, `orders`, `order_payments`, `stock_movements`, `cash_sessions`, `expenses`, `store_settings`, `payment_settings`, `tax_settings`, `service_charge_settings`.
- Setiap user (pegawai) dipetakan ke outlet melalui tabel relasi `user_outlets`.
- Kebijakan Row Level Security (RLS) mengisolasi data transaksi sehingga staf di Cabang A tidak dapat melihat atau memanipulasi data Cabang B.

---

## 2. Immutabilitas Snapshot Transaksi Pesanan
Perubahan harga menu, penghapusan produk, pergantian nama menu, atau pengeditan varian **tidak boleh merusak riwayat transaksi masa lalu**.
- Tabel `orders` menyimpan snapshot: `customer_name_snapshot`, `customer_phone_snapshot`, `delivery_address_snapshot`, `subtotal`, `discount_amount`, `tax_amount`, `service_charge_amount`, `delivery_fee`, dan `grand_total`.
- Tabel `order_items` menyimpan snapshot: `product_name_snapshot`, `sku_snapshot`, `variant_name_snapshot`, `addons_snapshot` (JSONB), `unit_price`, `quantity`, `discount_amount`, dan `line_total`.
- Foreign key `order_items.product_id` disetel ke `ON DELETE SET NULL`, memastikan riwayat transaksi tetap utuh jika produk katalog diarsipkan atau dihapus.

---

## 3. Kebijakan Pembayaran Penuh Tunggal (Single Full Payment Policy)
- **1 Order = 1 Pembayaran Sukses (`PAID`)**: Didukung oleh partial unique index pada database:
  ```sql
  CREATE UNIQUE INDEX idx_order_payments_single_paid 
  ON order_payments (order_id) 
  WHERE status = 'PAID';
  ```
- **Tanpa Split Payment & Tanpa Partial DP**: Seluruh pembayaran wajib melunasi `grand_total` secara utuh.
- **Pencegahan Pembayaran Ganda (Idempotency)**: Kolom `idempotency_key` pada `order_payments` mencegah double submit saat kasir mengklik tombol bayar berulang kali atau saat terjadi gangguan jaringan.
- **Histori Tidak Terhapus**: Jika percobaan bayar gagal (`FAILED`), baris tersebut tetap tersimpan, dan perubahan status selalu dicatat ke `payment_events`.

---

## 4. Alur Refund Dua Tahap & Pemisahan Wewenang (Segregation of Duties)
- **Pencegahan Fraud Internal**: Kasir tidak boleh menyetujui permohonan refund yang diajukan oleh dirinya sendiri:
  ```sql
  CONSTRAINT chk_refund_requester_not_approver CHECK (requested_by != approved_by)
  ```
- **Approval ≠ Uang Kembali**: Persetujuan refund (`APPROVED`) hanya memvalidasi klaim. Status pembayaran baru menjadi `REFUNDED` setelah dana fisik/transfer benar-benar diserahkan kepada pelanggan dan dicatat tanggal serta nomor referensinya (`refunded_at`, `refund_reference`).
- **Data Keuangan Asli Tetap Utuh**: Transaksi pembayaran awal tidak dihapus melainkan diperbarui statusnya, sehingga pembukuan audit kasir tetap seimbang.

---

## 5. Integritas Inventori Produk Jadi & Pencegahan Stok Negatif
- Menjaga stok fisik riil di outlet.
- Kolom `products.current_stock` memiliki batasan integritas:
  ```sql
  CHECK (current_stock >= 0)
  ```
- Setiap pergerakan stok (penjualan, pembatalan, retur, penyesuaian opname) wajib dicatat ke tabel `stock_movements` yang menyimpan `previous_stock`, `quantity_change`, dan `new_stock`.

---

## 6. Kasir Shift & Integritas Uang Fisik Laci Kasir
- **Pemisahan Uang Fisik dan Non-Tunai**:
  - Penjualan QRIS, EDC Debit/Kredit, dan Transfer Bank langsung masuk ke rekening bank / settlement gateway.
  - Uang tunai fisik yang harus ada di laci kasir dihitung secara akurat:
    $$\text{Expected Closing Cash} = \text{Opening Cash} + \text{Total Cash Sales} + \text{Total Cash In} - \text{Total Cash Out}$$
  - Selisih kas ($\text{Discrepancy} = \text{Actual} - \text{Expected}$) dicatat untuk evaluasi akuntabilitas kasir.

---

## 7. Keamanan Pelacakan Pesanan Tamu (Public Order Tracking)
- Pelanggan online dapat melacak pesanan tanpa akun (guest checkout).
- Otorisasi pelacakan **tidak boleh** hanya mengandalkan nomor pesanan atau UUID order (mudah ditebak/di-scrape).
- Sistem menghasilkan token acak dengan entropi 256-bit (32 byte CSPRNG cryptographically secure random bytes).
- Database hanya menyimpan nilai **SHA-256 hash** dari token tersebut di tabel `public_order_tokens`.
- Pengunjung yang memasukkan token hanya dapat melihat status pesanan jika hash token cocok.
