import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = Deno.env.get("APP_URL") ?? "";

webpush.setVapidDetails(
  "mailto:contact@myoldsharedcalendar.app",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000);

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, starts_at, household_id")
    .is("reminder_sent_at", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  if (error) return new Response(error.message, { status: 500 });

  for (const event of events ?? []) {
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", event.household_id);

    const userIds = (members ?? []).map((m) => m.user_id);
    if (userIds.length === 0) continue;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    const payload = JSON.stringify({
      title: "Rappel",
      body: `${event.title} commence bientot`,
      eventId: event.id,
      url: `${appUrl}/?event=${event.id}`
    });

    for (const sub of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    await supabase.from("events").update({ reminder_sent_at: now.toISOString() }).eq("id", event.id);
  }

  return new Response("ok");
});
