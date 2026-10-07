const VERCEL_API = "https://api.vercel.com";

export interface DnsRecordInstruction {
  type: "A" | "CNAME";
  name: string;
  value: string;
}

export interface DomainVerificationChallenge {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

export interface DomainStatus {
  verified: boolean;
  misconfigured: boolean;
  challenges: DomainVerificationChallenge[];
}

function env() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    throw new Error(
      "Custom domains aren't configured on this deployment: set VERCEL_TOKEN and VERCEL_PROJECT_ID."
    );
  }
  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID };
}

function withTeam(path: string, teamId?: string) {
  if (!teamId) return path;
  return path + (path.includes("?") ? "&" : "?") + `teamId=${encodeURIComponent(teamId)}`;
}

async function vercelFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.error?.message || `Vercel API error (${res.status})`;
    throw new Error(message);
  }
  return body;
}

/** DNS records a client needs to add at their registrar for `domain` to point at this project. */
export function dnsInstructionsFor(domain: string): DnsRecordInstruction[] {
  const isApex = domain.split(".").length === 2;
  return isApex
    ? [{ type: "A", name: "@", value: "76.76.21.21" }]
    : [{ type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" }];
}

/** Attaches `domain` to the Vercel project. Idempotent — Vercel returns the existing domain if already added. */
export async function addDomainToProject(domain: string): Promise<void> {
  const { token, projectId, teamId } = env();
  await vercelFetch(withTeam(`/v10/projects/${projectId}/domains`, teamId), token, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
}

export async function removeDomainFromProject(domain: string): Promise<void> {
  const { token, projectId, teamId } = env();
  await vercelFetch(withTeam(`/v9/projects/${projectId}/domains/${domain}`, teamId), token, {
    method: "DELETE",
  });
}

/** Current verification/DNS state for a domain already attached to the project. */
export async function getDomainStatus(domain: string): Promise<DomainStatus> {
  const { token, projectId, teamId } = env();
  const [domainInfo, config] = await Promise.all([
    vercelFetch(withTeam(`/v9/projects/${projectId}/domains/${domain}`, teamId), token),
    vercelFetch(withTeam(`/v6/domains/${domain}/config`, teamId), token),
  ]);

  return {
    verified: Boolean(domainInfo.verified),
    misconfigured: Boolean(config.misconfigured),
    challenges: (domainInfo.verification ?? []).map((v: { type: string; domain: string; value: string; reason: string }) => ({
      type: v.type,
      domain: v.domain,
      value: v.value,
      reason: v.reason,
    })),
  };
}
