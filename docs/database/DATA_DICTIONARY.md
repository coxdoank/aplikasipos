# FOODPOS — Kamus Data (Data Dictionary)

Dokumen ini memuat spesifikasi teknis dan rincian seluruh entitas, kolom, tipe data, batasan (constraints), indeks, dan tujuan bisnis dalam skema database PostgreSQL FOODPOS.

---

## 1. Domain: Identity, Multi-Outlet & RBAC

### Tabel: `outlets`
Menyimpan identitas cabang/outlet restoran. Mendukung isolasi data multi-cabang.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `code` | VARCHAR(50) | NO | - | Unique identifier cabang (misal: `OUT-01`). |
| `name` | TEXT | NO | - | Nama gerai / outlet. |
| `address` | TEXT | YES | - | Alamat fisik lengkap gerai. |
| `phone` | VARCHAR(30) | YES | - | Kontak telepon / WhatsApp resmi outlet. |
| `is_active` | BOOLEAN | NO | `true` | Status operasional outlet. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu pembuatan entitas. |
| `updated_at`| TIMESTAMPTZ | NO | `now()` | Waktu pembaruan data. |

### Tabel: `profiles`
Profil pengguna sistem yang terintegrasi 1:1 dengan `auth.users` Supabase Auth.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | - | PK, FK ke `auth.users.id` ON DELETE CASCADE. |
| `full_name` | TEXT | NO | - | Nama lengkap pegawai / staf. |
| `phone` | VARCHAR(30) | YES | - | Nomor kontak handphone / WA. |
| `avatar_url`| TEXT | YES | - | URL foto profil. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu registrasi profil. |
| `updated_at`| TIMESTAMPTZ | NO | `now()` | Waktu pembaruan profil. |

### Tabel: `roles`
Daftar peran otoritas sistem (`OWNER`, `ADMIN`, `CASHIER`).
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `name` | VARCHAR(50) | NO | - | Unique. Nilai: `OWNER`, `ADMIN`, `CASHIER`. |
| `description`| TEXT | YES | - | Penjelasan tanggung jawab peran. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu pembuatan peran. |

### Tabel: `permissions`
Daftar hak akses granular dalam sistem.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `code` | VARCHAR(100)| NO | - | Unique code (misal: `orders.view`, `payments.verify`). |
| `module` | VARCHAR(50) | NO | - | Modul bisnis (misal: `orders`, `pos`, `payments`). |
| `description`| TEXT | YES | - | Penjelasan izin operasional. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu registrasi izin. |

### Tabel: `role_permissions`
Relasi many-to-many pemetaan peran terhadap izin granular.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `role_id` | UUID | NO | - | FK ke `roles.id` ON DELETE CASCADE. |
| `permission_id`| UUID | NO | - | FK ke `permissions.id` ON DELETE CASCADE. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Unique(`role_id`, `permission_id`). |

### Tabel: `user_roles`
Pemberian peran terhadap user tertentu.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `user_id` | UUID | NO | - | FK ke `auth.users.id` ON DELETE CASCADE. |
| `role_id` | UUID | NO | - | FK ke `roles.id` ON DELETE CASCADE. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Unique(`user_id`, `role_id`). |

### Tabel: `user_outlets`
Pemberian otorisasi akses pegawai terhadap outlet tertentu.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `user_id` | UUID | NO | - | FK ke `auth.users.id` ON DELETE CASCADE. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE CASCADE. |
| `is_primary`| BOOLEAN | NO | `false` | Menandai outlet kerja utama. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Unique(`user_id`, `outlet_id`). |

---

## 2. Domain: Produk & Katalog

### Tabel: `categories`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `name` | TEXT | NO | - | Nama kategori (misal: "Makanan Utama"). |
| `slug` | TEXT | NO | - | URL/API friendly identifier. Unique per outlet. |
| `description`| TEXT | YES | - | Deskripsi kategori menu. |
| `display_order`| INTEGER | NO | `0` | Urutan tampilan pada web dan POS. |
| `is_active` | BOOLEAN | NO | `true` | Status aktif publik/kasir. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu dibuat. |
| `updated_at`| TIMESTAMPTZ | NO | `now()` | Waktu diperbarui. |

