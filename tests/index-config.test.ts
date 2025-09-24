import { describe, it, expect } from "vitest";
import * as pkg from "../src/index";
import { DEFAULT_PERIODS, THRESHOLDS } from "../src/strategy/config";

describe("index and config exports", () => {
  it("index exports objects", () => {
    expect(pkg).toBeDefined();
    expect(typeof pkg).toBe("object");
  });

  it("config constants are present", () => {
    expect(DEFAULT_PERIODS.ENV).toBeGreaterThan(0);
    expect(THRESHOLDS.VOLATILITY).toBeGreaterThan(0);
  });
});
