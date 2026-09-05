import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "../../../../lib/supabase";

type ResetPayload = { accessToken?: string; password?: string };

export async function POST(request: Request) {
  const body = (await request.json()) as ResetPayload;
  const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!accessToken || password.length < 8) {
    return NextResponse.json({ error: "A valid recovery link and password are required." }, { status: 400 });
  }

  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Recovery link expired or password update failed." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
