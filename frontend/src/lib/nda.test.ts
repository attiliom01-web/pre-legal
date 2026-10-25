import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildNda, formatDate, type NdaValues } from "./nda";

const dir = join(__dirname, "..", "templates");
const cover = readFileSync(join(dir, "Mutual-NDA-coverpage.md"), "utf8");
const terms = readFileSync(join(dir, "Mutual-NDA.md"), "utf8");

const values: NdaValues = {
  purpose: "Exploring a partnership.",
  effectiveDate: "2026-03-05",
  termType: "expires",
  termYears: 2,
  confidentialityType: "years",
  confidentialityYears: 1,
  governingLaw: "Delaware",
  jurisdiction: "New Castle, DE",
  modifications: "",
  party1: { name: "Ada", title: "CEO", company: "Acme", address: "a@acme.com" },
  party2: { name: "Bob", title: "CTO", company: "Beta", address: "b@beta.com" },
};

describe("buildNda", () => {
  const out = buildNda(cover, terms, values);

  it("formats dates without timezone drift", () => {
    expect(formatDate("2026-03-05")).toBe("March 5, 2026");
  });

  it("fills the cover page", () => {
    expect(out).toContain("Exploring a partnership.");
    expect(out).toContain("March 5, 2026");
    expect(out).toContain("- [x] Expires 2 years from Effective Date.");
    expect(out).toContain("- [ ] Continues until terminated");
    expect(out).toContain("- [x] 1 year from Effective Date");
    expect(out).toContain("- [ ] In perpetuity.");
    expect(out).toContain("Governing Law: Delaware");
    expect(out).toContain("| Company | Acme | Beta |");
  });

  it("fills the standard terms and strips template markup", () => {
    expect(out).toContain("laws of the State of **Delaware**");
    expect(out).toContain("courts located in **New Castle, DE**");
    expect(out).not.toMatch(/<span|<label|\[Fill in/);
  });

  it("supports perpetuity and continuing terms", () => {
    const o = buildNda(cover, terms, {
      ...values,
      termType: "continues",
      confidentialityType: "perpetuity",
    });
    expect(o).toContain("- [x] Continues until terminated");
    expect(o).toContain("- [x] In perpetuity.");
  });
});
