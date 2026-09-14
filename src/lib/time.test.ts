import { describe, expect, it } from "vitest";
import { convertTimeZones, formatTimeZones } from "./time";

describe("convertTimeZones", () => {
  it("mengonversi jam ke WIB/WITA/WIT/UTC", () => {
    expect(convertTimeZones("20:00")).toEqual({
      wib: "20:00",
      wita: "21:00",
      wit: "22:00",
      utc: "13:00",
    });
  });

  it("menangani pergantian hari (melewati tengah malam)", () => {
    expect(convertTimeZones("23:30")).toEqual({
      wib: "23:30",
      wita: "00:30",
      wit: "01:30",
      utc: "16:30",
    });
  });

  it("mengembalikan null untuk input kosong/tidak valid", () => {
    expect(convertTimeZones(null)).toBeNull();
    expect(convertTimeZones("")).toBeNull();
    expect(convertTimeZones("25:00")).toBeNull();
  });
});

describe("formatTimeZones", () => {
  it("memformat semua zona waktu", () => {
    expect(formatTimeZones("20:00")).toBe("20:00 WIB · 21:00 WITA · 22:00 WIT · 13:00 UTC");
  });

  it("mengembalikan string kosong untuk input tidak valid", () => {
    expect(formatTimeZones(null)).toBe("");
  });
});
