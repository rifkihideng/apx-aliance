import { describe, expect, it } from "vitest";
import {
  normalizeApplicationStatus,
  normalizeDate,
  normalizeDiscord,
  normalizeKey,
  normalizeLevel,
  normalizeMultiline,
  normalizeNullable,
  normalizeText,
  normalizeTime,
  normalizeUrl,
  slugify,
} from "./normalize";

describe("normalizeText", () => {
  it("membuang spasi di ujung dan menggabungkan spasi ganda", () => {
    expect(normalizeText("  Ketua   APX  ")).toBe("Ketua APX");
  });

  it("mengubah null/undefined menjadi string kosong", () => {
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
  });

  it("menyamakan bentuk Unicode (NFC)", () => {
    const decomposed = "e\u0301"; // "é" dalam bentuk NFD
    expect(normalizeText(decomposed)).toBe("é");
  });

  it("membuang karakter tak terlihat (zero-width)", () => {
    expect(normalizeText("A\u200Bpx")).toBe("Apx");
  });

  it("mengganti karakter kontrol menjadi spasi", () => {
    expect(normalizeText("Apx\tAlliance")).toBe("Apx Alliance");
  });
});

describe("normalizeKey", () => {
  it("menghasilkan bentuk kanonik huruf kecil", () => {
    expect(normalizeKey("  Ketua APX  ")).toBe("ketua apx");
    expect(normalizeKey("KETUA")).toBe("ketua");
  });
});

describe("normalizeNullable", () => {
  it("mengubah string kosong menjadi null", () => {
    expect(normalizeNullable("   ")).toBeNull();
    expect(normalizeNullable("APX")).toBe("APX");
  });
});

describe("normalizeMultiline", () => {
  it("mempertahankan baris baru tapi merapikan spasi", () => {
    expect(normalizeMultiline("  Baris satu  \n\n\n  Baris dua  ")).toBe(
      "Baris satu\n\nBaris dua"
    );
  });
});

describe("normalizeDiscord", () => {
  it("menjadikan huruf kecil", () => {
    expect(normalizeDiscord("APXRaja")).toBe("apxraja");
  });

  it("membuang @ di depan", () => {
    expect(normalizeDiscord("@apxraja")).toBe("apxraja");
  });

  it("membuang URL profil Discord", () => {
    expect(normalizeDiscord("https://discord.com/users/apxraja")).toBe("apxraja");
    expect(normalizeDiscord("discord.gg/apxraja")).toBe("apxraja");
  });

  it("mengembalikan null untuk input kosong", () => {
    expect(normalizeDiscord("   ")).toBeNull();
  });
});

describe("slugify", () => {
  it("menghasilkan slug ramah URL", () => {
    expect(slugify("  Jadwal War Wilayah!! ")).toBe("jadwal-war-wilayah");
  });

  it("membuang aksen/diakritik", () => {
    expect(slugify("Renée")).toBe("renee");
  });

  it("menghasilkan string kosong untuk input tanpa huruf/angka", () => {
    expect(slugify("???")).toBe("");
  });
});

describe("normalizeUrl", () => {
  it("hanya menerima protokol http(s)", () => {
    expect(normalizeUrl("ftp://x.com")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });

  it("menyeragamkan ke https dan huruf kecil pada host", () => {
    expect(normalizeUrl("http://EXAMPLE.com")).toBe("https://example.com");
  });

  it("membuang trailing slash pada root", () => {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com");
  });

  it("mengembalikan null untuk input tidak valid", () => {
    expect(normalizeUrl("bukan url")).toBeNull();
  });
});

describe("normalizeDate", () => {
  it("menerima tanggal valid", () => {
    expect(normalizeDate("2026-02-28")).toBe("2026-02-28");
  });

  it("menolak tanggal yang tidak ada di kalender", () => {
    expect(normalizeDate("2026-02-31")).toBeNull();
  });

  it("menolak format yang salah", () => {
    expect(normalizeDate("28-02-2026")).toBeNull();
    expect(normalizeDate("2026/02/28")).toBeNull();
  });
});

describe("normalizeTime", () => {
  it("menerima HH:MM dan memotong detik", () => {
    expect(normalizeTime("20:00:00")).toBe("20:00");
    expect(normalizeTime("09:30")).toBe("09:30");
  });

  it("menolak jam di luar 00-23", () => {
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("12:60")).toBeNull();
  });
});

describe("normalizeLevel", () => {
  it("mengembalikan bilangan bulat positif", () => {
    expect(normalizeLevel("25")).toBe(25);
    expect(normalizeLevel("25.9")).toBe(25);
  });

  it("membatasi level maksimal 9999", () => {
    expect(normalizeLevel("12345")).toBe(9999);
  });

  it("mengembalikan null untuk input tidak valid", () => {
    expect(normalizeLevel("abc")).toBeNull();
    expect(normalizeLevel("-5")).toBeNull();
    expect(normalizeLevel("0")).toBeNull();
  });
});

describe("normalizeApplicationStatus", () => {
  it("menerima status valid tanpa memperhatikan huruf besar/kecil", () => {
    expect(normalizeApplicationStatus("pending")).toBe("pending");
    expect(normalizeApplicationStatus(" DITERIMA ")).toBe("diterima");
  });

  it("menolak status tidak dikenal", () => {
    expect(normalizeApplicationStatus("diproses")).toBeNull();
  });
});
