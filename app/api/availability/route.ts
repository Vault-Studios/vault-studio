import { supabaseRest } from "../../../lib/supabase";

export async function GET() {
  try {
    const response = await supabaseRest("availability_status?id=eq.studio&select=status,message_en,message_sw,next_available_date&limit=1", { cache: "no-store" });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json() as unknown[];
    return Response.json(rows[0] ?? { status: "available" }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return Response.json({ status: "available", message_en: "Now booking new commissions.", message_sw: "Tunapokea kazi mpya." });
  }
}
