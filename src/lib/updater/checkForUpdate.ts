const GITHUB_REPO = "jessux/myoldsharedcalendar";

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  html_url: string;
  assets: GithubAsset[];
}

function parseVersion(tag: string): number[] {
  const match = tag.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [0, 0, 0];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isNewer(remote: string, local: string): boolean {
  const [rMajor, rMinor, rPatch] = parseVersion(remote);
  const [lMajor, lMinor, lPatch] = parseVersion(local);
  if (rMajor !== lMajor) return rMajor > lMajor;
  if (rMinor !== lMinor) return rMinor > lMinor;
  return rPatch > lPatch;
}

/**
 * Vérifie sur GitHub Releases si une nouvelle version APK est disponible et,
 * le cas échéant, ouvre le lien de téléchargement direct dans le navigateur
 * système (comme Banquier) plutôt que de télécharger/installer en interne :
 * ça évite la permission runtime "install unknown apps" et les échecs
 * silencieux du flux Filesystem + FileOpener.
 */
export async function checkForUpdate(currentVersion: string): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return;
  }

  const releaseRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
  );
  if (!releaseRes.ok) return;
  const release: GithubRelease = await releaseRes.json();

  if (!isNewer(release.tag_name, currentVersion)) return;

  const apkAsset = release.assets.find((a) => a.name.endsWith(".apk"));
  window.open(apkAsset?.browser_download_url ?? release.html_url, "_blank");
}
