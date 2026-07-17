export async function requireCompraAgilGerencia(
  req: Request,
  supabaseUrl: string,
  anonKey: string,
) {
  const token = (req.headers.get("Authorization") || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) {
    return { ok: false as const, status: 401, errorCode: "missing_authorization" };
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!userResponse.ok) {
    return { ok: false as const, status: 401, errorCode: "invalid_authorization" };
  }

  const user = await userResponse.json();
  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,is_active&limit=1`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  const profile = profiles?.[0];
  return profile?.role === "gerencia" && profile?.is_active !== false
    ? { ok: true as const, userId: user.id }
    : { ok: false as const, status: 403, errorCode: "insufficient_permissions" };
}
