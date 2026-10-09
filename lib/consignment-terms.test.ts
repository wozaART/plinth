import { describe, expect, it } from "vitest";
import {
  TERMS_QUESTIONS,
  TERMS_SECTIONS,
  isTermsQuestionShown,
  type TermsQuestion,
} from "./consignment-terms";

describe("terms question definitions", () => {
  it("has unique question ids (answers are stored keyed by id)", () => {
    const ids = TERMS_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique section ids", () => {
    const ids = TERMS_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("flattens every section question", () => {
    expect(TERMS_QUESTIONS).toHaveLength(TERMS_SECTIONS.reduce((n, s) => n + s.questions.length, 0));
  });

  it("only gates on choice questions that exist, with a valid option", () => {
    for (const q of TERMS_QUESTIONS) {
      if (!q.showIf) continue;
      const parent = TERMS_QUESTIONS.find((p) => p.id === q.showIf!.id);
      if (!parent) throw new Error(`${q.id} depends on missing ${q.showIf.id}`);
      expect(parent.kind).toBe("choice");
      if (parent.kind === "choice") {
        expect(parent.options.map((o) => o.value)).toContain(q.showIf.equals);
      }
    }
  });

  it("gives choice questions unique option values", () => {
    for (const q of TERMS_QUESTIONS) {
      if (q.kind !== "choice") continue;
      const values = q.options.map((o) => o.value);
      expect(new Set(values).size, q.id).toBe(values.length);
    }
  });

  it("has sane bounds on number questions", () => {
    for (const q of TERMS_QUESTIONS) {
      if (q.kind === "number") expect(q.min).toBeLessThan(q.max);
    }
  });
});

describe("isTermsQuestionShown", () => {
  const ungated: TermsQuestion = { id: "a", kind: "text", label: "A" };
  const gated: TermsQuestion = {
    id: "b",
    kind: "text",
    label: "B",
    showIf: { id: "a", equals: "yes" },
  };

  it("always shows ungated questions", () => {
    expect(isTermsQuestionShown(ungated, {})).toBe(true);
  });

  it("shows a gated question only when the answer matches", () => {
    expect(isTermsQuestionShown(gated, { a: "yes" })).toBe(true);
    expect(isTermsQuestionShown(gated, { a: "no" })).toBe(false);
    expect(isTermsQuestionShown(gated, {})).toBe(false);
  });
});
