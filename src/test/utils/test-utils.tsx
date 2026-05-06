import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Test wrapper with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render };

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  display_name: "Test User",
  ...overrides,
});

export const createMockMonitoringRun = (overrides = {}) => ({
  id: "test-run-id",
  line_id: "test-line-id",
  target_qty: 1000,
  hourly_target: 150,
  status: "running",
  started_at: new Date().toISOString(),
  lines: { code: "LINE-001", name: "Test Line" },
  products: { code: "PROD-001", name: "Test Product" },
  shifts: { name: "Morning", start_time: "06:00", end_time: "14:00" },
  ...overrides,
});

export const createMockHourlyData = (count = 8, overrides = {}) => 
  Array.from({ length: count }, (_, i) => ({
    id: `hourly-${i}`,
    hour_index: i,
    hour_label: `${String(i + 6).padStart(2, "0")}:00`,
    actual_qty: Math.floor(Math.random() * 200),
    ng_qty: Math.floor(Math.random() * 10),
    downtime_minutes: Math.floor(Math.random() * 30),
    is_break: false,
    note: null,
    ...overrides,
  }));

export const createMockSkillData = (count = 5, overrides = {}) =>
  Array.from({ length: count }, (_, i) => ({
    operator_id: `operator-${i}`,
    full_name: `Operator ${i + 1}`,
    initials: `O${i + 1}`,
    join_date: "2023-01-01",
    assigned_line_ids: ["test-line-id"],
    skills: [
      {
        process_name: "Process A",
        level: Math.floor(Math.random() * 5),
        wi_pass: Math.random() > 0.2,
      },
      {
        process_name: "Process B", 
        level: Math.floor(Math.random() * 5),
        wi_pass: Math.random() > 0.2,
      },
    ],
    ...overrides,
  }));

// Mock functions
export const mockSupabaseAuth = {
  user: createMockUser(),
  session: { user: createMockUser() },
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  getSession: vi.fn(() => ({
    data: { session: { user: createMockUser() } },
  })),
};

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => ({
          data: createMockUser(),
          error: null,
        })),
      })),
      in: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({
              data: createMockMonitoringRun(),
              error: null,
            })),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { id: "new-id" },
          error: null,
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: "updated-id" },
            error: null,
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
  rpc: vi.fn(() => ({
    data: ["super_admin"],
    error: null,
  })),
  auth: mockSupabaseAuth,
};

// Test helpers
export const waitForLoadingToFinish = () => new Promise(resolve => setTimeout(resolve, 0));

export const createMockPermissionHook = (role = "manager") => ({
  effectiveRole: role,
  roles: [role],
  isAuthenticated: true,
  isSuperAdmin: role === "super_admin",
  isLeaderOrHigher: ["super_admin", "leader"].includes(role),
  isSupervisorOrHigher: ["super_admin", "leader", "supervisor"].includes(role),
  hasPermission: vi.fn(() => ({ has: true })),
  hasAnyPermission: vi.fn(() => ({ has: true })),
  hasAllPermissions: vi.fn(() => ({ has: true })),
  canAccessRoute: vi.fn(() => ({ has: true })),
  getPermissions: vi.fn(() => []),
  getAllPermissions: vi.fn(() => []),
});

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Mock resize observer
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  window.ResizeObserver = mockResizeObserver;
};

// Setup common mocks
export const setupTestMocks = () => {
  mockIntersectionObserver();
  mockResizeObserver();
  
  // Mock fetch
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
  ) as unknown as typeof fetch;
};

// Cleanup test mocks
export const cleanupTestMocks = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};
