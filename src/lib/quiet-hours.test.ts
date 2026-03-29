import { describe, expect, it } from "vitest";
import { isWithinQuietHours } from "./quiet-hours";

describe("isWithinQuietHours", () => {
  it("returns false when bounds missing", () => {
    const noon = new Date("2026-06-15T15:00:00.000Z");
    expect(isWithinQuietHours(noon, "UTC", null, null)).toBe(false);
    expect(isWithinQuietHours(noon, "UTC", "22:00", null)).toBe(false);
  });

  it("same-day window", () => {
    const t = new Date("2026-06-15T14:30:00.000Z"); // 14:30 UTC
    expect(isWithinQuietHours(t, "UTC", "10:00", "18:00")).toBe(true);
    expect(isWithinQuietHours(t, "UTC", "15:00", "16:00")).toBe(false);
  });

  it("overnight window in UTC", () => {
    const late = new Date("2026-06-15T23:00:00.000Z");
    const early = new Date("2026-06-15T06:00:00.000Z");
    expect(isWithinQuietHours(late, "UTC", "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours(early, "UTC", "22:00", "07:00")).toBe(true);
    const midday = new Date("2026-06-15T12:00:00.000Z");
    expect(isWithinQuietHours(midday, "UTC", "22:00", "07:00")).toBe(false);
  });
});
