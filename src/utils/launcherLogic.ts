import {
  AndroidApp,
  FilterCategory,
  InstallerSource,
  SmartStoreAction,
  SortOption,
} from '../types/app';
import { REFERENCE_NOW } from '../data/appsData';

const T9_MAP: Record<string, string> = {
  a: '2', b: '2', c: '2',
  d: '3', e: '3', f: '3',
  g: '4', h: '4', i: '4',
  j: '5', k: '5', l: '5',
  m: '6', n: '6', o: '6',
  p: '7', q: '7', r: '7', s: '7',
  t: '8', u: '8', v: '8',
  w: '9', x: '9', y: '9', z: '9',
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
};

/**
 * Converts a string into its T9 numeric representation (strip non-alphanumeric).
 */
export function textToT9(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => T9_MAP[ch] || '')
    .join('');
}

/**
 * Extracts initials from an app name (e.g., "Google Play Services" -> "gps", "WhatsApp" -> "wa").
 */
export function getAppInitials(name: string): string {
  const words = name.trim().split(/[\s\-_]+/);
  if (words.length > 1) {
    return words.map((w) => w[0]?.toLowerCase() || '').join('');
  }
  // Also extract camelCase capitals (e.g. "WhatsApp" -> "wa", "LocalSend" -> "ls")
  const camelCaps = name.replace(/[^A-Z]/g, '').toLowerCase();
  if (camelCaps.length >= 2) {
    return camelCaps;
  }
  return name.slice(0, 2).toLowerCase();
}

/**
 * Computes total storage footprint of an app in MB (APK + Data + Cache).
 */
export function getTotalAppSizeMb(app: AndroidApp): number {
  return Number((app.apkSizeMb + app.dataSizeMb + app.cacheSizeMb).toFixed(1));
}

/**
 * Checks if an app has been unused for 30+ days relative to reference timestamp.
 */
export function isAppUnused30Days(app: AndroidApp, nowMs: number = REFERENCE_NOW): boolean {
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (app.lastOpenedAt === null) return true;
  return nowMs - app.lastOpenedAt >= thirtyDaysMs;
}

/**
 * Multi-dimensional Omni-Search matcher:
 * Matches App Name, Initials ("wa" -> WhatsApp), Package Name ("com.whatsapp"),
 * Category, Permissions, or T9 digit sequence ("94287" -> WhatsApp).
 */
export function matchesOmniSearch(app: AndroidApp, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const nameLower = app.name.toLowerCase();
  const pkgLower = app.packageName.toLowerCase();
  const catLower = app.category.toLowerCase();
  const initials = getAppInitials(app.name);

  if (
    nameLower.includes(q) ||
    pkgLower.includes(q) ||
    catLower.includes(q) ||
    initials.startsWith(q)
  ) {
    return true;
  }

  // Subsequence fuzzy match on app name for short queries (e.g., "tkx" -> Termux)
  if (q.length >= 2 && q.length <= 5 && /^[a-z]+$/.test(q)) {
    let qIdx = 0;
    for (let i = 0; i < nameLower.length && qIdx < q.length; i++) {
      if (nameLower[i] === q[qIdx]) qIdx++;
    }
    if (qIdx === q.length && nameLower.startsWith(q[0])) {
      return true;
    }
  }

  // Permission search (e.g., "camera", "microphone", "biometric")
  if (app.permissions.some((p) => p.toLowerCase().includes(q))) {
    return true;
  }

  // T9 numeric matching if query is purely digits
  if (/^\d+$/.test(q)) {
    const nameT9 = textToT9(app.name);
    const initialsT9 = textToT9(initials);
    if (nameT9.includes(q) || initialsT9.startsWith(q)) {
      return true;
    }
  }

  return false;
}

/**
 * Filters apps by active category pill and system/vault visibility settings.
 */
export function filterApps(
  apps: AndroidApp[],
  category: FilterCategory,
  searchQuery: string,
  showSystemAppsInAll: boolean,
  nowMs: number = REFERENCE_NOW
): AndroidApp[] {
  return apps.filter((app) => {
    // Vault apps are strictly hidden unless the user is viewing the unlocked VAULT tab
    if (category === 'VAULT') {
      if (!app.isHiddenInVault) return false;
    } else {
      if (app.isHiddenInVault) return false;
    }

    // Category filter check
    switch (category) {
      case 'FAVORITES':
        if (!app.isFavorite) return false;
        break;
      case 'RECENT':
        if (!app.lastOpenedAt || nowMs - app.lastOpenedAt > 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
        break;
      case 'USER':
        if (app.isSystem) return false;
        break;
      case 'SYSTEM':
        if (!app.isSystem) return false;
        break;
      case 'PLAY_STORE':
        if (app.installer !== 'PLAY_STORE') return false;
        break;
      case 'SIDELOADED':
        if (app.installer !== 'SIDELOADED' && app.installer !== 'FDROID') return false;
        break;
      case 'UNUSED_30D':
        if (!isAppUnused30Days(app, nowMs)) return false;
        break;
      case 'ALL':
        // If user hasn't typed a search query, respect showSystemAppsInAll toggle
        if (!showSystemAppsInAll && app.isSystem && !searchQuery.trim()) {
          return false;
        }
        break;
      case 'VAULT':
        break;
    }

    return matchesOmniSearch(app, searchQuery);
  });
}

/**
 * Sorts apps according to the selected multi-dimensional SortOption.
 */
export function sortApps(apps: AndroidApp[], sortBy: SortOption): AndroidApp[] {
  const copy = [...apps];
  switch (sortBy) {
    case 'NAME_ASC':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'NAME_DESC':
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case 'MOST_USED':
      return copy.sort((a, b) => b.launchCount - a.launchCount || a.name.localeCompare(b.name));
    case 'RECENTLY_OPENED':
      return copy.sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0));
    case 'RECENTLY_INSTALLED':
      return copy.sort((a, b) => b.installedAt - a.installedAt);
    case 'RECENTLY_UPDATED':
      return copy.sort((a, b) => b.updatedAt - a.updatedAt);
    case 'SIZE_DESC':
      return copy.sort((a, b) => getTotalAppSizeMb(b) - getTotalAppSizeMb(a));
    case 'SDK_ASC':
      return copy.sort((a, b) => a.targetSdk - b.targetSdk || a.name.localeCompare(b.name));
    default:
      return copy;
  }
}

