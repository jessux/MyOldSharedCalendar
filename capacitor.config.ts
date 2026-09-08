import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "fr.kahlouche.myoldsharedcalendar",
  appName: "MyOldSharedCalendar",
  webDir: "out",
  server: {
    androidScheme: "https",
    allowNavigation: ["*.supabase.co", "accounts.google.com", "*.google.com"]
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    // Rafraichit le recap hebdomadaire (src/lib/notifications/eventReminders.ts)
    // avant qu'il ne se declenche, meme app fermee. Voir public/runners/background-recap.js
    // et src/lib/notifications/backgroundRecap.ts.
    BackgroundRunner: {
      label: "fr.kahlouche.myoldsharedcalendar.background.recap",
      src: "runners/background-recap.js",
      event: "refreshRecap",
      repeat: true,
      // 60 min : Android impose de toute facon un minimum de 15 min entre deux
      // executions ; l'intervalle reel reste a la main de l'OS (Doze...).
      interval: 60,
      autoStart: true
    }
  }
};

export default config;
