import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError || !authData?.user) {
      throw new Error(authError?.message || "Email atau kata sandi tidak valid.");
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
      await supabase.auth.signOut();
      throw err;
    }
  },

  // Sign out strictly from Supabase Auth
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};