/**
 * Context-aware Smart Store Action resolver:
 * Prevents dead Play Store links on sideloaded, F-Droid, or system packages.
 */
export function getSmartStoreAction(app: AndroidApp): SmartStoreAction {
  if (app.installer === 'PLAY_STORE') {
    return {
      type: 'PLAY_STORE',
      primaryLabel: 'Open in Google Play Store',
      secondaryLabel: `market://details?id=${app.packageName}`,
      url: `https://play.google.com/store/apps/details?id=${encodeURIComponent(app.packageName)}`,
      marketUri: `market://details?id=${app.packageName}`,
      installerLabel: 'Google Play Store',
    };
  }

  const installerNames: Record<InstallerSource, string> = {
    PLAY_STORE: 'Google Play Store',
    FDROID: 'F-Droid FOSS Repo',
    SIDELOADED: 'Direct APK Sideload',
    SYSTEM: 'Android System Image',
  };

  return {
    type: 'APK_OR_WEB_LOOKUP',
    primaryLabel: 'Search Package Online / Export APK',
    secondaryLabel: `${installerNames[app.installer]} · ${app.packageName}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(app.packageName + ' android apk')}`,
    marketUri: null,
    installerLabel: installerNames[app.installer],
  };
}

export interface RadarAnalytics {
  totalApps: number;
  userAppsCount: number;
  systemAppsCount: number;
  totalStorageMb: number;
  totalCacheMb: number;
  storageHogs: AndroidApp[];
  unusedApps: AndroidApp[];
  outdatedSdkApps: AndroidApp[];
  installerCounts: Record<InstallerSource, number>;
}

/**
 * Computes App Intelligence & Bloatware Radar metrics.
 */
export function computeRadarMetrics(
  apps: AndroidApp[],
  nowMs: number = REFERENCE_NOW
): RadarAnalytics {
  const visibleApps = apps.filter((a) => !a.isHiddenInVault);
  let totalStorageMb = 0;
  let totalCacheMb = 0;

  const installerCounts: Record<InstallerSource, number> = {
    PLAY_STORE: 0,
    SIDELOADED: 0,
    FDROID: 0,
    SYSTEM: 0,
  };

  for (const app of visibleApps) {
    totalStorageMb += getTotalAppSizeMb(app);
    totalCacheMb += app.cacheSizeMb;
    installerCounts[app.installer] = (installerCounts[app.installer] || 0) + 1;
  }

  const storageHogs = [...visibleApps]
    .sort((a, b) => getTotalAppSizeMb(b) - getTotalAppSizeMb(a))
    .slice(0, 8);

  const unusedApps = visibleApps
    .filter((a) => isAppUnused30Days(a, nowMs))
    .sort((a, b) => getTotalAppSizeMb(b) - getTotalAppSizeMb(a));

  const outdatedSdkApps = visibleApps
    .filter((a) => a.targetSdk <= 33)
    .sort((a, b) => a.targetSdk - b.targetSdk);

  return {
    totalApps: visibleApps.length,
    userAppsCount: visibleApps.filter((a) => !a.isSystem).length,
    systemAppsCount: visibleApps.filter((a) => a.isSystem).length,
    totalStorageMb: Number(totalStorageMb.toFixed(1)),
    totalCacheMb: Number(totalCacheMb.toFixed(1)),
    storageHogs,
    unusedApps,
    outdatedSdkApps,
    installerCounts,
  };
}

/**
 * Formats relative time string from epoch timestamp (e.g., "4m ago", "2h ago", "14d ago").
 */
export function formatRelativeTime(timestampMs: number | null, nowMs: number = REFERENCE_NOW): string {
  if (timestampMs === null) return 'Never opened';
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

/**
 * Formats storage size cleanly in MB or GB.
 */
export function formatStorageSize(sizeMb: number): string {
  if (sizeMb >= 1024) {
    return `${(sizeMb / 1024).toFixed(2)} GB`;
  }
  return `${sizeMb.toFixed(1)} MB`;
}

/**
 * Formats a batch list of selected apps into Markdown or shareable Play Store links.
 */
export function formatBatchShareLinks(apps: AndroidApp[]): string {
  return apps
    .map((app) => {
      const action = getSmartStoreAction(app);
      return `• ${app.name} (${app.packageName}) — v${app.versionName}\n  ${action.url}`;
    })
    .join('\n\n');
}

export function formatBatchMarkdownTable(apps: AndroidApp[]): string {
  const header =
    '| App Name | Package ID | Version | Source | Size | Target SDK |\n| :--- | :--- | :--- | :--- | ---: | :---: |';
  const rows = apps.map(
    (a) =>
      `| ${a.name} | \`${a.packageName}\` | ${a.versionName} | ${a.installer} | ${formatStorageSize(
        getTotalAppSizeMb(a)
      )} | API ${a.targetSdk} |`
  );
  return [header, ...rows].join('\n');
}
