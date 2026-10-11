import { NextResponse } from "next/server";
import { getEvents, createEvent, eventExists, type Event } from "@/data/events";
import { notifyEventCreated } from "@/lib/email/event-notice";
import { readContactEnv } from "@/lib/email/mail-mode";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  const events = await getEvents();
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newEvent: Event = await request.json();

    if (await eventExists(newEvent.slug)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    await createEvent(newEvent);

    // Même module que le contact : RESEND_FROM + CONTACT_EMAIL, sans adresse de repli.
    // Un échec d'e-mail ne bloque pas la création de l'événement.
    await notifyEventCreated({
      env: readContactEnv(),
      event: newEvent,
      origin: new URL(request.url).origin,
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Invalid data", details: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
