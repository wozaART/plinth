import type { Submission, Exhibition, CatalogueWork, Contact, FrameJob } from "./types";

export const SUBMISSIONS: Submission[] = [
  { id: "s1", title: "Veld at First Light", artist: "Thandiwe Mokoena", year: 2024, medium: "Oil on canvas", dim: "120 × 90 cm", price: "R 24 000", forEx: "Highveld Light", date: "2 days ago", status: "pending", note: "", statement: "A study of dawn breaking over the Highveld grasslands — part of an ongoing series on light and memory in the interior." },
  { id: "s2", title: "Mother Tongue III", artist: "Sipho Dlamini", year: 2023, medium: "Mixed media on board", dim: "80 × 80 cm", price: "R 18 500", forEx: "Highveld Light", date: "3 days ago", status: "pending", note: "", statement: "Layered text and pigment exploring isiZulu idiom and inherited language." },
  { id: "s3", title: "Salt Pan, Evening", artist: "Lerato Khumalo", year: 2024, medium: "Acrylic on canvas", dim: "100 × 70 cm", price: "R 21 000", forEx: "Open submissions", date: "4 days ago", status: "pending", note: "", statement: "The Makgadikgadi at dusk, painted from field sketches made over three winters." },
  { id: "s4", title: "Untitled (Wire Figure)", artist: "Johan Pretorius", year: 2024, medium: "Galvanised wire", dim: "45 × 30 × 30 cm", price: "R 9 800", forEx: "Open submissions", date: "5 days ago", status: "pending", note: "", statement: "A small standing figure continuing my exploration of township wire craft as fine-art form." },
  { id: "s5", title: "Harbour, Kalk Bay", artist: "Aisha Patel", year: 2023, medium: "Watercolour on paper", dim: "56 × 38 cm", price: "R 7 200", forEx: "Open submissions", date: "1 week ago", status: "pending", note: "", statement: "Plein-air watercolour of the working harbour at first light." },
  { id: "s6", title: "Red Ground", artist: "Nomvula Zulu", year: 2024, medium: "Oil on linen", dim: "150 × 110 cm", price: "R 38 000", forEx: "Highveld Light", date: "1 week ago", status: "approved", note: "A strong, confident work — exactly the scale the east wall needs. Welcome aboard.", statement: "Large-format abstraction in oxide reds drawn from the soil of my grandmother's farm." },
  { id: "s7", title: "Three Vessels", artist: "Karel Botha", year: 2024, medium: "Raku-fired ceramic", dim: "Var. to 40 cm", price: "R 12 400", forEx: "Highveld Light", date: "1 week ago", status: "approved", note: "Beautiful glaze work. Please bring all three as a set.", statement: "A trio of raku vessels exploring crackle glaze and negative space." },
  { id: "s8", title: "City After Rain", artist: "Tariq Hendricks", year: 2022, medium: "Digital print, ed. 5", dim: "90 × 60 cm", price: "R 6 500", forEx: "Open submissions", date: "2 weeks ago", status: "declined", note: "Thank you for submitting. The work is accomplished, but editioned digital prints fall outside the original-works remit of this exhibition. We'd welcome painted or unique works for the autumn open call.", ack: false, statement: "Long-exposure street photography of Johannesburg, printed as a limited edition." },
];

export const EXHIBITIONS: Exhibition[] = [
  { title: "Highveld Light", dates: "12 Jul – 30 Aug 2025", status: "open", blurb: "Group show · landscape & memory of the interior", slots: 14, filled: 9, applicants: 23 },
  { title: "New Ground: Emerging Voices", dates: "6 Sep – 18 Oct 2025", status: "planning", blurb: "Solo & duo presentations · under-35 artists", slots: 8, filled: 2, applicants: 11 },
  { title: "Clay & Country", dates: "Currently hanging", status: "hanging", blurb: "Ceramics & sculpture from the Karoo", slots: 20, filled: 20, applicants: 31 },
  { title: "Summer Salon 2024", dates: "Closed · Dec 2024", status: "closed", blurb: "Annual mixed exhibition", slots: 30, filled: 30, applicants: 48 },
];

export const CATALOGUE: CatalogueWork[] = [
  { title: "Red Ground", artist: "Nomvula Zulu", price: "R 38 000", status: "available" },
  { title: "Three Vessels", artist: "Karel Botha", price: "R 12 400", status: "available" },
  { title: "Aloe Study II", artist: "Lerato Khumalo", price: "R 9 500", status: "sold" },
  { title: "Quiet Interior", artist: "Aisha Patel", price: "R 14 000", status: "available" },
  { title: "Drift", artist: "Sipho Dlamini", price: "R 22 000", status: "reserved" },
  { title: "Karoo Nightfall", artist: "Johan Pretorius", price: "R 16 800", status: "available" },
  { title: "Mother Tongue I", artist: "Sipho Dlamini", price: "R 18 500", status: "sold" },
  { title: "Coastline", artist: "Aisha Patel", price: "R 11 200", status: "on loan" },
  { title: "Standing Figure", artist: "Johan Pretorius", price: "R 9 800", status: "available" },
];

export const CONTACTS: Contact[] = [
  { name: "Nomvula Zulu", email: "nomvula@studio.co.za", role: "Artist", focus: "Abstract painting", last: "Today" },
  { name: "Karel Botha", email: "kbotha@mail.com", role: "Artist", focus: "Ceramics", last: "Yesterday" },
  { name: "Dr. Elize van Wyk", email: "evanwyk@collect.co.za", role: "Collector", focus: "Contemporary SA", last: "2 days ago" },
  { name: "Thandiwe Mokoena", email: "thandiwe.m@gmail.com", role: "Artist", focus: "Landscape", last: "2 days ago" },
  { name: "The Ackerman Trust", email: "art@ackermantrust.org", role: "Collector", focus: "Sculpture", last: "4 days ago" },
  { name: "Sipho Dlamini", email: "sipho.d@studio.co.za", role: "Artist", focus: "Mixed media", last: "5 days ago" },
  { name: "Marcus Reid", email: "m.reid@privatebank.com", role: "Collector", focus: "Investment-grade", last: "1 week ago" },
  { name: "Lerato Khumalo", email: "lerato@khumalo.art", role: "Artist", focus: "Painting", last: "1 week ago" },
];

export const FRAME_JOBS: FrameJob[] = [
  { title: "Red Ground", artist: "Nomvula Zulu", spec: "Float frame · oiled oak, 30mm", stage: "queued", due: "14 Jul" },
  { title: "Veld at First Light", artist: "Thandiwe Mokoena", spec: "Box frame · charcoal ash", stage: "building", due: "11 Jul" },
  { title: "Salt Pan, Evening", artist: "Lerato Khumalo", spec: "Conservation mount + glass", stage: "building", due: "12 Jul" },
  { title: "Quiet Interior", artist: "Aisha Patel", spec: "Float frame · natural maple", stage: "ready", due: "Done · 5 Jul" },
];
