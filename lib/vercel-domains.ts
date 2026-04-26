/**
 * Thin wrapper around the Vercel Domains REST API.
 * Used by the Microsite Settings → Domain panel to add / verify / remove
 * a custom domain mapped to this project.
 *
 * Required env vars:
 *   VERCEL_DOMAINS_TOKEN  — personal access token with Domains scope
 *   VERCEL_PROJECT_ID     — the project to attach domains to
 *   VERCEL_TEAM_ID        — optional; required if the project is owned
 *                           by a team rather than a personal account
 */

const BASE = "https://api.vercel.com"

function authHeaders(): Record<string, string> {
  const token = process.env.VERCEL_DOMAINS_TOKEN
  if (!token) throw new Error("VERCEL_DOMAINS_TOKEN is not set")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function teamQuery(): string {
  const team = process.env.VERCEL_TEAM_ID
  return team ? `?teamId=${encodeURIComponent(team)}` : ""
}

export async function addDomain(hostname: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  const project = process.env.VERCEL_PROJECT_ID
  if (!project) return { ok: false, status: 0, body: { error: "VERCEL_PROJECT_ID is not set" } }
  try {
    const res = await fetch(
      `${BASE}/v10/projects/${project}/domains${teamQuery()}`,
      { method: "POST", headers: authHeaders(), body: JSON.stringify({ name: hostname }) },
    )
    let body: unknown
    try { body = await res.json() } catch { body = null }
    return { ok: res.ok, status: res.status, body }
  } catch (err) {
    return { ok: false, status: 0, body: { error: (err as Error).message } }
  }
}

export async function getDomainStatus(
  hostname: string,
): Promise<{ ok: boolean; verified: boolean; status: number; body: unknown }> {
  const project = process.env.VERCEL_PROJECT_ID
  if (!project) return { ok: false, verified: false, status: 0, body: { error: "VERCEL_PROJECT_ID is not set" } }
  try {
    const res = await fetch(
      `${BASE}/v9/projects/${project}/domains/${encodeURIComponent(hostname)}${teamQuery()}`,
      { headers: authHeaders() },
    )
    const body = await res.json().catch(() => null)
    const verified =
      !!(body && typeof body === "object" && "verified" in body && (body as { verified: boolean }).verified)
    return { ok: res.ok, verified, status: res.status, body }
  } catch (err) {
    return { ok: false, verified: false, status: 0, body: { error: (err as Error).message } }
  }
}

export async function removeDomain(hostname: string): Promise<{ ok: boolean; status: number }> {
  const project = process.env.VERCEL_PROJECT_ID
  if (!project) return { ok: false, status: 0 }
  try {
    const res = await fetch(
      `${BASE}/v9/projects/${project}/domains/${encodeURIComponent(hostname)}${teamQuery()}`,
      { method: "DELETE", headers: authHeaders() },
    )
    return { ok: res.ok, status: res.status }
  } catch {
    return { ok: false, status: 0 }
  }
}
