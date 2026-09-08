import type { CalendarEvent } from "@/types/database";

/**
 * Rappels d'evenements via des notifications systeme Android
 * (@capacitor/local-notifications), sur le meme principe que Banquier :
 * pas de backend/push, tout est planifie localement depuis les evenements
 * deja charges par l'app.
 *
 * Trois types de rappel, tous rejoues a chaque `scheduleEventReminders` :
 * - 30 min avant chaque evenement.
 * - La veille au soir ("VEILLE_HOUR"), ton un peu taquin.
 * - Un recap hebdomadaire le dimanche soir, calcule a partir des evenements
 *   deja charges par l'app pour les 7 jours a venir. Comme il n'est pas
 *   recalcule pendant que l'app est fermee, un evenement ajoute dans la
 *   semaine apres la derniere ouverture de l'app n'y apparaitra que si
 *   l'app est rouverte avant le dimanche.
 */

const CHANNEL_EVENTS = "myoldsharedcalendar-events";
// Pas d'icone monochrome dediee (contrairement a Banquier) : android/ est
// regenere a chaque build CI via `npx cap add android`, un drawable commite
// n'y survivrait pas. On laisse @capacitor/local-notifications utiliser
// l'icone par defaut du plugin.
const REMINDER_MINUTES_BEFORE = 30;
const VEILLE_HOUR = 20;
const RECAP_WEEKDAY = 0; // dimanche
const RECAP_HOUR = 18;
const ENABLED_KEY = "myoldsharedcalendar-reminders-enabled";

export interface RemindersStatus {
  supported: boolean;
  granted: boolean;
  enabled: boolean;
}

/** Contenu attache a chaque notification, lu au clic pour ouvrir le bon jour. */
interface ReminderExtra {
  date: string; // ISO, jour a ouvrir dans l'app
}

async function isNative(): Promise<boolean> {
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

let channelReady = false;

async function ensureChannel(): Promise<void> {
  if (channelReady) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.createChannel({
      id: CHANNEL_EVENTS,
      name: "Rappels d'evenements",
      description: "Notification avant le debut d'un evenement du calendrier",
      importance: 4,
      visibility: 1
    });
    channelReady = true;
  } catch (err) {
    console.warn("[reminders] creation du canal impossible", err);
  }
}

async function permissionGranted(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted";
  } catch {
    return false;
  }
}

async function getEnabledPref(): Promise<boolean> {
  const { Preferences } = await import("@capacitor/preferences");
  const { value } = await Preferences.get({ key: ENABLED_KEY });
  // Active par defaut : demander la permission suffit a activer les rappels.
  return value !== "false";
}

async function setEnabledPref(enabled: boolean): Promise<void> {
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.set({ key: ENABLED_KEY, value: String(enabled) });
}

export async function status(): Promise<RemindersStatus> {
  const supported = await isNative();
  if (!supported) return { supported: false, granted: false, enabled: false };
  return {
    supported,
    granted: await permissionGranted(),
    enabled: await getEnabledPref()
  };
}

export async function request(): Promise<RemindersStatus> {
  if (!(await isNative())) return status();
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.requestPermissions();
    await ensureChannel();
  } catch (err) {
    console.warn("[reminders] permission refusee ou indisponible", err);
  }
  if (await permissionGranted()) await setEnabledPref(true);
  return status();
}

export async function setEnabled(enabled: boolean): Promise<RemindersStatus> {
  await setEnabledPref(enabled);
  if (enabled && !(await permissionGranted())) return request();
  if (!enabled) await cancelAll();
  return status();
}

/** ID Android stable derive d'une chaine (le champ `id` des notifications
 *  planifiees doit etre un entier 32 bits). Un prefixe different par type de
 *  rappel evite qu'un rappel "30 min" et un rappel "veille" du meme
 *  evenement se marchent dessus. */
