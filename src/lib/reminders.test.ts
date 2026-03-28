import { describe, it, expect } from "vitest";
import { computeFireAt } from "./reminders";

describe("computeFireAt", () => {
  it("resta offset en minutos respecto a dueAt", () => {
    const due = new Date("2026-03-28T12:00:00.000Z");
    const fire = computeFireAt(due, 60);
    expect(fire.getTime()).toBe(due.getTime() - 60 * 60 * 1000);
  });
});
