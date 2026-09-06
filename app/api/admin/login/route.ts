import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "../../../../lib/supabase";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
} from "../../../../lib/admin-auth";

type LoginPayload = { email?: string; password?: string };

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string };
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginPayload;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const { url, key } = getSupabasePublicConfig();
  const tokenResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = (await tokenResponse.json()) as TokenResponse;
  const adminCheck = await fetch(
    `${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(token.user.id)}&select=user_id&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token.access_token}`,
      },
      cache: "no-store",
    }
  );

  const adminRows = adminCheck.ok
    ? ((await adminCheck.json()) as Array<{ user_id: string }>)
    : [];

  if (adminRows.length !== 1) {
    return NextResponse.json({ error: "This account is not authorized for Vault Admin." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ADMIN_ACCESS_COOKIE, token.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, token.expires_in - 30),
  });
  response.cookies.set(ADMIN_REFRESH_COOKIE, token.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
