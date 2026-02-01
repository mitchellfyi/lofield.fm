import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MOCK_USER, MOCK_ADMIN_USER } from "@/lib/test-utils/supabase-mock";
import { parseJsonResponse } from "@/lib/test-utils/api-route";

// Mock the Supabase clients
let mockClient: Record<string, unknown>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockClient)),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(() => Promise.resolve(mockClient)),
}));

// Import route handler after mocking
import { GET } from "../route";

describe("/api/admin/stats", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      ADMIN_EMAILS: MOCK_ADMIN_USER.email,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("GET /api/admin/stats", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const response = await GET();

      expect(response.status).toBe(401);
      expect(await response.text()).toBe("Unauthorized");
    });

    it("returns 403 when user is not admin", async () => {
      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER },
            error: null,
          }),
        },
        from: vi.fn(),
      };

      const response = await GET();

      expect(response.status).toBe(403);
      expect(await response.text()).toBe("Forbidden");
    });

    it("returns stats for admin user", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_ADMIN_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation((table: string) => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "gte"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          if (table === "profiles") {
            // Total users count
            return Promise.resolve({
              data: null,
              error: null,
              count: 100,
            }).then(resolve);
          } else if (table === "user_usage") {
            // Active today count
            return Promise.resolve({
              data: null,
              error: null,
              count: 25,
            }).then(resolve);
          } else if (table === "abuse_flags") {
            // Flagged users
            return Promise.resolve({
              data: [
                { user_id: "user1" },
                { user_id: "user1" }, // Duplicate, should be counted as 1
                { user_id: "user2" },
              ],
              error: null,
            }).then(resolve);
          }
          return Promise.resolve({ data: null, error: null, count: 0 }).then(resolve);
        });

        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse<{
        totalUsers: number;
        activeToday: number;
        flaggedUsers: number;
      }>(response);

      expect(status).toBe(200);
      expect(data.totalUsers).toBe(100);
      expect(data.activeToday).toBe(25);
      expect(data.flaggedUsers).toBe(2); // 2 unique users
    });

    it("returns zero counts when no data", async () => {
      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_ADMIN_USER },
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "gte"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({
            data: null,
            error: null,
            count: null,
          }).then(resolve);
        });

        return builder;
      });

      const response = await GET();
      const { status, data } = await parseJsonResponse<{
        totalUsers: number;
        activeToday: number;
        flaggedUsers: number;
      }>(response);

      expect(status).toBe(200);
      expect(data.totalUsers).toBe(0);
      expect(data.activeToday).toBe(0);
      expect(data.flaggedUsers).toBe(0);
    });

    it("handles multiple admin emails", async () => {
      // Set multiple admin emails
      process.env.ADMIN_EMAILS = `${MOCK_USER.email},${MOCK_ADMIN_USER.email}`;

      const fromMock = vi.fn();

      mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: MOCK_USER }, // Using regular user who is now in admin list
            error: null,
          }),
        },
        from: fromMock,
      };

      fromMock.mockImplementation(() => {
        const builder: Record<string, unknown> = {};
        const chainMethods = ["select", "eq", "gte"];
        chainMethods.forEach((method) => {
          builder[method] = vi.fn().mockReturnValue(builder);
        });

        builder.then = vi.fn((resolve) => {
          return Promise.resolve({
            data: [],
            error: null,
            count: 0,
          }).then(resolve);
        });

        return builder;
      });

      const response = await GET();

      // Should be allowed since user is now in admin list
      expect(response.status).toBe(200);
    });
  });
});
