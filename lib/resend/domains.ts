const RESEND_API = "https://api.resend.com";

export interface MailDnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
}

export interface MailDomain {
  id: string;
  status: "none" | "pending" | "verified" | "error";
  records: MailDnsRecord[];
}

interface ResendDomainResponse {
  id: string;
  status: string;
  records?: { type: string; name: string; value: string; priority?: number }[];
}

function apiKey() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email domains aren't configured on this deployment: set RESEND_API_KEY.");
  return key;
}

async function resendFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${RESEND_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || `Resend API error (${res.status})`);
  return body;
}

function toMailDomain(body: ResendDomainResponse): MailDomain {
  const status = body.status === "verified" ? "verified" : body.status === "failed" ? "error" : "pending";
  const records = (body.records ?? []).map(({ type, name, value, priority }) => ({ type, name, value, priority }));
  return { id: body.id, status, records };
}

/** Registers `domain` for sending. The returned records must be added at the gallery's DNS host. */
export async function createMailDomain(domain: string): Promise<MailDomain> {
  const body = await resendFetch("/domains", {
    method: "POST",
    body: JSON.stringify({ name: domain, capabilities: { sending: "enabled", receiving: "disabled" } }),
  });
  return toMailDomain(body);
}

/** Asks Resend to re-check DNS, then returns the current state and records. */
export async function refreshMailDomain(id: string): Promise<MailDomain> {
  await resendFetch(`/domains/${id}/verify`, { method: "POST" });
  return toMailDomain(await resendFetch(`/domains/${id}`));
}

export async function deleteMailDomain(id: string): Promise<void> {
  await resendFetch(`/domains/${id}`, { method: "DELETE" });
}
