import { describe, expect, it } from "vitest";
import { isSubmissionEditable, type SubmissionStatus } from "./types";

describe("isSubmissionEditable", () => {
  it.each<[SubmissionStatus, boolean]>([
    ["pending", true],
    ["changes", true],
    ["approved", false],
    ["declined", false],
  ])("%s -> %s", (status, editable) => {
    expect(isSubmissionEditable(status)).toBe(editable);
  });
});
