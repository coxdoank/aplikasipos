import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type AuthUser = User | { id: string; email?: string };

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

export interface DemoAccount {
  email: string;
  role: "OWNER" | "ADMIN" | "CASHIER";
  name: string;
  permissions: string[];
}

export const DEMO_STAFF_ACCOUNTS: DemoAccount[] = [
  {
    email: "owner@foodpos.local",
    role: "OWNER",
    name: "Hendra Wijaya (Pemilik Restoran)",
    permissions: [
      "orders.view", "orders.create", "orders.update_status", "orders.cancel",
      "payments.view", "payments.create", "payments.verify", "payments.refund.request", "payments.refund.approve",
      "products.view", "products.manage", "inventory.adjust", "reports.view",
      "users.manage", "settings.manage", "audit.view", "cash_sessions.open", "cash_sessions.close"
    ],
  },
  {
    email: "admin@foodpos.local",
    role: "ADMIN",
    name: "Ratna Sari (Manajer Resto)",
    permissions: [
      "orders.view", "orders.create", "orders.update_status", "orders.cancel",
      "payments.view", "payments.create", "payments.verify", "payments.refund.request", "payments.refund.approve",
      "products.view", "products.manage", "inventory.adjust", "reports.view",
      "users.manage", "settings.manage", "audit.view", "cash_sessions.open", "cash_sessions.close"
    ],
  },
  {
    email: "cashier@foodpos.local",
    role: "CASHIER",
    name: "Budi Santoso (Kasir Shift 1)",
    permissions: [
      "orders.view", "orders.create", "orders.update_status",
      "payments.view", "payments.create", "payments.verify", "payments.refund.request",
      "products.view", "cash_sessions.open", "cash_sessions.close"
    ],
  },
];

const isConfiguredSupabase = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder-project"));
};

export const authService = {
  // Sign in with Supabase Auth or fallback demo simulation
  async signIn(email: string, password?: string): Promise<{
    user: AuthUser | null;
    profile: StaffProfile;
    roleInfo: UserRoleInfo;
    outlet: UserOutletInfo;
  }> {
    const demo = DEMO_STAFF_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());

    if (!isConfiguredSupabase()) {
      if (demo) {
        return {
          user: { id: `user-${demo.role.toLowerCase()}`, email: demo.email },
          profile: { id: `user-${demo.role.toLowerCase()}`, fullName: demo.name, email: demo.email },
          roleInfo: { roleName: demo.role, permissions: demo.permissions },
          outlet: { id: "e0000000-0000-0000-0000-000000000001", code: "OUT-01", name: "FOODPOS Outlet Pusat" },
        };
      }
      // If user typed a custom email in offline simulator, treat as Cashier
      return {
        user: { id: "user-simulated", email },
        profile: { id: "user-simulated", fullName: email.split("@")[0].toUpperCase(), email },
        roleInfo: {
          roleName: "CASHIER",
          permissions: DEMO_STAFF_ACCOUNTS[2].permissions,
        },
        outlet: { id: "e0000000-0000-0000-0000-000000000001", code: "OUT-01", name: "FOODPOS Outlet Pusat" },
      };
    }

    // Connect to real Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: password || "FoodposPassword123!",
    });

    if (authError || !authData.user) {
      if (demo) {
        // Fallback to demo if credentials fail on remote
        return {
          user: { id: `user-${demo.role.toLowerCase()}`, email: demo.email },
          profile: { id: `user-${demo.role.toLowerCase()}`, fullName: demo.name, email: demo.email },
          roleInfo: { roleName: demo.role, permissions: demo.permissions },
          outlet: { id: "e0000000-0000-0000-0000-000000000001", code: "OUT-01", name: "FOODPOS Outlet Pusat" },
        };
      }
      throw new Error(authError?.message || "Email atau kata sandi tidak valid.");
    }

    const userId = authData.user.id;

    // Fetch profile
    const { data: profileData } = (await supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url")
      .eq("id", userId)
      .single()) as {
      data: { id: string; full_name: string; phone: string | null; avatar_url: string | null } | null;
    };

    // Fetch user role
    const { data: userRoleData } = (await supabase
      .from("user_roles" as never)
      .select("roles ( id, name )" as never)
      .eq("user_id" as never, userId as never)
      .single()) as { data: { roles: { id: string; name: string } } | null };

    const roleName = (userRoleData?.roles?.name as "OWNER" | "ADMIN" | "CASHIER") || "CASHIER";

    // Fetch permissions
    const { data: rolePermissionsData } = (await supabase
      .from("role_permissions" as never)
      .select("permissions ( code )" as never)
      .eq("role_id" as never, userRoleData?.roles?.id as never)) as {
      data: Array<{ permissions: { code: string } }> | null;
    };

    const permissions = (rolePermissionsData || [])
      .map((rp) => rp.permissions?.code)
      .filter(Boolean);

    // Fetch assigned outlet
    const { data: userOutletData } = (await supabase
      .from("user_outlets" as never)
      .select("outlets ( id, code, name )" as never)
      .eq("user_id" as never, userId as never)
      .limit(1)
      .single()) as { data: { outlets: UserOutletInfo } | null };

    const outlet = userOutletData?.outlets || {
      id: "e0000000-0000-0000-0000-000000000001",
      code: "OUT-01",
      name: "FOODPOS Outlet Pusat",
    };

    return {
      user: authData.user,
      profile: {
        id: userId,
        fullName: profileData?.full_name || authData.user.email?.split("@")[0] || "Staf",
        phone: profileData?.phone,
        avatarUrl: profileData?.avatar_url,
        email: authData.user.email || email,
      },
      roleInfo: {
        roleName,
        permissions: permissions.length > 0 ? permissions : DEMO_STAFF_ACCOUNTS.find(a => a.role === roleName)?.permissions || [],
      },
      outlet,
    };
  },

  // Sign out
  async signOut(): Promise<void> {
    if (isConfiguredSupabase()) {
      await supabase.auth.signOut();
    }
  },
};
