export type InstallerSource = 'PLAY_STORE' | 'SIDELOADED' | 'FDROID' | 'SYSTEM';

export type AppCategory =
  | 'Social & Messaging'
  | 'Media & Music'
  | 'Developer & Root'
  | 'Productivity'
  | 'Browsers & Net'
  | 'Photography'
  | 'Finance & Maps'
  | 'System Core';

export interface ExportedActivity {
  name: string;
  className: string;
  label: string;
  requiresRoot?: boolean;
}

export interface AndroidApp {
  id: string;
  name: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  category: AppCategory;
  installer: InstallerSource;
  isSystem: boolean;
  isFavorite: boolean;
  isHiddenInVault: boolean;
  isStopped?: boolean;
  // Storage metrics in MB
  apkSizeMb: number;
  dataSizeMb: number;
  cacheSizeMb: number;
  // SDK & technical metadata
  targetSdk: number;
  minSdk: number;
  // Timestamps (epoch ms)
  installedAt: number;
  updatedAt: number;
  lastOpenedAt: number | null; // null if never opened
  launchCount: number;
  batteryMahToday: number;
  // Visual styling
  iconBg: string;
  iconColor: string;
  iconGlyph: string;
  // Deep inspection
  permissions: string[];
  exportedActivities: ExportedActivity[];
  storeRating?: number;
  storeDownloads?: string;
  developer: string;
}

export type FilterCategory =
  | 'ALL'
  | 'FAVORITES'
  | 'RECENT'
  | 'USER'
  | 'SYSTEM'
  | 'PLAY_STORE'
  | 'SIDELOADED'
  | 'UNUSED_30D'
  | 'VAULT';

export type SortOption =
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'MOST_USED'
  | 'RECENTLY_OPENED'
  | 'RECENTLY_INSTALLED'
  | 'RECENTLY_UPDATED'
  | 'SIZE_DESC'
  | 'SDK_ASC';

export type ViewMode = 'GRID' | 'LIST';
export type GridColumns = 4 | 5 | 6;
export type IconShape = 'squircle' | 'circle' | 'rounded-square';
export type ThemeMode = 'amoled' | 'slate' | 'light';
export type ActiveTab = 'DRAWER' | 'RADAR' | 'BATCH' | 'SETTINGS';

export interface LauncherSettings {
  viewMode: ViewMode;
  gridColumns: GridColumns;
  iconShape: IconShape;
  theme: ThemeMode;
  showSystemAppsInAll: boolean;
  autoLaunchUniqueMatch: boolean;
  showT9Keypad: boolean;
  showInstallerBadges: boolean;
  showPackageNamesInList: boolean;
  vaultPin: string;
}

export interface SmartStoreAction {
  type: 'PLAY_STORE' | 'APK_OR_WEB_LOOKUP';
  primaryLabel: string;
  secondaryLabel: string;
  url: string;
  marketUri: string | null;
  installerLabel: string;
}
