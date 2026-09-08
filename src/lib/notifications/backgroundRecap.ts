import { createBrowserClient } from "@/lib/supabase/browserClient";

/**
 * Face « app » du rafraichissement du recap hebdo en tache de fond.
 *
 * Le travail lui-meme vit dans public/runners/background-recap.js, execute par
 * l'OS dans un moteur JS separe du webview (voir le commentaire en tete de ce
 * fichier pour les contraintes que ca impose). Ce module est le seul point de
 * contact entre les deux mondes : il pousse au runner ce dont il a besoin
 * (URL Supabase, cle anon, foyer, jeton d'acces) via l'evenement `configure`.
 * Le runner reveille periodiquement par l'OS relit la base et, si le recap du
 * dimanche approche, replanifie la meme notification (meme id) avec un
 * contenu a jour — sans que l'app soit ouverte.
 */

const RUNNER_LABEL = "fr.kahlouche.myoldsharedcalendar.background.recap";

async function isNative(): Promise<boolean> {
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

/** Le plugin n'existe ni sur le web ni pendant `next dev` : toute la
 *  fonctionnalite doit s'effacer proprement plutot que de lever. */
let supported: boolean | null = null;

async function dispatch(event: string, details: Record<string, unknown>): Promise<void> {
  if (supported === false) return;
  try {
    const { BackgroundRunner } = await import("@capacitor/background-runner");
    await BackgroundRunner.dispatchEvent({ label: RUNNER_LABEL, event, details });
    supported = true;
  } catch (err) {
    supported = false;
    console.warn("[background-recap] runner indisponible", err);
  }
}

/**
 * Pousse au runner de fond de quoi refaire la requete lui-meme : URL/cle
 * Supabase (publiques, deja dans le bundle) et jeton de session courant. A
 * appeler quand le foyer est connu et que les rappels sont actives — et de
 * nouveau a chaque rafraichissement de session (le jeton d'acces expire).
 */
export async function configure(householdId: string, enabled: boolean): Promise<void> {
  if (!(await isNative())) return;

  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return;

  await dispatch("configure", {
    enabled,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    householdId,
    accessToken: session.access_token,
    refreshToken: session.refresh_token
  });
}

export async function disable(): Promise<void> {
  if (!(await isNative())) return;
  await dispatch("configure", { enabled: false });
}