### Tabel: `products`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `category_id`| UUID | YES | - | FK ke `categories.id` ON DELETE SET NULL. |
| `sku` | VARCHAR(100)| NO | - | SKU unik per outlet. |
| `name` | TEXT | NO | - | Nama produk menu. |
| `description`| TEXT | YES | - | Rincian bahan dan penyajian. |
| `base_price` | NUMERIC(12,2)| NO | - | Harga dasar menu (`CHECK (base_price >= 0)`). |
| `image_url` | TEXT | YES | - | Path/URL foto produk di Supabase Storage. |
| `is_active` | BOOLEAN | NO | `true` | Status tayang menu. |
| `is_available`| BOOLEAN | NO | `true` | Status ketersediaan bahan dapur saat ini. |
| `display_order`| INTEGER | NO | `0` | Urutan pada katalog. |
| `current_stock`| INTEGER | NO | `0` | Stok produk jadi (`CHECK (current_stock >= 0)`). |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu dibuat. |
| `updated_at`| TIMESTAMPTZ | NO | `now()` | Waktu diperbarui. |

### Tabel: `product_variants`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `product_id` | UUID | NO | - | FK ke `products.id` ON DELETE CASCADE. |
| `name` | TEXT | NO | - | Nama varian (misal: "Porsi Jumbo", "Level 2"). |
| `price_adjustment`| NUMERIC(12,2)| NO | `0.00` | Penyesuaian harga terhadap `base_price`. |
| `is_active` | BOOLEAN | NO | `true` | Status aktif varian. |
| `display_order`| INTEGER | NO | `0` | Urutan varian. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu dibuat. |

### Tabel: `product_addons`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `product_id` | UUID | NO | - | FK ke `products.id` ON DELETE CASCADE. |
| `name` | TEXT | NO | - | Nama topping/add-on (misal: "Keju Parut"). |
| `price` | NUMERIC(12,2)| NO | - | Harga tambahan (`CHECK (price >= 0)`). |
| `is_active` | BOOLEAN | NO | `true` | Status aktif add-on. |
| `display_order`| INTEGER | NO | `0` | Urutan tampilan. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu dibuat. |

---

## 3. Domain: Pelanggan (Customers)

### Tabel: `customers`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `name` | TEXT | NO | - | Nama pelanggan. |
| `phone` | VARCHAR(30) | NO | - | Nomor WhatsApp / kontak. |
| `email` | VARCHAR(255)| YES | - | Email pelanggan (opsional). |
| `address` | TEXT | YES | - | Alamat delivery default. |
| `notes` | TEXT | YES | - | Catatan preferensi pelanggan. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu registrasi data pelanggan. |
| `updated_at`| TIMESTAMPTZ | NO | `now()` | Waktu pembaruan. |

---

## 4. Domain: Pesanan (Orders) & Snapshot Transaksi

