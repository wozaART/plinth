import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/test/fake-supabase";
import { validFormData } from "@/test/form-data";
import { getResearchForm, researchQuestions } from "@/lib/research-forms";

const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase }));

vi.mock("next/headers", () => ({ cookies: async () => ({}) }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => h.fake.client }));

import { submitResearchResponse } from "./research-actions";

const SLUG = "lay-by";
const questions = researchQuestions(getResearchForm(SLUG)!);
const roleQuestion = questions.find((q) => q.id === "respondent_role");
const role = roleQuestion?.kind === "choice" ? roleQuestion.options[0].value : "";
const respondent = { respondent_name: "Pat", respondent_role: role, respondent_email: "pat@a.co" };

beforeEach(() => {
  h.fake = createFakeSupabase();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("submitResearchResponse", () => {
  it("silently succeeds without writing when the honeypot is filled", async () => {
    const fd = validFormData(questions, respondent);
    fd.set("website", "http://spam.example");
    expect(await submitResearchResponse(SLUG, fd)).toEqual({ ok: true });
    expect(h.fake.queries).toHaveLength(0);
  });

  it("rejects an unknown form slug", async () => {
    const result = await submitResearchResponse("nope", validFormData(questions, respondent));
    expect(result).toEqual({ ok: false, message: "We couldn't find that form.", errors: {} });
    expect(h.fake.queries).toHaveLength(0);
  });

  it("returns validation errors and writes nothing", async () => {
    const result = await submitResearchResponse(SLUG, validFormData(questions, { ...respondent, respondent_email: "bad" }));
    expect(result).toMatchObject({ ok: false, message: "A few answers need another look." });
    if (!result.ok) expect(result.errors.respondent_email).toBe("Enter a valid email address.");
    expect(h.fake.queries).toHaveLength(0);
  });

  it("inserts respondent columns separately from the answers", async () => {
    expect(await submitResearchResponse(SLUG, validFormData(questions, respondent))).toEqual({ ok: true });
    const payload = h.fake.last("research_responses", "insert")?.payload as Record<string, unknown> & {
      answers: Record<string, string>;
    };
    expect(payload).toMatchObject({ form_slug: SLUG, ...respondent });
    expect(payload.answers).not.toHaveProperty("respondent_name");
    expect(payload.answers).not.toHaveProperty("respondent_email");
  });

  it("stores a blank email as null", async () => {
    await submitResearchResponse(SLUG, validFormData(questions, { ...respondent, respondent_email: "" }));
    const payload = h.fake.last("research_responses", "insert")?.payload as { respondent_email: unknown };
    expect(payload.respondent_email).toBeNull();
  });

  it("reports a save failure", async () => {
    h.fake.on("research_responses", "insert", { data: null, error: { message: "boom" } });
    expect(await submitResearchResponse(SLUG, validFormData(questions, respondent))).toEqual({
      ok: false,
      message: "We couldn't save your answers. Please try again.",
      errors: {},
    });
  });
});
