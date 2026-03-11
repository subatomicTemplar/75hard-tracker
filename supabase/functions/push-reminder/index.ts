import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidEmail = Deno.env.get("VAPID_EMAIL") || "mailto:admin@75hard.app";

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

interface DailyEntry {
  user_id: string;
  weight_lbs: number | null;
  water_oz: number;
  workout1_type: string | null;
  workout1_outdoor: boolean;
  workout2_type: string | null;
  workout2_outdoor: boolean;
  pages_read: number;
  diet_followed: boolean;
  photo_url: string | null;
}

function isEntryFullyComplete(e: DailyEntry): boolean {
  const hasWeight = e.weight_lbs !== null && e.weight_lbs > 0;
  const hasPhoto = !!e.photo_url;
  const waterOk = e.water_oz >= 128;
  const w1Ok = !!e.workout1_type;
  const w2Ok = !!e.workout2_type;
  const outdoorOk = e.workout1_outdoor || e.workout2_outdoor;
  const pagesOk = e.pages_read >= 10;
  const dietOk = e.diet_followed;
  return hasWeight && hasPhoto && waterOk && w1Ok && w2Ok && outdoorOk && pagesOk && dietOk;
}

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split("T")[0];

    // Get the current season
    const { data: season } = await supabase
      .from("seasons")
      .select("id, start_date, end_date")
      .eq("is_current", true)
      .single();

    if (!season) {
      return new Response(JSON.stringify({ message: "No current season" }), {
        status: 200,
      });
    }

    // Check if today is within the season
    if (today < season.start_date || today > season.end_date) {
      return new Response(
        JSON.stringify({ message: "Today is outside the current season" }),
        { status: 200 }
      );
    }

    // Get all entries for today in this season
    const { data: entries } = await supabase
      .from("daily_entries")
      .select(
        "user_id, weight_lbs, water_oz, workout1_type, workout1_outdoor, workout2_type, workout2_outdoor, pages_read, diet_followed, photo_url"
      )
      .eq("season_id", season.id)
      .eq("entry_date", today);

    // Get all push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions" }),
        { status: 200 }
      );
    }

    const entryMap = new Map(
      (entries ?? []).map((e: DailyEntry) => [e.user_id, e])
    );

    // Figure out what each user is missing
    function getMissing(entry: DailyEntry | undefined): string[] {
      if (!entry) return ["everything"];
      const missing: string[] = [];
      if (entry.weight_lbs === null || entry.weight_lbs <= 0)
        missing.push("weight");
      if (!entry.photo_url) missing.push("photo");
      if (entry.water_oz < 128) missing.push("water");
      if (!entry.workout1_type) missing.push("workout 1");
      if (!entry.workout2_type) missing.push("workout 2");
      if (!entry.workout1_outdoor && !entry.workout2_outdoor)
        missing.push("outdoor workout");
      if (entry.pages_read < 10) missing.push("reading");
      if (!entry.diet_followed) missing.push("diet");
      return missing;
    }

    let sent = 0;
    let skipped = 0;

    for (const sub of subscriptions) {
      const entry = entryMap.get(sub.user_id) as DailyEntry | undefined;

      // Skip users who already completed everything
      if (entry && isEntryFullyComplete(entry)) {
        skipped++;
        continue;
      }

      const missing = getMissing(entry);
      const body =
        missing[0] === "everything"
          ? "You haven't logged anything today. Get after it!"
          : `Still need: ${missing.join(", ")}. Lock in!`;

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: "75 HARD",
            body,
          })
        );
        sent++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        console.error(
          `Failed to send to ${sub.user_id}:`,
          error
        );
        // If subscription is expired/invalid (410 Gone), clean it up
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${sent}, skipped ${skipped} complete` }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Push reminder error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