### Tabel: `orders`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `customer_id`| UUID | YES | - | FK ke `customers.id` ON DELETE SET NULL. |
| `order_number`| VARCHAR(50)| NO | - | Nomor pesanan unik (misal: `ORD-20261109-001`). |
| `channel` | VARCHAR(20) | NO | - | `CHECK (channel IN ('ONLINE', 'POS'))`. |
| `service_type`| VARCHAR(20)| NO | - | `CHECK (service_type IN ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'PICKUP'))`. |
| `order_status`| VARCHAR(20)| NO | `'NEW'` | `CHECK (order_status IN ('NEW', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'))`. |
| `customer_name_snapshot` | TEXT | NO | - | Snapshot nama pelanggan saat order terjadi. |
| `customer_phone_snapshot`| VARCHAR(30)| NO | - | Snapshot kontak pelanggan. |
| `delivery_address_snapshot`| TEXT | YES | - | Snapshot alamat pengantaran delivery. |
| `subtotal` | NUMERIC(12,2)| NO | - | Total kotor baris item (`CHECK (subtotal >= 0)`). |
| `discount_amount`| NUMERIC(12,2)| NO | `0.00` | Potongan harga pesanan (`CHECK >= 0`). |
| `tax_amount` | NUMERIC(12,2)| NO | `0.00` | Nilai nominal pajak terhitung (`CHECK >= 0`). |
| `service_charge_amount`| NUMERIC(12,2)| NO | `0.00` | Nilai nominal service charge (`CHECK >= 0`). |
| `delivery_fee`| NUMERIC(12,2)| NO | `0.00` | Biaya pengantaran kurir (`CHECK >= 0`). |
| `grand_total`| NUMERIC(12,2)| NO | - | Total final tagihan (`CHECK (grand_total >= 0)`). |
| `notes` | TEXT | YES | - | Catatan khusus pesanan dapur. |
| `created_by`| UUID | YES | - | FK ke `auth.users.id` (kasir / admin jika POS). |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu transaksi dibuat. |
| `updated_at`| TIMESTAMPTZ | NO | `now()` | Waktu pembaruan. |

### Tabel: `order_items`
Menyimpan snapshot baris pesanan agar riwayat keuangan dan audit kebal terhadap perubahan master produk di masa depan.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `order_id` | UUID | NO | - | FK ke `orders.id` ON DELETE CASCADE. |
| `product_id`| UUID | YES | - | FK ke `products.id` ON DELETE SET NULL. |
| `product_name_snapshot`| TEXT | NO | - | Nama produk saat dipesan. |
| `sku_snapshot`| VARCHAR(100)| NO | - | SKU produk saat dipesan. |
| `variant_name_snapshot`| TEXT | YES | - | Nama variasi (misal: "Large"). |
| `addons_snapshot`| JSONB | YES | - | Array rincian add-on yang dipilih. |
| `unit_price`| NUMERIC(12,2)| NO | - | Harga satuan snapshot (`CHECK >= 0`). |
| `quantity` | INTEGER | NO | - | Jumlah porsi (`CHECK (quantity > 0)`). |
| `discount_amount`| NUMERIC(12,2)| NO | `0.00` | Diskon per item. |
| `line_total` | NUMERIC(12,2)| NO | - | Total baris = `(unit_price * qty) - discount`. |
| `item_notes` | TEXT | YES | - | Catatan khusus per menu (misal: "tanpa seledri"). |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu baris dicatat. |

### Tabel: `order_status_history`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `order_id` | UUID | NO | - | FK ke `orders.id` ON DELETE CASCADE. |
| `previous_status`| VARCHAR(20)| YES | - | Status awal sebelum transisi. |
| `new_status` | VARCHAR(20) | NO | - | Status target transisi. |
| `actor_id` | UUID | YES | - | FK ke `auth.users.id` yang mengubah status. |
| `actor_name`| TEXT | YES | - | Nama aktor pelaksana. |
| `reason` | TEXT | YES | - | Alasan perubahan (wajib jika pembatalan). |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu transisi terjadi. |

### Tabel: `public_order_tokens`
Menyimpan token akses publik untuk tracking pesanan tanpa login akun.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `order_id` | UUID | NO | - | FK ke `orders.id` ON DELETE CASCADE. |
| `token_hash`| VARCHAR(128)| NO | - | Hash SHA-256 dari token acak 256-bit. Unique. |
| `expires_at`| TIMESTAMPTZ | YES | - | Batas waktu kedaluwarsa token akses. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu penerbitan token. |

---

## 5. Domain: Pembayaran, Refund & Event Transaksi

