import { describe, expect, it } from "vitest";
import { validateAnswers } from "./form-validation";
import { TERMS_TEXT_LIMITS, type TermsQuestion } from "./consignment-terms";

const questions: TermsQuestion[] = [
  { id: "name", kind: "text", label: "Name", required: true },
  { id: "notes", kind: "longtext", label: "Notes" },
  { id: "rate", kind: "number", label: "Rate", min: 0, max: 100, suffix: "%" },
  {
    id: "kind",
    kind: "choice",
    label: "Kind",
    required: true,
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
  { id: "why_b", kind: "text", label: "Why B?", required: true, showIf: { id: "kind", equals: "b" } },
  { id: "email", kind: "text", label: "Email" },
];

function data(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const ok = { name: "Ana", kind: "a" };

describe("validateAnswers", () => {
  it("accepts a minimal valid submission and returns only answered fields", () => {
    expect(validateAnswers(questions, data(ok))).toEqual({ values: ok, errors: {} });
  });

  it("flags missing required answers and ignores missing optional ones", () => {
    const { errors, values } = validateAnswers(questions, data({}));
    expect(errors).toEqual({ name: "Please answer this one.", kind: "Please answer this one." });
    expect(values).toEqual({});
  });

  it("trims whitespace, treating whitespace-only as unanswered", () => {
    const { values, errors } = validateAnswers(questions, data({ name: "  Ana  ", kind: "a", notes: "   " }));
    expect(values).toEqual({ name: "Ana", kind: "a" });
    expect(errors).toEqual({});
    expect(validateAnswers(questions, data({ name: "   ", kind: "a" })).errors.name).toBe("Please answer this one.");
  });

  describe("choice", () => {
    it("rejects values that aren't an option", () => {
      const { errors, values } = validateAnswers(questions, data({ ...ok, kind: "c" }));
      expect(errors.kind).toBe("Pick one of the options.");
      expect(values).not.toHaveProperty("kind");
    });

    it("matches option values exactly (case-sensitive)", () => {
      expect(validateAnswers(questions, data({ ...ok, kind: "A" })).errors.kind).toBe("Pick one of the options.");
    });
  });

  describe("number", () => {
    it.each([
      ["0", "0"],
      ["100", "100"],
      ["37.5", "37.5"],
      ["37,5", "37.5"],
      ["040", "40"],
    ])("accepts %j and stores %j", (input, stored) => {
      const { values, errors } = validateAnswers(questions, data({ ...ok, rate: input }));
      expect(errors).toEqual({});
      expect(values.rate).toBe(stored);
    });

    it.each(["-1", "101", "abc", "Infinity", "1e999", "12%"])("rejects %j", (input) => {
      const { values, errors } = validateAnswers(questions, data({ ...ok, rate: input }));
      expect(errors.rate).toBe("Enter a number from 0 to 100.");
      expect(values).not.toHaveProperty("rate");
    });
  });

  describe("text length", () => {
    it("allows text and longtext up to their limits", () => {
      const { errors } = validateAnswers(
        questions,
        data({ ...ok, name: "x".repeat(TERMS_TEXT_LIMITS.text), notes: "y".repeat(TERMS_TEXT_LIMITS.longtext) }),
      );
      expect(errors).toEqual({});
    });

    it("rejects text and longtext beyond their limits", () => {
      const { errors, values } = validateAnswers(
        questions,
        data({ ...ok, name: "x".repeat(TERMS_TEXT_LIMITS.text + 1), notes: "y".repeat(TERMS_TEXT_LIMITS.longtext + 1) }),
      );
      expect(errors.name).toBe(`Keep this under ${TERMS_TEXT_LIMITS.text} characters.`);
      expect(errors.notes).toBe(`Keep this under ${TERMS_TEXT_LIMITS.longtext} characters.`);
      expect(values).not.toHaveProperty("name");
      expect(values).not.toHaveProperty("notes");
    });
  });

  describe("conditional questions", () => {
    it("requires a follow-up only when its condition is met", () => {
      expect(validateAnswers(questions, data({ ...ok, kind: "b" })).errors).toEqual({ why_b: "Please answer this one." });
      expect(validateAnswers(questions, data(ok)).errors).toEqual({});
    });

    it("drops answers to questions whose condition isn't met", () => {
      const { values } = validateAnswers(questions, data({ ...ok, why_b: "sneaky" }));
      expect(values).not.toHaveProperty("why_b");
    });

    it("keeps the follow-up answer when its condition is met", () => {
      const { values, errors } = validateAnswers(questions, data({ ...ok, kind: "b", why_b: "because" }));
      expect(errors).toEqual({});
      expect(values.why_b).toBe("because");
    });
  });

  describe("emails", () => {
    it.each(["a@b.co", "first.last+tag@sub.example.com"])("accepts %j", (email) => {
      expect(validateAnswers(questions, data({ ...ok, email }), ["email"]).errors).toEqual({});
    });

    it.each(["plain", "a@b", "a b@c.co", "@c.co", "a@@c.co"])("rejects %j", (email) => {
      const { errors } = validateAnswers(questions, data({ ...ok, email }), ["email"]);
      expect(errors.email).toBe("Enter a valid email address.");
    });

    it("allows an empty email, and doesn't check fields not listed as emails", () => {
      expect(validateAnswers(questions, data(ok), ["email"]).errors).toEqual({});
      expect(validateAnswers(questions, data({ ...ok, email: "not-an-email" })).errors).toEqual({});
    });
  });

  it("ignores form fields that aren't in the question list", () => {
    const { values } = validateAnswers(questions, data({ ...ok, injected: "x", website: "y" }));
    expect(values).toEqual(ok);
  });

  it("reports every problem at once", () => {
    const { errors } = validateAnswers(questions, data({ name: "", kind: "z", rate: "500" }));
    expect(Object.keys(errors).sort()).toEqual(["kind", "name", "rate"]);
  });
});
