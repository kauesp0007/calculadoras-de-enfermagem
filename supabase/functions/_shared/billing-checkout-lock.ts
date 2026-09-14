const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function rpc(name: string, args: Record<string, unknown>): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("supabase_service_role_not_configured");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`rpc_${name}_failed:${res.status}`);
  return data;
}

export async function claimCheckout(provider: "stripe" | "asaas", userId: string, leaseSeconds = 1800): Promise<boolean> {
  const value = await rpc("claim_billing_checkout", { p_provider: provider, p_user_id: userId, p_lease_seconds: leaseSeconds });
  return value === true || value === "true" || (Array.isArray(value) && value[0] === true);
}

export async function releaseCheckout(provider: "stripe" | "asaas", userId: string, errorMessage?: string): Promise<void> {
  try { await rpc("release_billing_checkout", { p_provider: provider, p_user_id: userId, p_error: errorMessage ?? null }); } catch (_) {}
}

export async function completeCheckout(provider: "stripe" | "asaas", userId: string): Promise<void> {
  try { await rpc("complete_billing_checkout", { p_provider: provider, p_user_id: userId }); } catch (_) {}
}
