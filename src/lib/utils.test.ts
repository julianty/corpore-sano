import { lbsToKg, kgToLbs } from "./utils";

describe("lbsToKg", () => {
  it("converts pounds to kilograms correctly", () => {
    expect(lbsToKg(0)).toBe(0);
    expect(lbsToKg(10)).toBeCloseTo(5, 1);
    expect(lbsToKg(100)).toBeCloseTo(45, 1);
  });
  it("appropriately converts to actual weight denominations", () => {
    expect(lbsToKg(45)).toBe(20);
    expect(lbsToKg(100)).toBe(45);
    expect(lbsToKg(162.5)).toBe(73.75);
  });
});

describe("kgToLbs", () => {
  it("converts kilograms to pounds correctly", () => {
    expect(kgToLbs(0)).toBe(0);
  });
  it("appropriately converts to actual weight denominations", () => {
    expect(kgToLbs(20)).toBe(45);
    expect(kgToLbs(25)).toBe(55);
    expect(kgToLbs(22.5)).toBe(50);
  });
});

describe("kgToLbs edge cases", () => {
  it("returns 0 for input less than smallest plate", () => {
    expect(kgToLbs(1)).toBe(0);
  });
});

describe("lbsToKg edge cases", () => {
  it("returns 0 for input less than smallest plate", () => {
    expect(lbsToKg(2)).toBe(0);
  });
});

describe("plate matching", () => {
  it("kgToLbs matches exact plate", () => {
    expect(kgToLbs(25)).toBe(55);
    expect(kgToLbs(20)).toBe(45);
  });
  it("lbsToKg matches exact plate", () => {
    expect(lbsToKg(55)).toBe(25);
    expect(lbsToKg(45)).toBe(20);
  });
});

describe("round-trip conversion", () => {
  it("kgToLbs and lbsToKg are consistent for plate values", () => {
    expect(lbsToKg(kgToLbs(25))).toBe(25);
    expect(kgToLbs(lbsToKg(55))).toBe(55);
  });
});
