const GITHUB_REPO = "jessux/myoldsharedcalendar";
const APK_FILENAME = "update.apk";

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verifie sur GitHub Releases si une nouvelle version APK est disponible,
 * telecharge l'APK, verifie son checksum SHA-256 (checksums.txt de la release)
 * puis lance l'installation via l'intent systeme Android.
 */
export async function checkForUpdate(currentVersion: string): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return;
  }

  const [{ Directory, Filesystem }, { FileOpener }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor-community/file-opener")
  ]);

  const releaseRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
  );
  if (!releaseRes.ok) return;
  const release: GithubRelease = await releaseRes.json();

  if (!isNewer(release.tag_name, currentVersion)) return;

  const apkAsset = release.assets.find((a) => a.name.endsWith(".apk"));
  const checksumsAsset = release.assets.find((a) => a.name === "checksums.txt");
  if (!apkAsset || !checksumsAsset) return;

  const checksumsRes = await fetch(checksumsAsset.browser_download_url);
  if (!checksumsRes.ok) return;
  const checksumsText = await checksumsRes.text();
  const expectedHash = checksumsText
    .split("\n")
    .find((line) => line.includes(apkAsset.name))
    ?.trim()
    .split(/\s+/)[0];
  if (!expectedHash) return;

  const apkRes = await fetch(apkAsset.browser_download_url);
  if (!apkRes.ok) return;
  const apkBuffer = await apkRes.arrayBuffer();

  const actualHash = await sha256Hex(apkBuffer);
  if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
    console.error("Mise a jour: checksum invalide, installation annulee.");
    return;
  }

  const base64 = arrayBufferToBase64(apkBuffer);

  const written = await Filesystem.writeFile({
    path: APK_FILENAME,
    data: base64,
    directory: Directory.Cache,
  });

  await FileOpener.open({
    filePath: written.uri,
    contentType: "application/vnd.android.package-archive",
  });
}
