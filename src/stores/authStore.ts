import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService, type StaffProfile, type UserOutletInfo, type AuthUser } from "@/services/authService";

interface AuthState {
  user: AuthUser | null;
  profile: StaffProfile | null;
  role: "OWNER" | "ADMIN" | "CASHIER" | null;
  permissions: string[];
  outlet: UserOutletInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleName: "OWNER" | "ADMIN" | "CASHIER") => boolean;
  setOutlet: (outlet: UserOutletInfo) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      role: null,
      permissions: [],
      outlet: null,
      isAuthenticated: false,
      isLoading: false,
      errorMessage: null,

      login: async (email, password) => {
        set({ isLoading: true, errorMessage: null });
        try {
          const res = await authService.signIn(email, password);
          set({
            user: res.user,
            profile: res.profile,
            role: res.roleInfo.roleName,
            permissions: res.roleInfo.permissions,
            outlet: res.outlet,
            isAuthenticated: true,
            isLoading: false,
            errorMessage: null,
          });
          return true;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Gagal masuk ke sistem backoffice.";
          set({
            isLoading: false,
            errorMessage: message,
            isAuthenticated: false,
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await authService.signOut();
        } finally {
          set({
            user: null,
            profile: null,
            role: null,
            permissions: [],
            outlet: null,
            isAuthenticated: false,
            errorMessage: null,
          });
        }
      },

      hasPermission: (permissionCode: string) => {
        const state = get();
        if (!state.isAuthenticated) return false;
        // OWNER role has supreme access to all permissions
        if (state.role === "OWNER") return true;
        return state.permissions.includes(permissionCode);
      },

      hasRole: (roleName: "OWNER" | "ADMIN" | "CASHIER") => {
        const state = get();
        if (!state.isAuthenticated) return false;
        return state.role === roleName;
      },

      setOutlet: (outlet: UserOutletInfo) => set({ outlet }),

      clearError: () => set({ errorMessage: null }),
    }),
    {
      name: "foodpos-staff-auth",
    }
  )
);
