# FOODPOS — Kebijakan Supabase Storage (Storage Policies)

FOODPOS menggunakan dua bucket penyimpanan objek di Supabase Storage dengan tingkat privasi dan kebijakan otorisasi yang berbeda secara ketat.

---

## 1. Bucket: `product-images` (Katalog Menu Publik)
- **Tujuan:** Menyimpan gambar foto produk, varian, dan banner promosi beranda.
- **Tipe Bucket:** **Public** (`public = true`).
- **Batas Ukuran Berkas:** Maksimal 5 MB per berkas.
- **Format Berkas Diizinkan:** `image/jpeg`, `image/png`, `image/webp`.

### Kebijakan Akses:
1. **SELECT (Download / View):**
   - Diizinkan untuk semua pihak, termasuk pengunjung publik (`anon`) dan pengguna terotentikasi (`authenticated`).
   ```sql
   CREATE POLICY "Allow public read on product-images"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'product-images');
   ```

2. **INSERT (Upload):**
   - Hanya diizinkan bagi staf terotentikasi yang memiliki wewenang `products.manage` atau role `OWNER` / `ADMIN`.
   ```sql
   CREATE POLICY "Allow authorized staff to upload product-images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'product-images' 
     AND (storage.foldername(name))[1] IS NOT NULL
   );
   ```

3. **UPDATE / DELETE:**
   - Dibatasi hanya untuk staf pengelola produk atau pemilik outlet.

---

## 2. Bucket: `payment-proofs` (Bukti Transfer Bank & Pembayaran)
- **Tujuan:** Menyimpan struk transfer bank, screenshot slip setoran pelanggan, atau nota fisik pengeluaran kasir.
- **Tipe Bucket:** **Private** (`public = false`).
- **Batas Ukuran Berkas:** Maksimal 5 MB per berkas.
- **Format Berkas Diizinkan:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.

### Kebijakan Akses:
1. **SELECT (Download / View):**
   - **Publik / Anonim: DITOLAK KERAS (Denied).**
   - Hanya staf kasir, admin, atau owner dari outlet terkait yang diizinkan mengunduh atau meninjau bukti bayar melalui Signed URL (URL bertanda tangan digital dengan batas kedaluwarsa waktu singkat, misalnya 10 menit).
   ```sql
   CREATE POLICY "Allow authenticated staff to view payment-proofs"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'payment-proofs'
   );
   ```

2. **INSERT (Upload):**
   - Diizinkan untuk upload checkout pesanan atau kasir yang mencatat transfer secara aman.
   ```sql
   CREATE POLICY "Allow authenticated staff to upload payment-proofs"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'payment-proofs');
   ```

3. **DELETE:**
   - Bukti bayar adalah dokumen finansial audit; tidak boleh dihapus sembarangan oleh kasir. Dibatasi hanya untuk role `OWNER`.
