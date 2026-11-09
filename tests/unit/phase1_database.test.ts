import { describe, it, expect } from "vitest";
import { supabase } from "@/lib/supabase";
import * as fs from "fs";
import * as path from "path";

describe("PHASE 1 — Database & Supabase Foundation Validation", () => {
  it("initializes Supabase client without runtime exceptions", () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  it("verifies all 12 migration files exist and are populated", () => {
    const migrationsDir = path.resolve(__dirname, "../../supabase/migrations");
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const expectedMigrations = [
      "20261109000001_extensions_and_helpers.sql",
      "20261109000002_outlets_and_identity.sql",
      "20261109000003_roles_and_permissions.sql",
      "20261109000004_product_catalog.sql",
      "20261109000005_customers.sql",
      "20261109000006_orders_and_items.sql",
      "20261109000007_payments_and_refunds.sql",
      "20261109000008_inventory.sql",
      "20261109000009_cash_sessions_and_expenses.sql",
      "20261109000010_settings_notifications_audit.sql",
      "20261109000011_rls_policies.sql",
      "20261109000012_storage_and_bootstrap.sql",
    ];

    for (const filename of expectedMigrations) {
      const filePath = path.join(migrationsDir, filename);
      expect(fs.existsSync(filePath), `File ${filename} must exist`).toBe(true);
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content.length).toBeGreaterThan(50);
    }
  });

  it("verifies seed.sql exists and contains initial outlet, roles, and menu", () => {
    const seedPath = path.resolve(__dirname, "../../supabase/seed.sql");
    expect(fs.existsSync(seedPath)).toBe(true);

    const seedContent = fs.readFileSync(seedPath, "utf-8");
    expect(seedContent).toContain("OUT-01");
    expect(seedContent).toContain("OWNER");
    expect(seedContent).toContain("ADMIN");
    expect(seedContent).toContain("CASHIER");
    expect(seedContent).toContain("orders.view");
    expect(seedContent).toContain("payments.verify");
  });

  it("verifies documentation files for database exist in docs/database", () => {
    const docsDir = path.resolve(__dirname, "../../docs/database");
    expect(fs.existsSync(path.join(docsDir, "ERD.md"))).toBe(true);
    expect(fs.existsSync(path.join(docsDir, "DATA_DICTIONARY.md"))).toBe(true);
    expect(fs.existsSync(path.join(docsDir, "DATABASE_DESIGN.md"))).toBe(true);
    expect(fs.existsSync(path.join(docsDir, "RLS_MATRIX.md"))).toBe(true);
    expect(fs.existsSync(path.join(docsDir, "STORAGE_POLICIES.md"))).toBe(true);

    const secDir = path.resolve(__dirname, "../../docs/security");
    expect(fs.existsSync(path.join(secDir, "OWNER_BOOTSTRAP.md"))).toBe(true);
  });

  it("ensures critical security constraints are present in migration files", () => {
    const migrationsDir = path.resolve(__dirname, "../../supabase/migrations");
    
    // Check requester cannot approve own refund constraint
    const refundMigration = fs.readFileSync(path.join(migrationsDir, "20261109000007_payments_and_refunds.sql"), "utf-8");
    expect(refundMigration).toContain("chk_refund_requester_not_approver");
    expect(refundMigration).toContain("requested_by != approved_by");
    expect(refundMigration).toContain("idx_order_payments_single_paid");

    // Check RLS policies migration enables RLS on orders, payments, customers, etc.
    const rlsMigration = fs.readFileSync(path.join(migrationsDir, "20261109000011_rls_policies.sql"), "utf-8");
    expect(rlsMigration).toContain("ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;");
    expect(rlsMigration).toContain("ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;");
    expect(rlsMigration).toContain("ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;");
    expect(rlsMigration).toContain("ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;");

    // Check secure bootstrap function in migration 12
    const bootstrapMigration = fs.readFileSync(path.join(migrationsDir, "20261109000012_storage_and_bootstrap.sql"), "utf-8");
    expect(bootstrapMigration).toContain("CREATE OR REPLACE FUNCTION public.bootstrap_initial_owner");
    expect(bootstrapMigration).toContain("CREATE OR REPLACE FUNCTION public.track_order_by_token");
  });
});