function notificationId(kind: string, key: string): number {
  let hash = 0;
  const input = `${kind}:${key}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

const RECAP_ID = notificationId("recap", "weekly");

/** getPending() ne renvoie pas le channelId : on retrouve nos propres
 *  notifications planifiees via leurs IDs, memorises a part. */
const SCHEDULED_IDS_KEY = "myoldsharedcalendar-reminders-scheduled-ids";

async function cancelAll(): Promise<void> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: SCHEDULED_IDS_KEY });
    const ids: number[] = value ? JSON.parse(value) : [];
    if (ids.length > 0) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    }
    await Preferences.remove({ key: SCHEDULED_IDS_KEY });
  } catch (err) {
    console.warn("[reminders] annulation impossible", err);
  }
}

/** Prochaine occurrence d'un jour/heure donnes (inclut aujourd'hui si l'heure
 *  n'est pas encore passee). */
function nextOccurrence(weekday: number, hour: number, from: Date): Date {
  const result = new Date(from);
  result.setHours(hour, 0, 0, 0);
  let diff = (weekday - result.getDay() + 7) % 7;
  if (diff === 0 && result.getTime() <= from.getTime()) diff = 7;
  result.setDate(result.getDate() + diff);
  return result;
}

const RECAP_INTROS = [
  "Accroche-toi",
  "Spoiler alert",
  "Roulement de tambour",
  "Attention les yeux",
  "Prepare le cafe"
];

function pickRecapIntro(): string {
  const weekOfYear = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return RECAP_INTROS[weekOfYear % RECAP_INTROS.length];
}

/**
 * Reprogramme les rappels pour la liste d'evenements donnee : annule les
 * rappels precedents puis planifie, pour chaque evenement futur non "toute
 * la journee", une notification `REMINDER_MINUTES_BEFORE` minutes avant et
 * une la veille a `VEILLE_HOUR`h ; plus un recap hebdomadaire le dimanche.
 * A appeler a chaque fois que les evenements affiches changent.
 */
export async function scheduleEventReminders(events: CalendarEvent[]): Promise<void> {
  if (!(await isNative())) return;
  const s = await status();
  if (!s.enabled || !s.granted) return;
  await ensureChannel();

  await cancelAll();

  const now = new Date();
  const timedEvents = events.filter((e) => !e.all_day);

  type ScheduledNotification = {
    id: number;
    channelId: string;
    title: string;
    body: string;
    schedule: { at: Date; allowWhileIdle?: boolean };
    extra: ReminderExtra;
    autoCancel: true;
  };

  const notifications: ScheduledNotification[] = [];

  for (const event of timedEvents) {
    const startsAt = new Date(event.starts_at);
    const extra: ReminderExtra = { date: event.starts_at };

    const reminderAt = new Date(startsAt.getTime() - REMINDER_MINUTES_BEFORE * 60_000);
    if (reminderAt.getTime() > now.getTime()) {
      notifications.push({
        id: notificationId("reminder", event.id),
        channelId: CHANNEL_EVENTS,
        title: event.title,
        body: `Debute dans ${REMINDER_MINUTES_BEFORE} minutes`,
        schedule: { at: reminderAt },
        extra,
        autoCancel: true
      });
    }

    const veilleAt = new Date(startsAt);
    veilleAt.setDate(veilleAt.getDate() - 1);
    veilleAt.setHours(VEILLE_HOUR, 0, 0, 0);
    if (veilleAt.getTime() > now.getTime() && veilleAt.getTime() < startsAt.getTime()) {
      notifications.push({
        id: notificationId("veille", event.id),
        channelId: CHANNEL_EVENTS,
        title: `Demain : ${event.title}`,
        body: "Mets ton reveil, on ne voudrait pas te louper a ca !",
        schedule: { at: veilleAt },
        extra,
        autoCancel: true
      });
    }
  }

  // Recap hebdo : les evenements des 7 prochains jours parmi ceux deja charges.
  const recapAt = nextOccurrence(RECAP_WEEKDAY, RECAP_HOUR, now);
  const weekAhead = timedEvents.filter((e) => {
    const startsAt = new Date(e.starts_at).getTime();
    return startsAt > now.getTime() && startsAt <= recapAt.getTime() + 7 * 24 * 60 * 60 * 1000;
  });
  if (weekAhead.length > 0) {
    const plural = weekAhead.length > 1 ? "s" : "";
    notifications.push({
      id: RECAP_ID,
      channelId: CHANNEL_EVENTS,
      title: `${pickRecapIntro()} : ${weekAhead.length} evenement${plural} cette semaine`,
      body: weekAhead
        .slice(0, 3)
        .map((e) => e.title)
        .join(" · ") + (weekAhead.length > 3 ? ` +${weekAhead.length - 3} autre(s)` : ""),
      schedule: { at: recapAt, allowWhileIdle: true },
      extra: { date: recapAt.toISOString() },
      autoCancel: true
    });
  }

  if (notifications.length === 0) return;

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({ notifications });
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({
      key: SCHEDULED_IDS_KEY,
      value: JSON.stringify(notifications.map((n) => n.id))
    });
  } catch (err) {
    console.warn("[reminders] planification impossible", err);
  }
}

/**
 * Ecoute le clic sur une notification et ouvre le jour de l'evenement
 * concerne (`onOpenDate` recoit la date ISO stockee dans `extra`). A
 * appeler une seule fois au montage de l'app.
 */
export async function onReminderTapped(onOpenDate: (isoDate: string) => void): Promise<() => void> {
  if (!(await isNative())) return () => {};
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const handle = await LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
    const extra = action.notification.extra as ReminderExtra | undefined;
    if (extra?.date) onOpenDate(extra.date);
  });
  return () => {
    handle.remove();
  };
}

export async function test(): Promise<void> {
  if (!(await isNative())) return;
  await ensureChannel();
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999999,
          channelId: CHANNEL_EVENTS,
          title: "Rappels actives",
          body: "30 min avant, la veille au soir, et un recap chaque dimanche."
        }
      ]
    });
  } catch (err) {
    console.warn("[reminders] envoi du test impossible", err);
  }
}
