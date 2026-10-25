export type Party = {
  name: string;
  title: string;
  company: string;
  address: string;
};

export type NdaValues = {
  purpose: string;
  effectiveDate: string; // ISO yyyy-mm-dd
  termType: "expires" | "continues";
  termYears: number;
  confidentialityType: "years" | "perpetuity";
  confidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: Party;
  party2: Party;
};

export const DEFAULT_PURPOSE =
  "Evaluating whether to enter into a business relationship with the other party.";

const years = (n: number) => `${n} year${n === 1 ? "" : "s"}`;
const check = (on: boolean) => (on ? "[x]" : "[ ]");

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const blank = (s: string, placeholder: string) => s.trim() || placeholder;

/** Replace the body of a `### Heading` section, keeping any `<label>` line. */
function replaceSection(md: string, heading: string, body: string): string {
  const start = md.indexOf(`### ${heading}`);
  if (start === -1) throw new Error(`Cover page section not found: ${heading}`);
  const headingEnd = md.indexOf("\n", start) + 1;
  const next = md.slice(headingEnd).search(/^(### |By signing)/m);
  const end = next === -1 ? md.length : headingEnd + next;
  const section = md.slice(headingEnd, end);
  const label = section.match(/^<label>.*<\/label>\n/m)?.[0] ?? "";
  return md.slice(0, headingEnd) + label + body + "\n\n" + md.slice(end);
}

function signatureTable(p1: Party, p2: Party): string {
  const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    "| | PARTY 1 | PARTY 2 |",
    "|:--- | :----: | :----: |",
    "| Signature | | |",
    `| Print Name | ${cell(p1.name)} | ${cell(p2.name)} |`,
    `| Title | ${cell(p1.title)} | ${cell(p2.title)} |`,
    `| Company | ${cell(p1.company)} | ${cell(p2.company)} |`,
    `| Notice Address | ${cell(p1.address)} | ${cell(p2.address)} |`,
    "| Date | | |",
  ].join("\n");
}

function tidy(md: string): string {
  return md
    .replace(/<label>(.*?)<\/label>/g, "*$1*")
    .replace(/<\/?span[^>]*>/g, "");
}

export function buildCoverPage(template: string, v: NdaValues): string {
  let md = template.replace(/\r\n/g, "\n");
  md = replaceSection(md, "Purpose", blank(v.purpose, DEFAULT_PURPOSE));
  md = replaceSection(md, "Effective Date", formatDate(v.effectiveDate));
  md = replaceSection(
    md,
    "MNDA Term",
    [
      `- ${check(v.termType === "expires")} Expires ${years(v.termYears)} from Effective Date.`,
      `- ${check(v.termType === "continues")} Continues until terminated in accordance with the terms of the MNDA.`,
    ].join("\n"),
  );
  md = replaceSection(
    md,
    "Term of Confidentiality",
    [
      `- ${check(v.confidentialityType === "years")} ${years(v.confidentialityYears)} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
      `- ${check(v.confidentialityType === "perpetuity")} In perpetuity.`,
    ].join("\n"),
  );
  md = replaceSection(
    md,
    "Governing Law & Jurisdiction",
    `Governing Law: ${blank(v.governingLaw, "[Governing law]")}\n\nJurisdiction: ${blank(v.jurisdiction, "[Jurisdiction]")}`,
  );
  md = replaceSection(
    md,
    "MNDA Modifications",
    v.modifications.trim() || "None.",
  );
  md = md.replace(
    /^\|\|.*\n(?:\|.*\n?)+/m,
    signatureTable(v.party1, v.party2) + "\n\n",
  );
  return tidy(md).trim();
}

export function buildStandardTerms(template: string, v: NdaValues): string {
  const values: Record<string, string> = {
    Purpose: blank(v.purpose, DEFAULT_PURPOSE).replace(/\.$/, ""),
    "Effective Date": formatDate(v.effectiveDate),
    "Governing Law": blank(v.governingLaw, "[Governing law]"),
    Jurisdiction: blank(v.jurisdiction, "[Jurisdiction]"),
  };
  const md = template.replace(/\r\n/g, "\n").replace(
    /<span class="coverpage_link">(.*?)<\/span>/g,
    (_, key: string) => (key in values ? `**${values[key]}**` : key),
  );
  return tidy(md).trim();
}

export function buildNda(
  coverTemplate: string,
  termsTemplate: string,
  v: NdaValues,
): string {
  return `${buildCoverPage(coverTemplate, v)}\n\n---\n\n${buildStandardTerms(termsTemplate, v)}\n`;
}
