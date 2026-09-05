import {
  getSupabaseConfigDiagnostics,
  supabaseRest,
} from "../../../../lib/supabase";

export async function GET() {
  const diagnostics = getSupabaseConfigDiagnostics();

  if (!diagnostics.configured) {
    return Response.json(
      { ...diagnostics, reachable: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const response = await supabaseRest("projects?select=id&limit=1", {
      cache: "no-store",
    });

    return Response.json(
      {
        ...diagnostics,
        reachable: response.ok,
        upstreamStatus: response.status,
      },
      {
        status: response.ok ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch {
    return Response.json(
      { ...diagnostics, reachable: false },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
