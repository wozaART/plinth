// Short user-research forms at /forms/<slug>, one per idea being validated
// (GitHub issues #48-#58). Every form asks the same core questions (is it a
// real problem, how do you cope today, how much would you value it, what
// would shape the design) plus two questions specific to the idea. Questions
// reuse the TermsQuestion shape so the shared Field component renders them.
// Answers are stored as JSON keyed by question id; never reuse an id for a
// new meaning.

import type { TermsOption, TermsQuestion } from "@/lib/consignment-terms";

export type ResearchForm = {
  slug: string;
  /** GitHub issue the findings are summarised back to. */
  issue: number;
  title: string;
  /** One line shown on the forms index. */
  summary: string;
  /** Paragraph shown at the top of the form. */
  intro: string;
  /** The two idea-specific questions. */
  questions: TermsQuestion[];
};

const YES_NO_UNSURE: TermsOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

const FREQUENCY: TermsOption[] = [
  { value: "often", label: "Often" },
  { value: "sometimes", label: "Sometimes" },
  { value: "rarely", label: "Rarely" },
  { value: "never", label: "Never" },
];

export const RESEARCH_ABOUT_QUESTIONS: TermsQuestion[] = [
  { id: "respondent_name", kind: "text", label: "Your name", required: true },
  {
    id: "respondent_role",
    kind: "choice",
    label: "Which describes you best?",
    required: true,
    options: [
      { value: "artist", label: "An artist" },
      { value: "gallery", label: "I run or work at a gallery" },
      { value: "both", label: "Both" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "respondent_email",
    kind: "text",
    label: "Your email",
    placeholder: "you@example.com",
    hint: "Only so we can ask a follow-up question. Leave it blank to stay anonymous.",
  },
];

export const RESEARCH_CORE_QUESTIONS: TermsQuestion[] = [
  {
    id: "pain",
    kind: "choice",
    label: "Is this a problem for you today?",
    required: true,
    options: [
      { value: "real", label: "Yes, a real one" },
      { value: "occasional", label: "Occasionally" },
      { value: "none", label: "Not really" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "workaround",
    kind: "longtext",
    label: "How do you handle it today?",
    placeholder: "e.g. A spreadsheet, WhatsApp messages, nothing",
  },
  {
    id: "value",
    kind: "choice",
    label: "How much would you value this?",
    required: true,
    options: [
      { value: "1", label: "1 · Not useful to me" },
      { value: "2", label: "2 · Slightly useful" },
      { value: "3", label: "3 · Useful" },
      { value: "4", label: "4 · Very useful" },
      { value: "5", label: "5 · I would choose a platform for this" },
    ],
  },
];

export const RESEARCH_CLOSING_QUESTIONS: TermsQuestion[] = [
  {
    id: "must_haves",
    kind: "longtext",
    label: "What would it have to do to be worth using?",
  },
  {
    id: "dealbreakers",
    kind: "longtext",
    label: "What would make you not want it?",
  },
];

export const RESEARCH_FORMS: ResearchForm[] = [
  {
    slug: "consignment-ledger",
    issue: 48,
    title: "Transparent consignment ledger",
    summary: "Each work's status, the commission split and a payout date, visible to the artist.",
    intro:
      "Imagine an artist could see, for each work, whether it is available, reserved or sold, how the sale price is split, and when they will be paid. A sale would only be finished once the artist confirms they were paid.",
    questions: [
      {
        id: "sale_visibility",
        kind: "choice",
        label: "What does an artist see about their work once it is with a gallery?",
        options: [
          { value: "nothing", label: "Nothing until they are paid" },
          { value: "told_when_sold", label: "They are told when it sells" },
          { value: "statement", label: "A statement with the split and payout date" },
          { value: "varies", label: "It varies" },
        ],
      },
      {
        id: "payout_confirmation",
        kind: "choice",
        label: "Should a sale only count as finished when the artist confirms they were paid?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "depends", label: "It depends" },
        ],
      },
    ],
  },
  {
    slug: "lay-by",
    issue: 49,
    title: "Lay-by (instalment) buying",
    summary: "A reserved work with a payment schedule that gallery and artist can both see.",
    intro:
      "Lay-by is familiar to South African buyers. Imagine a work held for a buyer while they pay in instalments, with the schedule visible to both the gallery and the artist.",
    questions: [
      {
        id: "layby_today",
        kind: "choice",
        label: "Do you sell work on lay-by or in instalments today?",
        options: [
          { value: "regularly", label: "Regularly" },
          { value: "occasionally", label: "Occasionally" },
          { value: "asked_no", label: "Buyers ask, but we say no" },
          { value: "never", label: "No, and nobody asks" },
        ],
      },
      {
        id: "layby_hold",
        kind: "choice",
        label: "How long would you hold a work for an instalment buyer?",
        options: [
          { value: "up_to_3", label: "Up to 3 months" },
          { value: "up_to_6", label: "Up to 6 months" },
          { value: "up_to_12", label: "Up to 12 months" },
          { value: "depends", label: "It depends on the price" },
          { value: "none", label: "I wouldn't" },
        ],
      },
    ],
  },
  {
    slug: "framing-advances",
    issue: 50,
    title: "Framing advances",
    summary: "The gallery fronts the frame and recovers it from the sale.",
    intro:
      "Imagine the gallery pays for framing up front through its frameshop queue, then recovers the cost from the sale. The deduction is shown to the artist before they agree.",
    questions: [
      {
        id: "framing_payer",
        kind: "choice",
        label: "Who pays for framing today?",
        options: [
          { value: "artist", label: "The artist" },
          { value: "gallery", label: "The gallery" },
          { value: "split", label: "It is split" },
          { value: "buyer", label: "The buyer" },
          { value: "varies", label: "It varies" },
        ],
      },
      {
        id: "framing_recovery",
        kind: "choice",
        label: "Is recovering the frame cost from the sale fair?",
        options: [
          { value: "yes_upfront", label: "Yes, if the artist sees it up front" },
          { value: "if_agreed", label: "Only if the artist agrees each time" },
          { value: "no", label: "No" },
          { value: "unsure", label: "Not sure" },
        ],
      },
    ],
  },
  {
    slug: "income-statements",
    issue: 51,
    title: "Income statements for artists",
    summary: "A yearly statement generated from sales, for grants, credit or tax.",
    intro:
      "Many artists earn informally and struggle to show income. Imagine a yearly statement generated from the sales a gallery makes on their behalf.",
    questions: [
      {
        id: "income_proof_use",
        kind: "choice",
        label: "What would you mainly use a statement of artwork income for?",
        options: [
          { value: "grants", label: "Grant or funding applications" },
          { value: "credit", label: "Bank credit or a lease" },
          { value: "tax", label: "Tax" },
          { value: "none", label: "I wouldn't need one" },
        ],
      },
      {
        id: "income_proof_accepted",
        kind: "choice",
        label: "Would a bank, funder or SARS accept a statement from a gallery?",
        options: YES_NO_UNSURE,
      },
    ],
  },
  {
    slug: "second-look",
    issue: 52,
    title: "“Second look” cross-gallery network",
    summary: "With the artist's consent, a declined work is offered to other galleries on the platform.",
    intro:
      "Imagine a declined work could, with the artist's consent, be offered to other galleries on the platform. One artist profile would then reach many galleries.",
    questions: [
      {
        id: "second_look_consent",
        kind: "choice",
        label: "If your work were declined, would you want other galleries to see it?",
        options: [
          { value: "always", label: "Yes, always" },
          { value: "case_by_case", label: "Case by case" },
          { value: "no", label: "No" },
        ],
      },
      {
        id: "location",
        kind: "choice",
        label: "Where are you or your gallery based?",
        options: [
          { value: "cape_town", label: "Cape Town" },
          { value: "johannesburg", label: "Johannesburg" },
          { value: "elsewhere_sa", label: "Elsewhere in South Africa" },
          { value: "outside_sa", label: "Outside South Africa" },
        ],
      },
    ],
  },
  {
    slug: "decline-reasons",
    issue: 53,
    title: "Structured decline reasons",
    summary: "Reasons such as fit, size or pricing turn a rejection into feedback.",
    intro:
      "Imagine a declined submission came with chosen reasons, such as “wrong fit for this show”, “size” or “pricing”, instead of a bare no.",
    questions: [
      {
        id: "decline_feedback_today",
        kind: "choice",
        label: "What does an artist get today when their work is declined?",
        options: [
          { value: "nothing", label: "Nothing" },
          { value: "short_note", label: "A short note" },
          { value: "detailed", label: "Detailed feedback" },
          { value: "varies", label: "It varies" },
        ],
      },
      {
        id: "decline_format",
        kind: "choice",
        label: "What would be most useful?",
        options: [
          { value: "list", label: "Reasons picked from a list" },
          { value: "list_and_note", label: "A list plus a written note" },
          { value: "note", label: "A written note only" },
          { value: "none", label: "No feedback at all" },
        ],
      },
    ],
  },
  {
    slug: "whatsapp-first",
    issue: 54,
    title: "WhatsApp-first acknowledgements",
    summary: "Decisions, invitations and drop-off passes delivered on WhatsApp.",
    intro:
      "Many artists live on WhatsApp, not email. Imagine decisions, invitations and drop-off passes arriving there.",
    questions: [
      {
        id: "reliable_channel",
        kind: "choice",
        label: "Where do you most reliably see messages?",
        required: true,
        options: [
          { value: "whatsapp", label: "WhatsApp" },
          { value: "email", label: "Email" },
          { value: "sms", label: "SMS" },
          { value: "instagram", label: "Instagram" },
        ],
      },
      {
        id: "whatsapp_optin",
        kind: "choice",
        label: "Would you be comfortable receiving these on WhatsApp?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "opt_in", label: "Only if I opt in" },
          { value: "email_only", label: "I prefer email" },
        ],
      },
    ],
  },
  {
    slug: "pooled-drop-offs",
    issue: 55,
    title: "Pooled drop-off runs",
    summary: "Several galleries share one consolidated collection day from an outlying town.",
    intro:
      "Imagine several galleries sharing a single collection day from an outlying town, using the drop-off pass, to cut courier cost and damage.",
    questions: [
      {
        id: "delivery_today",
        kind: "choice",
        label: "How does work reach the gallery today?",
        options: [
          { value: "self", label: "The artist delivers it" },
          { value: "courier", label: "A courier" },
          { value: "gallery_collects", label: "The gallery collects it" },
          { value: "mixed", label: "A mix" },
        ],
      },
      {
        id: "shared_collection",
        kind: "choice",
        label: "Would you wait for a shared collection day if it cost less?",
        options: [
          { value: "yes", label: "Yes, if the date is fixed" },
          { value: "not_urgent", label: "Only when it isn't urgent" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
  {
    slug: "viewing-rooms",
    issue: 56,
    title: "Private viewing rooms on your own domain",
    summary: "Private viewing rooms for international buyers on the gallery's own domain.",
    intro:
      "The weak rand makes South African work attractive abroad. Imagine a private viewing room for an international buyer, on the gallery's own website address.",
    questions: [
      {
        id: "international_enquiries",
        kind: "choice",
        label: "Do international buyers ask about your work or your gallery's?",
        options: FREQUENCY,
      },
      {
        id: "own_domain",
        kind: "choice",
        label: "Does the gallery have its own website address?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "planning", label: "Not yet, but planned" },
          { value: "no", label: "No" },
          { value: "na", label: "I'm an artist, not a gallery" },
        ],
      },
    ],
  },
  {
    slug: "shared-booths",
    issue: 57,
    title: "Shared fair booths",
    summary: "Combined inventory and a sales split across three or four galleries.",
    intro:
      "Small galleries can't afford the big fairs alone. Imagine three or four galleries sharing a booth, with combined inventory and an agreed sales split.",
    questions: [
      {
        id: "fair_history",
        kind: "choice",
        label: "Have you shown at an art fair in the last three years?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "too_costly", label: "No, it was too costly" },
          { value: "no_interest", label: "No, not interested" },
        ],
      },
      {
        id: "booth_partners",
        kind: "choice",
        label: "How many galleries could comfortably share a booth?",
        options: [
          { value: "2", label: "Two" },
          { value: "3_4", label: "Three or four" },
          { value: "5_plus", label: "Five or more" },
          { value: "none", label: "I wouldn't share" },
        ],
      },
    ],
  },
  {
    slug: "provenance-certificates",
    issue: 58,
    title: "Provenance and certificates",
    summary: "A certificate issued from the submission, approval, catalogue and sale record.",
    intro:
      "Every work already leaves a trail: submission, approval, catalogue and sale. Imagine a certificate of provenance issued from that record.",
    questions: [
      {
        id: "certificate_requests",
        kind: "choice",
        label: "Do buyers ask for a certificate or proof of provenance?",
        options: FREQUENCY,
      },
      {
        id: "certificate_today",
        kind: "choice",
        label: "How is one produced today?",
        options: [
          { value: "gallery", label: "The gallery writes it" },
          { value: "artist", label: "The artist supplies it" },
          { value: "not_issued", label: "We don't issue them" },
        ],
      },
      {
        id: "royalty_records",
        kind: "choice",
        label: "If an artist resale royalty came into force, would you want sale records ready for it?",
        options: YES_NO_UNSURE,
      },
    ],
  },
];

export function getResearchForm(slug: string): ResearchForm | undefined {
  return RESEARCH_FORMS.find((f) => f.slug === slug);
}

/** Every question a form asks, in order. */
export function researchQuestions(form: ResearchForm): TermsQuestion[] {
  return [...RESEARCH_ABOUT_QUESTIONS, ...RESEARCH_CORE_QUESTIONS, ...form.questions, ...RESEARCH_CLOSING_QUESTIONS];
}

/** The form's questions grouped for rendering. */
export function researchSections(form: ResearchForm) {
  return [
    { id: "about", title: "About you", questions: RESEARCH_ABOUT_QUESTIONS },
    { id: "idea", title: "The idea", intro: form.intro, questions: [...RESEARCH_CORE_QUESTIONS, ...form.questions] },
    { id: "design", title: "Shaping it", questions: RESEARCH_CLOSING_QUESTIONS },
  ];
}
