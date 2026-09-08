import type { CalendarEvent } from "@/types/database";

/**
 * Rappels d'evenements via des notifications systeme Android
 * (@capacitor/local-notifications), sur le meme principe que Banquier :
 * pas de backend/push, tout est planifie localement depuis les evenements
 * deja charges par l'app.
 */

const CHANNEL_EVENTS = "myoldsharedcalendar-events";
// Pas d'icone monochrome dediee (contrairement a Banquier) : android/ est
// regenere a chaque build CI via `npx cap add android`, un drawable commite
// n'y survivrait pas. On laisse @capacitor/local-notifications utiliser
// l'icone par defaut du plugin.
const REMINDER_MINUTES_BEFORE = 30;
const ENABLED_KEY = "myoldsharedcalendar-reminders-enabled";

export interface RemindersStatus {
  supported: boolean;
  granted: boolean;
  enabled: boolean;
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

/** ID Android stable derive de l'UUID de l'evenement (le champ `id` des
 *  notifications planifiees doit etre un entier 32 bits). */
function notificationId(eventId: string): number {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = (hash * 31 + eventId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

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

/**
 * Reprogramme les rappels pour la liste d'evenements donnee : annule les
 * rappels precedents puis planifie une notification `REMINDER_MINUTES_BEFORE`
 * minutes avant chaque evenement futur, non annule et non "toute la journee".
 * A appeler a chaque fois que les evenements affiches changent.
 */
export async function scheduleEventReminders(events: CalendarEvent[]): Promise<void> {
  if (!(await isNative())) return;
  const s = await status();
  if (!s.enabled || !s.granted) return;
  await ensureChannel();

  await cancelAll();

  const now = Date.now();
  const notifications = events
    .filter((event) => !event.all_day)
    .map((event) => {
      const remindAt = new Date(event.starts_at).getTime() - REMINDER_MINUTES_BEFORE * 60_000;
      return { event, remindAt };
    })
    .filter(({ remindAt }) => remindAt > now)
    .map(({ event, remindAt }) => ({
      id: notificationId(event.id),
      channelId: CHANNEL_EVENTS,
      title: event.title,
      body: `Debute dans ${REMINDER_MINUTES_BEFORE} minutes`,
      schedule: { at: new Date(remindAt) },
      autoCancel: true
    }));

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
          body: "Vous serez prevenu 30 min avant chaque evenement.",
        }
      ]
    });
  } catch (err) {
    console.warn("[reminders] envoi du test impossible", err);
  }
}
