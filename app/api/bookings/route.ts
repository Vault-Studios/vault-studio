import { supabaseRest } from "../../../lib/supabase";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BookingPayload = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  service?: string;
  date?: string;
  budget?: string;
  location?: string;
  brief?: string;
  website?: string;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as BookingPayload;
    if (clean(payload.website, 100)) {
      return Response.json({ reference: "VLT-RECEIVED" }, { status: 201 });
    }
    const booking = {
      id: crypto.randomUUID(),
      name: clean(payload.name, 120),
      company: clean(payload.company, 160),
      email: clean(payload.email, 200).toLowerCase(),
      phone: clean(payload.phone, 80),
      service: clean(payload.service, 80),
      preferredDate: clean(payload.date, 20),
      budget: clean(payload.budget, 80),
      location: clean(payload.location, 160),
      brief: clean(payload.brief, 3000),
    };

    if (!booking.name || !booking.service || !booking.brief) {
      return Response.json(
        { error: "Please complete your name, service and project brief." },
        { status: 400 }
      );
    }

    if (!emailPattern.test(booking.email)) {
      return Response.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabaseResponse = await supabaseRest("booking_submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        id: booking.id,
        name: booking.name,
        company: booking.company,
        email: booking.email,
        phone: booking.phone,
        service: booking.service,
        preferred_date: booking.preferredDate || null,
        budget: booking.budget,
        location: booking.location,
        brief: booking.brief,
        status: "new",
      }),
    });

    if (supabaseResponse.ok) {
      return Response.json({ reference: `VLT-${booking.id.slice(0, 8).toUpperCase()}` }, { status: 201 });
    }

    console.error("Supabase booking storage failed", {
      status: supabaseResponse.status,
      statusText: supabaseResponse.statusText,
    });
    return Response.json(
      { error: "We could not save your brief. Please try again shortly." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Booking request failed", error);
    return Response.json(
      { error: "We could not save your brief. Please try again shortly." },
      { status: 500 }
    );
  }
}