### Tabel: `order_payments`
Menyimpan pembayaran transaksi. Satu order hanya diperbolehkan memiliki satu pembayaran yang sukses (`PAID`).
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `order_id` | UUID | NO | - | FK ke `orders.id` ON DELETE RESTRICT. |
| `payment_method`| VARCHAR(30)| NO | - | `CHECK (payment_method IN ('CASH', 'QRIS', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD'))`. |
| `status` | VARCHAR(30) | NO | `'UNPAID'` | `CHECK (status IN ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'))`. |
| `amount` | NUMERIC(12,2)| NO | - | Jumlah tagihan (`CHECK (amount > 0)`). |
| `cash_received`| NUMERIC(12,2)| YES | - | Nominal uang fisik yang diserahkan pelanggan. |
| `change_amount`| NUMERIC(12,2)| YES | - | Nominal uang kembalian. |
| `reference_number`| VARCHAR(100)| YES | - | Nomor approval EDC / referensi transfer bank. |
| `proof_path`| TEXT | YES | - | Path file bukti bayar di private storage Supabase. |
| `verified_by`| UUID | YES | - | FK ke `auth.users.id` yang memverifikasi. |
| `verified_at`| TIMESTAMPTZ | YES | - | Waktu kasir memvalidasi pembayaran. |
| `idempotency_key`| VARCHAR(100)| YES | - | Kunci unik mencegah pemrosesan pembayaran ganda. |
| `created_at`| TIMESTAMPTZ | NO | `now()` | Waktu inisiasi pembayaran. |
| `updated_at`| TIMESTAMPTZ | NO | `now()` | Waktu pembaruan status. |

### Tabel: `payment_refunds`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `payment_id` | UUID | NO | - | FK ke `order_payments.id` ON DELETE RESTRICT. |
| `refund_amount`| NUMERIC(12,2)| NO | - | Nominal pengembalian dana (`CHECK (refund_amount > 0)`). |
| `reason` | TEXT | NO | - | Alasan pengembalian dana (wajib diisi). |
| `status` | VARCHAR(20) | NO | `'PENDING'` | `CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'))`. |
| `requested_by`| UUID | NO | - | FK ke `auth.users.id` kasir pemohon refund. |
| `approved_by` | UUID | YES | - | FK ke `auth.users.id` Admin/Owner yang menyetujui. |
| `approved_at` | TIMESTAMPTZ | YES | - | Waktu persetujuan. |
| `refunded_at` | TIMESTAMPTZ | YES | - | Waktu penyerahan fisik uang refund kepada pelanggan. |
| `refund_reference`| VARCHAR(100)| YES | - | Kode transaksi refund fisik / bank. |
| `created_at` | TIMESTAMPTZ | NO | `now()` | `CHECK (requested_by != approved_by)`. |

### Tabel: `payment_events`
Audit log seluruh siklus hidup pembayaran untuk pelacakan kepatuhan finansial.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `payment_id` | UUID | NO | - | FK ke `order_payments.id` ON DELETE CASCADE. |
| `event_type` | VARCHAR(50) | NO | - | Tipe aksi (misal: `SUBMITTED`, `VERIFIED`, `REFUND_REQUESTED`). |
| `previous_status`| VARCHAR(30)| YES | - | Status pembayaran sebelum event. |
| `new_status` | VARCHAR(30) | NO | - | Status pembayaran sesudah event. |
| `actor_id` | UUID | YES | - | FK ke `auth.users.id`. |
| `notes` | TEXT | YES | - | Catatan penjelasan aksi. |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Waktu pencatatan event. |

---

## 6. Domain: Inventori Produk Jadi (Finished Goods)

### Tabel: `stock_movements`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `product_id` | UUID | NO | - | FK ke `products.id` ON DELETE RESTRICT. |
| `movement_type`| VARCHAR(20)| NO | - | `CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'REFUND'))`. |
| `quantity_change`| INTEGER | NO | - | Nilai perubahan kuantitas (+ / -). |
| `previous_stock`| INTEGER | NO | - | Stok sebelum mutasi (`CHECK >= 0`). |
| `new_stock` | INTEGER | NO | - | Stok sesudah mutasi (`CHECK >= 0`). |
| `reference_id` | VARCHAR(100)| YES | - | ID order atau nomor surat jalan opname. |
| `reason` | TEXT | NO | - | Alasan perubahan stok. |
| `actor_id` | UUID | YES | - | FK ke `auth.users.id` pelaku mutasi. |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Waktu mutasi stok terjadi. |

