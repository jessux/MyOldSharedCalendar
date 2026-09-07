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

## Publier une release Android via GitHub Actions

Le workflow `.github/workflows/build-apk.yml` produit une APK release signée,
avec un `versionCode` Android croissant, puis la publie dans une GitHub
Release. Il utilise les secrets de l'environnement GitHub `production` :

- `ANDROID_KEYSTORE_BASE64` : contenu du keystore encodé en base64
- `ANDROID_KEYSTORE_PASSWORD` : mot de passe du keystore
- `ANDROID_KEY_ALIAS` : alias de la clé de signature
- `ANDROID_KEY_PASSWORD` : mot de passe de la clé

Créer le keystore une seule fois, puis conserver le fichier et ses mots de
passe en lieu sûr :

```powershell
keytool -genkeypair -v `
   -keystore myoldsharedcalendar-release.jks `
   -alias myoldsharedcalendar `
   -keyalg RSA -keysize 2048 -validity 10000

[Convert]::ToBase64String(
   [IO.File]::ReadAllBytes(".\myoldsharedcalendar-release.jks")
)
```

Ajouter la valeur base64 et les trois mots de passe/identifiants dans
`Settings` → `Environments` → `production` → `Secrets and variables` →
`Actions`. Le keystore `.jks` ne doit jamais être commité.

La première installation release doit remplacer une APK release signée avec
ce même keystore. Une APK debug précédemment installée devra être désinstallée
une fois, car elle n'a pas la même signature.

## Modèle de données

Voir `supabase/schema.sql` pour le détail complet des tables :
`profiles`, `households`, `household_members`, `calendars`, `events`, avec
les policies RLS qui limitent l'accès aux membres de chaque foyer.

## Prochaines étapes suggérées

- Notifications push natives (via un plugin Capacitor) pour les rappels
- Import/export au format ICS
- Connexion optionnelle à Google Calendar / Outlook
- Widget d'écran d'accueil Android affichant le mois en cours
