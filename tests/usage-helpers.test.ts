import { describe, it, expect } from "vitest";
import {
  parseISODateToUTCRange,
  validateDateRange,
  parseDateRange,
} from "@/lib/usage-api-helpers";

describe("usage-api-helpers", () => {
  describe("parseISODateToUTCRange", () => {
    it("returns start and end of day in UTC", () => {
      const { startOfDay, endOfDay } = parseISODateToUTCRange("2023-01-01");
      expect(startOfDay).toBe("2023-01-01T00:00:00.000Z");
      expect(endOfDay).toBe("2023-01-01T23:59:59.999Z");
    });
  });

  describe("validateDateRange", () => {
    it("returns true for valid range", () => {
      expect(validateDateRange("2023-01-01", "2023-01-02")).toBe(true);
      expect(validateDateRange("2023-01-01", "2023-01-01")).toBe(true);
    });

    it("returns false for end before start", () => {
      expect(validateDateRange("2023-01-02", "2023-01-01")).toBe(false);
    });
  });

  describe("parseDateRange", () => {
    it("returns timestamps for full range", () => {
      const { startTimestamp, endTimestamp } = parseDateRange(
        "2023-01-01",
        "2023-01-02"
      );
      expect(startTimestamp).toBe("2023-01-01T00:00:00.000Z");
      expect(endTimestamp).toBe("2023-01-02T23:59:59.999Z");
    });
  });
});