---

## 7. Domain: Keuangan & Kasir Shift

### Tabel: `cash_sessions`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `opened_by` | UUID | NO | - | FK ke `auth.users.id` kasir pembuka shift. |
| `closed_by` | UUID | YES | - | FK ke `auth.users.id` kasir penutup shift. |
| `opened_at` | TIMESTAMPTZ | NO | `now()` | Waktu shift dimulai. |
| `closed_at` | TIMESTAMPTZ | YES | - | Waktu shift diakhiri. |
| `opening_cash`| NUMERIC(12,2)| NO | - | Modal awal kas di laci (`CHECK >= 0`). |
| `total_cash_sales`| NUMERIC(12,2)| NO | `0.00` | Penjualan kasir tunai. |
| `total_non_cash_sales`| NUMERIC(12,2)| NO | `0.00` | Penjualan non-tunai (QRIS/EDC). |
| `total_cash_in`| NUMERIC(12,2)| NO | `0.00` | Tambahan kas masuk selama shift. |
| `total_cash_out`| NUMERIC(12,2)| NO | `0.00` | Pengeluaran kas selama shift. |
| `expected_closing_cash`| NUMERIC(12,2)| YES | - | Ekspektasi kas laci fisik = `opening + cash_sales + cash_in - cash_out`. |
| `actual_closing_cash`| NUMERIC(12,2)| YES | - | Hasil hitung fisik uang kas saat tutup shift. |
| `discrepancy` | NUMERIC(12,2)| YES | - | Selisih kas = `actual - expected`. |
| `status` | VARCHAR(20) | NO | `'OPEN'` | `CHECK (status IN ('OPEN', 'CLOSED'))`. |
| `closing_notes`| TEXT | YES | - | Catatan pertanggungjawaban kasir. |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Waktu entitas dibuat. |

### Tabel: `cash_transactions`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `session_id` | UUID | NO | - | FK ke `cash_sessions.id` ON DELETE RESTRICT. |
| `transaction_type`| VARCHAR(20)| NO | - | `CHECK (transaction_type IN ('CASH_IN', 'CASH_OUT'))`. |
| `amount` | NUMERIC(12,2)| NO | - | Nilai transaksi (`CHECK (amount > 0)`). |
| `reason` | TEXT | NO | - | Alasan kas masuk/keluar (misal: "tukar uang kecil"). |
| `actor_id` | UUID | NO | - | FK ke `auth.users.id`. |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Waktu transaksi. |

### Tabel: `expenses`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE RESTRICT. |
| `session_id` | UUID | YES | - | FK ke `cash_sessions.id` jika dibayar dari kas laci. |
| `title` | TEXT | NO | - | Judul pengeluaran biaya. |
| `category` | VARCHAR(50) | NO | - | Kategori biaya operasional. |
| `amount` | NUMERIC(12,2)| NO | - | Nilai pengeluaran (`CHECK (amount > 0)`). |
| `payment_method`| VARCHAR(30)| NO | - | `CHECK (payment_method IN ('CASH', 'TRANSFER', 'OTHER'))`. |
| `notes` | TEXT | YES | - | Catatan pendukung. |
| `receipt_proof_url`| TEXT | YES | - | Foto nota pembelian fisik. |
| `created_by` | UUID | NO | - | FK ke `auth.users.id`. |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Waktu pengeluaran dicatat. |

---

## 8. Domain: Konfigurasi & Audit

