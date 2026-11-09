# FOODPOS — Panduan Prosedur Pembuatan Akun OWNER (Secure Owner Bootstrap)

Sistem FOODPOS **TIDAK MENYEDIAKAN** form pendaftaran publik (public signup) untuk peran `OWNER` demi mencegah pengambilalihan sistem tanpa izin.

Akun `OWNER` pertama harus diinisialisasi melalui prosedur administrasi terkontrol pada backend Supabase.

---

## 1. Persyaratan Awal
1. Proyek Supabase sudah aktif.
2. Seluruh migrasi database (Phase 1) telah sukses dijalankan.
3. Administrator memiliki akses ke **Supabase Dashboard** -> **Authentication** dan **SQL Editor**.

---

## 2. Langkah-Langkah Pembuatan Akun OWNER Pertama

### Langkah A: Buat User di Supabase Auth
1. Buka **Supabase Dashboard** -> **Authentication** -> **Users**.
2. Klik tombol **Add User** -> pilih **Create User**.
3. Masukkan:
   - **Email:** `owner@foodpos.local` (atau email bisnis resmi Anda).
   - **Password:** Masukkan password yang kuat dan aman (minimal 12 karakter kombinasi huruf, angka, dan simbol).
   - **Auto Confirm User:** Centang (Checked).
4. Klik **Create User**. Salin nilai **User UID** yang terbentuk (misal: `a1b2c3d4-e5f6-7890-abcd-1234567890ef`).

### Langkah B: Jalankan Skrip Bootstrap di SQL Editor
Buka **Supabase Dashboard** -> **SQL Editor** -> Jalankan prosedur tersimpan `bootstrap_initial_owner`:

```sql
-- Ganti parameter dengan User UID dan Nama Pemilik Bisnis
SELECT bootstrap_initial_owner(
  p_user_id := 'PASTE_USER_UID_DISINI'::UUID,
  p_full_name := 'Nama Pemilik Restoran',
  p_phone := '081234567890'
);
```

### Penjelasan Logika `bootstrap_initial_owner`:
1. Memeriksa apakah user sudah terdaftar di `auth.users`.
2. Memeriksa apakah sudah ada user dengan role `OWNER`. Jika sudah ada, prosedur akan menolak eksekusi baru (One-Time Protection) kecuali dipanggil dengan flag otorisasi khusus.
3. Membuat entri profil di `public.profiles`.
4. Menetapkan role `OWNER` di `public.user_roles`.
5. Menghubungkan user dengan Outlet Pusat (`OUT-01`) di `public.user_outlets` sebagai outlet utama.
6. Mencatat aksi inisialisasi pada `public.audit_logs` dengan keterangan `'INITIAL_OWNER_BOOTSTRAP'`.

---

## 3. Verifikasi Akun OWNER
Setelah menjalankan skrip di atas, jalankan query verifikasi:
```sql
SELECT 
    p.id,
    p.full_name,
    u.email,
    r.name AS role_name,
    o.name AS outlet_name
FROM profiles p
JOIN auth.users u ON u.id = p.id
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
JOIN user_outlets uo ON uo.user_id = p.id
JOIN outlets o ON o.id = uo.outlet_id
WHERE r.name = 'OWNER';
```
Hasil query akan menampilkan akun OWNER dengan akses penuh ke sistem backoffice FOODPOS.
