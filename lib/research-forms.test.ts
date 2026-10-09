import { describe, expect, it } from "vitest";
import { RESEARCH_FORMS, getResearchForm, researchQuestions } from "./research-forms";
import { validateAnswers } from "./form-validation";

describe("research form definitions", () => {
  it("covers GitHub issues 48 to 58, once each", () => {
    expect(RESEARCH_FORMS.map((f) => f.issue).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 11 }, (_, i) => 48 + i),
    );
  });

  it("has unique, url-safe slugs", () => {
    const slugs = RESEARCH_FORMS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it("has unique question ids within each form (answers are keyed by id)", () => {
    for (const form of RESEARCH_FORMS) {
      const ids = researchQuestions(form).map((q) => q.id);
      expect(new Set(ids).size, form.slug).toBe(ids.length);
    }
  });

  it("gives choice questions unique option values", () => {
    for (const form of RESEARCH_FORMS) {
      for (const q of researchQuestions(form)) {
        if (q.kind !== "choice") continue;
        const values = q.options.map((o) => o.value);
        expect(new Set(values).size, `${form.slug}/${q.id}`).toBe(values.length);
      }
    }
  });

  it("looks forms up by slug", () => {
    expect(getResearchForm("lay-by")?.issue).toBe(49);
    expect(getResearchForm("nope")).toBeUndefined();
  });
});

describe("validateAnswers with a research form", () => {
  const form = getResearchForm("lay-by")!;
  const questions = researchQuestions(form);

  function data(entries: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.set(k, v);
    return fd;
  }

  it("requires name, role, pain and value", () => {
    const { errors } = validateAnswers(questions, data({}), ["respondent_email"]);
    expect(Object.keys(errors).sort()).toEqual(["pain", "respondent_name", "respondent_role", "value"]);
  });

  it("accepts a minimal valid response and rejects unknown options and bad emails", () => {
    const ok = validateAnswers(
      questions,
      data({ respondent_name: "Ana", respondent_role: "artist", pain: "real", value: "4" }),
      ["respondent_email"],
    );
    expect(ok.errors).toEqual({});

    const bad = validateAnswers(
      questions,
      data({ respondent_name: "Ana", respondent_role: "artist", pain: "bogus", value: "4", respondent_email: "x" }),
      ["respondent_email"],
    );
    expect(Object.keys(bad.errors).sort()).toEqual(["pain", "respondent_email"]);
  });
});