### Tabel: `store_settings`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE CASCADE. Unique per outlet. |
| `business_name`| TEXT | NO | - | Nama bisnis restoran. |
| `business_tagline`| TEXT | YES | - | Slogan toko. |
| `description` | TEXT | YES | - | Deskripsi restoran. |
| `logo_url` | TEXT | YES | - | Logo resmi. |
| `banner_url` | TEXT | YES | - | Banner promosi beranda. |
| `operating_hours`| TEXT | YES | - | Informasi jadwal buka toko. |
| `whatsapp_number`| VARCHAR(30)| YES | - | Nomor WhatsApp order. |
| `email` | VARCHAR(255)| YES | - | Email layanan pelanggan. |
| `google_maps_url`| TEXT | YES | - | Tautan peta Google Maps. |
| `estimated_prep_time_minutes`| INTEGER| NO | `15` | Estimasi standar waktu masak dapur. |
| `is_online_ordering_enabled`| BOOLEAN| NO | `true` | Saklar buka/tutup pesanan online. |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Waktu pembaruan konfigurasi. |

### Tabel: `payment_settings`
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE CASCADE. Unique per outlet. |
| `qris_image_url`| TEXT | YES | - | Gambar QR code QRIS Statis outlet. |
| `qris_merchant_name`| TEXT | YES | - | Nama merchant QRIS terdaftar. |
| `bank_name` | VARCHAR(100)| YES | - | Nama bank tujuan transfer. |
| `bank_account_number`| VARCHAR(100)| YES | - | Nomor rekening bank outlet. |
| `bank_account_holder`| VARCHAR(150)| YES | - | Atas nama rekening bank outlet. |
| `is_cash_enabled` | BOOLEAN | NO | `true` | Mengaktifkan opsi bayar tunai. |
| `is_qris_enabled` | BOOLEAN | NO | `true` | Mengaktifkan opsi bayar QRIS. |
| `is_transfer_enabled`| BOOLEAN | NO | `true` | Mengaktifkan opsi bayar transfer bank. |
| `is_card_enabled` | BOOLEAN | NO | `true` | Mengaktifkan opsi bayar EDC debit/kredit. |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Waktu pembaruan. |

### Tabel: `tax_settings` & `service_charge_settings`
Mengatur persentase pajak restoran (PB1) dan service charge. Disimpan terpisah per outlet untuk mendukung kepatuhan regulasi perpajakan daerah masing-masing cabang.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | NO | - | FK ke `outlets.id` ON DELETE CASCADE. Unique. |
| `is_enabled` | BOOLEAN | NO | `true` | Status pemungutan pajak / service. |
| `tax_rate_percent` / `service_rate_percent` | NUMERIC(5,2)| NO | `10.00` / `0.00` | Tarif persentase (`CHECK >= 0`). |
| `tax_name` | VARCHAR(50) | NO | `'PB1 / Pajak Restoran'` | Label pada struk belanja. |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Waktu pembaruan. |

### Tabel: `audit_logs`
Mencatat seluruh aksi penting pengguna (seperti persetujuan refund, perubahan pengaturan, penyesuaian stok, buka/tutup shift kasir) demi keterlacakan dan kepatuhan audit keamanan.
| Kolom | Tipe Data | Nullable | Default | Batasan & Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key. |
| `outlet_id` | UUID | YES | - | FK ke `outlets.id` ON DELETE SET NULL. |
| `actor_id` | UUID | YES | - | FK ke `auth.users.id`. |
| `actor_email`| VARCHAR(255)| YES | - | Email aktor saat aksi dilakukan. |
| `action` | VARCHAR(100)| NO | - | Kode aksi yang diaudit. |
| `entity_type`| VARCHAR(50) | NO | - | Nama tabel / domain terkait. |
| `entity_id` | VARCHAR(100)| YES | - | ID rekaman yang dimanipulasi. |
| `details` | JSONB | YES | - | Detail metadata perubahan. |
| `ip_address` | VARCHAR(45) | YES | - | Alamat IP jaringan. |
| `created_at` | TIMESTAMPTZ | NO | `now()` | Waktu log dicatat. |
