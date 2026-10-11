import { describe, expect, it } from "vitest";
import {
  installmentAmounts,
  invoiceBalance,
  localDate,
  mayAccess,
  overlaps,
  rupeesToPaise,
  safeCheckoutUrl,
} from "./rules";
import { parseField, upiLink, whatsappDraft } from "./api";
import { jsonToCSV, escapeHTML } from "../exportUtils";

describe("ERP calculations and boundaries", () => {
  it("retains paise exactly and rejects malformed amounts", () => {
    expect(rupeesToPaise("1200.05")).toBe(120005);
    expect(rupeesToPaise("0.01")).toBe(1);
    for (const value of ["-1", "0", "NaN", "1e3", "1.234", "1,000"])
      expect(() => rupeesToPaise(value)).toThrow();
  });
  it("distributes every paise across instalments", () => {
    expect(installmentAmounts(10001, 3)).toEqual([3334, 3334, 3333]);
    expect(installmentAmounts(10001, 24).reduce((a, b) => a + b, 0)).toBe(
      10001,
    );
  });
  it("deducts only recorded payments and discounts", () => {
    expect(
      invoiceBalance({ amount_paise: 10000, discount_paise: 500 }, [
        { amount_paise: 2000 },
      ]),
    ).toBe(7500);
  });
  it("keeps parent and teacher modules separate from owner finances", () => {
    expect(mayAccess("parent", "commercial")).toBe(false);
    expect(mayAccess("parent", "parent")).toBe(true);
    expect(mayAccess("teacher", "fees")).toBe(false);
    expect(mayAccess(null, "overview")).toBe(false);
  });
  it("treats adjacent classes as non-overlapping", () => {
    expect(
      overlaps(
        "2026-01-01T10:00Z",
        "2026-01-01T11:00Z",
        "2026-01-01T11:00Z",
        "2026-01-01T12:00Z",
      ),
    ).toBe(false);
    expect(
      overlaps(
        "2026-01-01T10:00Z",
        "2026-01-01T11:00Z",
        "2026-01-01T10:30Z",
        "2026-01-01T12:00Z",
      ),
    ).toBe(true);
  });
  it("uses India dates and converts IST timetable inputs", () => {
    expect(localDate(new Date("2026-10-10T20:00:00Z"))).toBe("2026-10-11");
    expect(
      parseField(
        { key: "time", label: "Time", type: "datetime-local" },
        "2026-10-11T10:00",
      ),
    ).toBe("2026-10-11T04:30:00.000Z");
  });
  it("blocks script URLs and malformed WhatsApp contacts", () => {
    expect(safeCheckoutUrl("javascript:alert(1)")).toBe(null);
    expect(safeCheckoutUrl("https://user:secret@example.com")).toBe(null);
    expect(() => whatsappDraft("+919999999999", "Hi")).toThrow();
    expect(whatsappDraft("919999999999", "Hi & welcome")).toBe(
      "https://wa.me/919999999999?text=Hi%20%26%20welcome",
    );
  });
  it("encodes UPI payee and amount without creating payment status", () => {
    expect(
      upiLink(
        { id: "settings", upi_id: "centre@bank", payee_name: "Skills Ville" },
        "test",
        105,
      ),
    ).toContain("am=1.05");
  });
  it("escapes untrusted report HTML and spreadsheet formulas", () => {
    expect(escapeHTML('<script>alert("x")</script>')).not.toContain("<script>");
    const csv = jsonToCSV(
      [{ name: '=HYPERLINK("bad")', amount: 3 }],
      [
        { key: "name", label: "Name" },
        { key: "amount", label: "Amount" },
      ],
    );
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(jsonToCSV([], [{ key: "name", label: "Name" }])).toBe('"Name"');
  });
});
