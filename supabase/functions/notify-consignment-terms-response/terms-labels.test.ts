import { describe, expect, it } from "vitest";
import { answersToRows, TERMS_QUESTIONS } from "./terms-labels.ts";

describe("answersToRows", () => {
  it("maps known question ids to their labels, in answer order", () => {
    expect(answersToRows({ commission_percent: "40", notes: "Hi" })).toEqual([
      { label: "Commission %", value: "40" },
      { label: "Notes", value: "Hi" },
    ]);
  });

  it("drops empty answers", () => {
    expect(answersToRows({ commission_percent: "", notes: "x" })).toEqual([{ label: "Notes", value: "x" }]);
  });

  it("keeps unknown ids under their raw key rather than losing the answer", () => {
    expect(answersToRows({ brand_new_question: "yes" })).toEqual([{ label: "brand_new_question", value: "yes" }]);
  });

  it("returns nothing for no answers", () => {
    expect(answersToRows({})).toEqual([]);
  });
});

describe("TERMS_QUESTIONS", () => {
  it("has a non-empty label for every question", () => {
    for (const [id, label] of Object.entries(TERMS_QUESTIONS)) expect(label, id).toBeTruthy();
  });
});
