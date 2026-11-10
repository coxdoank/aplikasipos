import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, AuthError } from "@supabase/supabase-js";

export type AuthUser = User;

export interface StaffProfile {
  id: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  email: string;
}

export interface UserRoleInfo {
  roleName: "OWNER" | "ADMIN" | "CASHIER";
  permissions: string[];
}

export interface UserOutletInfo {
  id: string;
  code: string;
  name: string;
}

/**
 * Maps Supabase auth and network errors into clear, friendly Indonesian error messages.
 */
export const formatAuthErrorMessage = (error: unknown): string => {
  if (!error) return "Autentikasi gagal. Silakan periksa kredensial Anda.";

  const errObj = error as Partial<AuthError> & { message?: string; name?: string; status?: number };
  const rawMsg = errObj.message || (error instanceof Error ? error.message : String(error));
  const lowerMsg = rawMsg.toLowerCase();
  const status = errObj.status;

  // 1. Unconfigured Supabase environment
  if (lowerMsg.includes("konfigurasi supabase") || lowerMsg.includes("unconfigured")) {
    return "Konfigurasi Supabase Cloud belum tersedia di sistem. Hubungi administrator untuk mengisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.";
  }

  // 2. Network / DNS / Failed to fetch errors
  if (
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("networkerror") ||
    lowerMsg.includes("network request failed") ||
    lowerMsg.includes("enotfound") ||
    errObj.name === "AuthRetryableFetchError"
  ) {
    return "Gagal terhubung ke server Supabase Cloud. Periksa koneksi internet Anda atau pastikan URL server dapat diakses.";
  }

  // 3. Invalid credentials
  if (
    lowerMsg.includes("invalid login credentials") ||
    lowerMsg.includes("invalid_credentials") ||
    lowerMsg.includes("email atau kata sandi tidak valid")
  ) {
    return "Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.";
  }

  // 4. Email not confirmed
  if (lowerMsg.includes("email not confirmed") || lowerMsg.includes("email_not_confirmed")) {
    return "Alamat email akun ini belum dikonfirmasi. Silakan verifikasi email Anda sebelum masuk.";
  }

  // 5. Account deactivated / banned
  if (
    lowerMsg.includes("user is banned") ||
    lowerMsg.includes("banned") ||
    lowerMsg.includes("user_banned") ||
    lowerMsg.includes("account disabled")
  ) {
    return "Akun staf ini telah dinonaktifkan oleh administrator restoran.";
  }

  // 6. Rate limit / Too many requests
  if (status === 429 || lowerMsg.includes("too many requests") || lowerMsg.includes("rate limit")) {
    return "Terlalu banyak percobaan masuk. Mohon tunggu beberapa saat sebelum mencoba kembali.";
  }

  // 7. Server error (5xx)
  if (status && status >= 500) {
    return "Layanan autentikasi Supabase sedang mengalami gangguan teknis (Server Error 5xx). Silakan coba lagi nanti.";
  }

  return rawMsg;
};

export const authService = {
  // Sign in strictly through Supabase Auth (no demo or simulation bypass)
  async signIn(
    email: string,
    password: string
  ): Promise<{
    user: AuthUser;
    profile: StaffProfile;
    roleInfo: UserRoleInfo;
    outlet: UserOutletInfo;
  }> {
    const trimmedEmail = email?.trim() || "";
    if (!trimmedEmail || !password) {
      throw new Error("Email dan kata sandi wajib diisi.");
    }

    // 0. Ensure Supabase environment configuration is present
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Konfigurasi Supabase Cloud belum tersedia di sistem. Hubungi administrator untuk mengisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY."
      );
    }

    // 1. Authenticate with Supabase Auth
    let authData;
    let authError: AuthError | null = null;
    try {
      const res = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      authData = res.data;
      authError = res.error;
    } catch (networkErr: unknown) {
      throw new Error(formatAuthErrorMessage(networkErr));
    }

    if (authError || !authData?.user) {
      throw new Error(formatAuthErrorMessage(authError || new Error("Autentikasi gagal.")));
    }

    const user = authData.user;
    const userId = user.id;

    try {
      // 2. Fetch staff profile
      const { data: profileData, error: profileError } = (await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .eq("id", userId)
        .maybeSingle()) as {
        data: { id: string; full_name: string; phone: string | null; avatar_url: string | null } | null;
        error: Error | null;
      };

      if (profileError) throw profileError;

      // 3. Fetch user role
      const { data: userRoleData, error: roleError } = (await supabase
        .from("user_roles" as never)
        .select("roles ( id, name )" as never)
        .eq("user_id" as never, userId as never)
        .maybeSingle()) as {
        data: { roles: { id: string; name: string } | null } | null;
        error: Error | null;
      };

      if (roleError) throw roleError;

      const roleRecord = userRoleData?.roles;
      const roleName = roleRecord?.name as "OWNER" | "ADMIN" | "CASHIER";

      if (!roleName || !["OWNER", "ADMIN", "CASHIER"].includes(roleName)) {
        throw new Error("Akun Anda belum memiliki peran (role) yang valid di sistem.");
      }

      // 4. Fetch permissions for the assigned role
      let permissions: string[] = [];
      if (roleRecord?.id) {
        const { data: rolePermissionsData, error: permError } = (await supabase
          .from("role_permissions" as never)
          .select("permissions ( code )" as never)
          .eq("role_id" as never, roleRecord.id as never)) as {
          data: Array<{ permissions: { code: string } | null }> | null;
          error: Error | null;
        };

        if (permError) throw permError;

        permissions = (rolePermissionsData || [])
          .map((rp) => rp.permissions?.code)
          .filter((code): code is string => Boolean(code));
      }

      // 5. Fetch assigned outlet
      const { data: userOutletData, error: outletError } = (await supabase
        .from("user_outlets" as never)
        .select("outlets ( id, code, name )" as never)
        .eq("user_id" as never, userId as never)
        .limit(1)
        .maybeSingle()) as {
        data: { outlets: UserOutletInfo | null } | null;
        error: Error | null;
      };

      if (outletError) throw outletError;

      const outlet = userOutletData?.outlets;
      if (!outlet?.id) {
        throw new Error("Akun Anda belum ditugaskan ke cabang outlet.");
      }

      return {
        user,
        profile: {
          id: userId,
          fullName: profileData?.full_name || user.email?.split("@")[0] || "Staf",
          phone: profileData?.phone || null,
          avatarUrl: profileData?.avatar_url || null,
          email: user.email || trimmedEmail,
        },
        roleInfo: {
          roleName,
          permissions,
        },
        outlet: {
          id: outlet.id,
          code: outlet.code,
          name: outlet.name,
        },
      };
    } catch (err: unknown) {
      // Clean up Supabase session if fetching role/profile/outlet failed
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore signout error
      }
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (rawMsg.toLowerCase().includes("fetch") || rawMsg.toLowerCase().includes("network")) {
        throw new Error(formatAuthErrorMessage(err));
      }
      throw err;
    }
  },

  // Sign out strictly from Supabase Auth
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};
