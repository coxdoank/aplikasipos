import "@testing-library/jest-dom";
import { vi } from "vitest";

// Ensure unit tests run against predictable test environment
vi.stubEnv("VITE_SUPABASE_URL", "");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
