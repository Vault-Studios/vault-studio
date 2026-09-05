import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "../../../../lib/supabase";
import { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE } from "../../../../lib/admin-auth";

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
};

function clearSession(response: NextResponse) {
  response.cookies.set(ADMIN_ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(ADMIN_REFRESH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE)?.value;
  if (!refreshToken) return clearSession(NextResponse.json({ error: "Session expired." }, { status: 401 }));

  const { url, key } = getSupabasePublicConfig();
  const refreshResponse = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });

  if (!refreshResponse.ok) {
    return clearSession(NextResponse.json({ error: "Session expired." }, { status: 401 }));
  }

  const token = (await refreshResponse.json()) as RefreshResponse;
  const adminCheck = await fetch(`${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(token.user.id)}&select=user_id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const admins = adminCheck.ok ? await adminCheck.json() as Array<{ user_id: string }> : [];
  if (admins.length !== 1) {
    return clearSession(NextResponse.json({ error: "Admin access revoked." }, { status: 403 }));
  }

  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ADMIN_ACCESS_COOKIE, token.access_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(60, token.expires_in - 30),
  });
  response.cookies.set(ADMIN_REFRESH_COOKIE, token.refresh_token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
