"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildNda, DEFAULT_PURPOSE, type NdaValues, type Party } from "@/lib/nda";
import { downloadMarkdown, downloadPdf } from "@/lib/download";

const today = () => new Date().toISOString().slice(0, 10);
const emptyParty: Party = { name: "", title: "", company: "", address: "" };
const toYears = (n: number) => Math.max(1, Math.floor(n) || 1);

const input =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";
const yearsInput = `${input} !w-20`;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      {children}
    </label>
  );
}

function PartyFields({
  title,
  party,
  onChange,
}: {
  title: string;
  party: Party;
  onChange: (p: Party) => void;
}) {
  const set = (k: keyof Party) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...party, [k]: e.target.value });
  return (
    <fieldset className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <Field label="Name">
        <input className={input} value={party.name} onChange={set("name")} />
      </Field>
      <Field label="Title">
        <input className={input} value={party.title} onChange={set("title")} />
      </Field>
      <Field label="Company">
        <input className={input} value={party.company} onChange={set("company")} />
      </Field>
      <Field label="Notice address" hint="Email or postal address">
        <input className={input} value={party.address} onChange={set("address")} />
      </Field>
    </fieldset>
  );
}

export default function NdaCreator({
  coverTemplate,
  termsTemplate,
}: {
  coverTemplate: string;
  termsTemplate: string;
}) {
  const [v, setV] = useState<NdaValues>({
    purpose: DEFAULT_PURPOSE,
    effectiveDate: "",
    termType: "expires",
    termYears: 1,
    confidentialityType: "years",
    confidentialityYears: 1,
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: emptyParty,
    party2: emptyParty,
  });
  // Set on mount: reading the clock during render breaks prerendering.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setV((p) => (p.effectiveDate ? p : { ...p, effectiveDate: today() }));
  }, []);
  const update = <K extends keyof NdaValues>(k: K, value: NdaValues[K]) =>
    setV((p) => ({ ...p, [k]: value }));
  const markdown = useMemo(
    () => buildNda(coverTemplate, termsTemplate, v),
    [coverTemplate, termsTemplate, v],
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-8 p-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <h1 className="text-2xl font-bold">Mutual NDA Creator</h1>
        <Field label="Purpose" hint="How Confidential Information may be used">
          <textarea
            className={input}
            rows={3}
            value={v.purpose}
            onChange={(e) => update("purpose", e.target.value)}
          />
        </Field>
        <Field label="Effective date">
          <input
            type="date"
            className={input}
            value={v.effectiveDate}
            onChange={(e) => update("effectiveDate", e.target.value)}
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">MNDA term</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="term"
              checked={v.termType === "expires"}
              onChange={() => update("termType", "expires")}
            />
            Expires after
            <input
              type="number"
              min={1}
              className={yearsInput}
              value={v.termYears}
              onChange={(e) => update("termYears", toYears(+e.target.value))}
            />
            year(s)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="term"
              checked={v.termType === "continues"}
              onChange={() => update("termType", "continues")}
            />
            Continues until terminated
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Term of confidentiality</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="confidentiality"
              checked={v.confidentialityType === "years"}
              onChange={() => update("confidentialityType", "years")}
            />
            <input
              type="number"
              min={1}
              className={yearsInput}
              value={v.confidentialityYears}
              onChange={(e) => update("confidentialityYears", toYears(+e.target.value))}
            />
            year(s) from effective date
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="confidentiality"
              checked={v.confidentialityType === "perpetuity"}
              onChange={() => update("confidentialityType", "perpetuity")}
            />
            In perpetuity
          </label>
        </fieldset>

        <Field label="Governing law" hint="State, e.g. Delaware">
          <input
            className={input}
            value={v.governingLaw}
            onChange={(e) => update("governingLaw", e.target.value)}
          />
        </Field>
        <Field
          label="Jurisdiction"
          hint="City or county and state, e.g. New Castle, DE (inserted after “courts located in”)"
        >
          <input
            className={input}
            value={v.jurisdiction}
            onChange={(e) => update("jurisdiction", e.target.value)}
          />
        </Field>
        <Field label="MNDA modifications" hint="Optional; leave blank for none">
          <textarea
            className={input}
            rows={3}
            value={v.modifications}
            onChange={(e) => update("modifications", e.target.value)}
          />
        </Field>

        <PartyFields title="Party 1" party={v.party1} onChange={(p) => update("party1", p)} />
        <PartyFields title="Party 2" party={v.party2} onChange={(p) => update("party2", p)} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => downloadPdf(markdown)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => downloadMarkdown(markdown)}
            className="rounded-md border border-zinc-400 px-4 py-2 text-sm font-medium"
          >
            Download Markdown
          </button>
        </div>
      </form>

      <article className="space-y-3 rounded-md border border-zinc-200 p-8 text-sm leading-relaxed dark:border-zinc-800 [&_a]:underline [&_em]:text-zinc-500 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-semibold [&_hr]:my-8 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li]:mb-3 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
}
