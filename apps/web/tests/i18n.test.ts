import { describe, expect, it } from "vitest";
import { localeFromCookie, messagesFor, type Namespace } from "../src/lib/i18n";
import { localizeServerError } from "../src/lib/i18n/server-errors";
import { aiFeedback } from "../src/lib/ai-feedback";
import { accountLimitMessage, metatraderSlotsMessage, READ_ONLY_MESSAGE } from "../src/lib/plan";
import { quotaExceededMessage } from "../src/lib/ai-quota";
import * as namespaces from "../src/lib/i18n/messages/all";
import {
  connectLimitMessage,
  METATRADER_WEEKEND_MESSAGE,
  syncGapMessage,
} from "../src/lib/metatrader-sync";

/** Shape of a message tree: nested keys, with functions and arrays reduced to their kind. */
const shape = (value: unknown): unknown => {
  if (typeof value === "function") return `fn/${value.length}`;
  if (Array.isArray(value)) return `array/${value.length}`;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, shape(child)]),
    );
  return typeof value;
};

describe("message catalog", () => {
  it("has the same entries in Indonesian and English for every namespace", () => {
    for (const [name, messages] of Object.entries(namespaces)) {
      expect(shape(messages.id), name).toEqual(shape(messages.en));
    }
  });

  it("serves the requested language", () => {
    const ns: Namespace = "shell";
    expect(messagesFor(ns, "id").nav.settings).toBe("Pengaturan");
    expect(messagesFor(ns, "en").nav.settings).toBe("Settings");
  });
});

describe("locale cookie", () => {
  it("defaults to Indonesian and honours a valid choice", () => {
    expect(localeFromCookie(null)).toBe("id");
    expect(localeFromCookie("")).toBe("id");
    expect(localeFromCookie("a=1; mnd-locale=en; b=2")).toBe("en");
    expect(localeFromCookie("mnd-locale=fr")).toBe("id");
  });
});

describe("server error translation", () => {
  it("translates shared constants, patterns and nested row messages", () => {
    expect(localizeServerError(READ_ONLY_MESSAGE, "id")).toContain("hanya-baca");
    expect(localizeServerError(accountLimitMessage(10), "id")).toBe(
      "Anda sudah mencapai batas paket Anda: 10 akun. Upgrade untuk menambah lagi.",
    );
    expect(
      localizeServerError(
        quotaExceededMessage({ used: 100, quota: 100, resetsOn: "2026-10-01" }),
        "id",
      ),
    ).toBe("Kuota AI bulan ini sudah habis (100/100). Kuota direset pada 2026-10-01.");
    expect(localizeServerError("Row 4: Choose a CSV file.", "id")).toBe("Baris 4: Pilih file CSV.");
    // MetaTrader add-on and manual-sync limits.
    expect(localizeServerError(metatraderSlotsMessage(0), "id")).toContain("add-on");
    expect(localizeServerError(metatraderSlotsMessage(2), "id")).toContain("mencakup 2 akun");
    expect(localizeServerError(syncGapMessage(5), "id")).toContain("dalam 5 jam");
    expect(localizeServerError(connectLimitMessage(2), "id")).toContain("2 akun MetaTrader baru");
    expect(localizeServerError(METATRADER_WEEKEND_MESSAGE, "id")).toContain("Senin–Jumat");
  });

  it("leaves English alone and passes unknown text through unchanged", () => {
    expect(localizeServerError(READ_ONLY_MESSAGE, "en")).toBe(READ_ONLY_MESSAGE);
    expect(localizeServerError("Binance: IP not whitelisted", "id")).toBe(
      "Binance: IP not whitelisted",
    );
  });
});

describe("AI notices", () => {
  it("recognizes already-translated server messages", () => {
    const t = messagesFor("ai", "id");
    const empty = aiFeedback(
      localizeServerError("The journal is empty — import trades first", "id"),
      t,
    );
    expect(empty.title).toBe(t.feedback.emptyJournal.title);
    expect(empty.action?.href).toBe("/import");
    const quota = aiFeedback(
      localizeServerError(
        quotaExceededMessage({ used: 5, quota: 5, resetsOn: "2026-10-01" }),
        "id",
      ),
      t,
    );
    expect(quota.title).toBe(t.feedback.quota.title);
  });
});
