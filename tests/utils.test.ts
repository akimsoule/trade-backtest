import { describe, it, expect } from "vitest";
import { seededRandom, rollingMean, rollingStd } from "../src/utils";

describe("utils", () => {
  it("seededRandom is deterministic", () => {
    const r1 = seededRandom(42);
    const r2 = seededRandom(42);
    const seq1 = Array.from({ length: 5 }, () => r1());
    const seq2 = Array.from({ length: 5 }, () => r2());
    expect(seq1).toEqual(seq2);
  });

  it("rollingMean computes correct values", () => {
    const arr = [1, 2, 3, 4, 5];
    const mean = rollingMean(arr, 2);
    expect(mean[0]).toBeNaN();
    expect(mean[1]).toBeCloseTo(1.5, 10);
    expect(mean[4]).toBeCloseTo(4.5, 10);
  });

  it("rollingStd computes correct values", () => {
    const arr = [1, 2, 3, 4];
    const std = rollingStd(arr, 2);
    expect(std[0]).toBeNaN();
    // For window [3,4], mean=3.5, variance=(0.25+0.25)/2=0.25, std=sqrt(0.25)=0.5
    expect(std[3]).toBeCloseTo(0.5, 10);
  });
});
