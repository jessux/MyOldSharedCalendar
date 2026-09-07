import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "fr.kahlouche.myoldsharedcalendar",
  appName: "MyOldSharedCalendar",
  webDir: "out",
  server: {
    androidScheme: "https",
    allowNavigation: ["*.supabase.co"]
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
