import { supabaseRest } from "../../../lib/supabase";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function GET() {
  try {
    const response = await supabaseRest("reviews_public?select=id,name,company,project,rating,review&order=approved_at.desc&limit=12", { cache: "no-store" });
    if (!response.ok) return Response.json([]);
    return Response.json(await response.json(), { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return Response.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    if (clean(payload.website, 100)) return Response.json({ ok: true }, { status: 201 });
    const review = {
      name: clean(payload.name, 120), company: clean(payload.company, 160),
      email: clean(payload.email, 200).toLowerCase(), project: clean(payload.project, 160),
      rating: Number(payload.rating), review: clean(payload.review, 1600), consent: payload.consent === true,
    };
    if (review.name.length < 2 || !emailPattern.test(review.email) || !review.project || review.review.length < 30 || review.rating < 1 || review.rating > 5 || !review.consent) {
      return Response.json({ error: "Please complete every required field." }, { status: 400 });
    }
    const response = await supabaseRest("review_submissions", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(review) });
    if (!response.ok) throw new Error(await response.text());
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Review submission failed", error);
    return Response.json({ error: "We could not save your review. Please try again." }, { status: 500 });
  }
}
