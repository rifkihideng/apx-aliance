import { describe, expect, it } from "vitest";
import { containsBadWords } from "./moderation";

describe("containsBadWords", () => {
  it("mengembalikan false untuk komentar biasa", () => {
    expect(containsBadWords("Mantap, semangat APX!")).toBe(false);
    expect(containsBadWords("Aku cukup tertarik bergabung.")).toBe(false);
    expect(containsBadWords("Good luck semuanya!")).toBe(false);
  });

  it("mendeteksi kata kasar dalam berbagai huruf", () => {
    expect(containsBadWords("dasar ANJING")).toBe(true);
    expect(containsBadWords("Kamu bangsat banget")).toBe(true);
    expect(containsBadWords("jancok")).toBe(true);
  });

  it("mendeteksi penyamaran angka/simbol (leet)", () => {
    expect(containsBadWords("b4ngs4t")).toBe(true);
    expect(containsBadWords("k0nt0l")).toBe(true);
    expect(containsBadWords("anj1ng")).toBe(true);
  });

  it("mendeteksi huruf berulang", () => {
    expect(containsBadWords("anjiiiiing")).toBe(true);
    expect(containsBadWords("bangsaaat")).toBe(true);
  });

  it("tidak salah menandai kata yang memuat kata pendek", () => {
    expect(containsBadWords("cukup")).toBe(false);
    expect(containsBadWords("kok bisa")).toBe(false);
    expect(containsBadWords("santai saja")).toBe(false);
    expect(containsBadWords("I love to cook")).toBe(false);
  });

  it("memeriksa banyak nilai sekaligus", () => {
    expect(containsBadWords("nama biasa", "pesan berisi goblok")).toBe(true);
    expect(containsBadWords("nama", "pesan baik-baik saja")).toBe(false);
  });

  it("aman untuk nilai kosong/null", () => {
    expect(containsBadWords()).toBe(false);
    expect(containsBadWords("")).toBe(false);
    expect(containsBadWords(null)).toBe(false);
    expect(containsBadWords(undefined)).toBe(false);
  });
});
