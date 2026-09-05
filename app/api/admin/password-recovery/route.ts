import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "../../../../lib/supabase";

type RecoveryPayload = { email?: string };

export async function POST(request: Request) {
  const body = (await request.json()) as RecoveryPayload;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { url, key } = getSupabasePublicConfig();
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/admin/reset-password`;

  const response = await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: {
      apikey: key,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Supabase password recovery failed", {
      status: response.status,
      statusText: response.statusText,
    });

    return NextResponse.json({ error: "Unable to send recovery email right now." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: "If that account exists, a recovery email has been sent.",
  });
}
