# MyOldSharedCalendar

Calendrier familial partagé, pensé pour une **vue mensuelle mobile** comme un
calendrier papier classique : la grille du mois entier, toujours visible,
avec un événement par personne codé par couleur.

## Fonctionnalités du MVP

- Connexion par lien magique (e-mail, sans mot de passe)
- Création ou rejoint d'un foyer via un code d'invitation
- Vue mensuelle plein écran, navigation par mois (précédent/suivant/aujourd'hui)
- Couleur par membre du foyer
- Création, édition, suppression d'événements (journée entière ou horaires)
- Catégories : famille, école, travail, santé, loisirs, autre
- Filtre d'affichage par membre
- Synchronisation temps réel entre les appareils (Supabase Realtime)
- Feuille de détail du jour avec liste des événements

## Stack technique

- **Frontend** : Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Realtime), avec Row Level Security
- **Mobile** : PWA installable + build Android natif (APK) via Capacitor

## Démarrage rapide (web / PWA)

1. Créer un projet [Supabase](https://supabase.com) et exécuter le script
   `supabase/schema.sql` dans l'éditeur SQL.
2. Copier `.env.example` en `.env.local` et renseigner :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Installer les dépendances puis lancer le serveur de développement :

   ```bash
   npm install
   npm run dev
   ```

4. Ouvrir `http://localhost:3000`. Sur un smartphone, utiliser "Ajouter à
   l'écran d'accueil" pour installer la PWA.

## Générer l'APK Android (via Capacitor)

Le projet est déjà configuré avec `capacitor.config.ts`. Étapes pour générer
un APK installable sur un téléphone Android :

1. Build de l'app en mode export statique + synchronisation Capacitor :

   ```bash
   npm run mobile:sync
   ```

2. Ajouter la plateforme Android (première fois seulement) :

   ```bash
   npx cap add android
   ```

3. Ouvrir le projet dans Android Studio :

   ```bash
   npm run mobile:android
   ```

4. Dans Android Studio : `Build` → `Generate App Bundles or APKs` →
   `Generate APKs`. Le fichier `.apk` signé (debug ou release selon le
   keystore utilisé) sera généré dans `android/app/build/outputs/apk/`.

5. Transférer l'APK sur le téléphone (câble, lien de téléchargement privé,
   ou distribution interne Google Play) puis l'installer.

Pour une distribution via le Google Play Store, il faudra en plus créer un
keystore de signature release et suivre le processus de publication
standard (fiche store, captures d'écran, politique de confidentialité).

## Modèle de données

Voir `supabase/schema.sql` pour le détail complet des tables :
`profiles`, `households`, `household_members`, `calendars`, `events`, avec
les policies RLS qui limitent l'accès aux membres de chaque foyer.

## Prochaines étapes suggérées

- Notifications push natives (via un plugin Capacitor) pour les rappels
- Import/export au format ICS
- Connexion optionnelle à Google Calendar / Outlook
- Widget d'écran d'accueil Android affichant le mois en cours
