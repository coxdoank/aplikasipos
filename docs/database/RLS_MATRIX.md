# FOODPOS — Matriks Kebijakan Row Level Security (RLS Matrix)

Setiap tabel pada skema publik Supabase PostgreSQL wajib mengaktifkan Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

Berikut adalah matriks wewenang akses berdasarkan peran pengguna:

| Nama Tabel | Anon (Publik) | CASHIER (Staf Kasir) | ADMIN (Manajer Outlet) | OWNER (Pemilik Bisnis) |
| :--- | :---: | :---: | :---: | :---: |
| `outlets` | Read Active Only | Read Assigned | Read Assigned | Full Access (All Outlets) |
| `profiles` | Denied | Read Assigned Staff | Read Assigned Staff | Full Access |
| `roles` | Denied | Read Only | Read Only | Full Access |
| `permissions` | Denied | Read Only | Read Only | Full Access |
| `role_permissions`| Denied | Read Only | Read Only | Full Access |
| `user_roles` | Denied | Read Own Role | Read Assigned Staff | Full Access |
| `user_outlets` | Denied | Read Own Outlets | Read Assigned Staff | Full Access |
| `categories` | Read Active & Published | Read/Create/Update | Full Access (Outlet) | Full Access |
| `products` | Read Active & Available | Read/Create/Update | Full Access (Outlet) | Full Access |
| `product_variants`| Read Active | Read/Create/Update | Full Access (Outlet) | Full Access |
| `product_addons` | Read Active | Read/Create/Update | Full Access (Outlet) | Full Access |
| `customers` | Denied | Read/Create/Update | Full Access (Outlet) | Full Access |
| `orders` | Denied (Tracking via Token RPC) | Read/Create/Update Status | Full Access (Outlet) | Full Access |
| `order_items` | Denied (Tracking via Token RPC) | Read/Create/Update | Full Access (Outlet) | Full Access |
| `order_status_history`| Denied | Read & Insert (Transition) | Full Access (Outlet) | Full Access |
| `public_order_tokens`| Denied (Verify via RPC) | Read Assigned | Read Assigned | Full Access |
| `order_payments` | Denied | Read/Create/Verify | Full Access (Outlet) | Full Access |
| `payment_refunds`| Denied | Read & Request Only | Approve/Reject/Disburse | Full Access |
| `payment_events` | Denied | Read & Insert Event | Read & Insert Event | Full Access |
| `stock_movements`| Denied | Read & Insert Shift | Full Access (Outlet) | Full Access |
| `cash_sessions` | Denied | Open/Close Own Shift | Full Access (Outlet) | Full Access |
| `cash_transactions`| Denied | Insert Shift Cash In/Out | Full Access (Outlet) | Full Access |
| `expenses` | Denied | Read/Create Assigned | Full Access (Outlet) | Full Access |
| `store_settings` | Read Public Fields | Read Assigned | Update Operational | Full Access |
| `payment_settings`| Read Public Instructions | Read Config | Update Config | Full Access |
| `tax_settings` | Read Active Rate | Read Config | Read/Update Config | Full Access |
| `service_charge_settings`| Read Active Rate | Read Config | Read/Update Config | Full Access |
| `notifications` | Denied | Read Own / Broadcast | Full Access (Outlet) | Full Access |
| `audit_logs` | Denied | Denied | Read Audit (Outlet) | Full Access (All Outlets) |

---

## Prinsip Penting RLS:
1. **Helper Function `SECURITY DEFINER`**:
   Fungsi seperti `has_permission(permission_code, outlet_id)` atau `is_outlet_member(outlet_id)` dibuat dengan `SECURITY DEFINER` dan secara eksplisit menyetel `SET search_path = public, auth, extensions`. Hal ini mencegah privilege escalation dan search-path hijacking.
2. **Tanpa Polisi Rekursif (Anti-Infinite Recursion)**:
   Pengecekan otorisasi membaca tabel `user_roles` dan `user_outlets` secara efisien melalui fungsi helper terkontrol, bukan dengan subquery bersarang yang saling memanggil ke tabel yang sama.
3. **Penyembunyian Informasi Finansial Publik**:
   Pengunjung publik yang mengakses web storefront tidak dapat membaca catatan transaksi, rincian omzet, data pelanggan lain, atau laporan keuangan outlet.
