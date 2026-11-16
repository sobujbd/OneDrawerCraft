import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  PackageCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { GridColumns, IconShape, LauncherSettings, ThemeMode } from '../types/app';

interface SettingsAndBlueprintScreenProps {
  settings: LauncherSettings;
  onUpdateSettings: (partial: Partial<LauncherSettings>) => void;
  onTriggerToast: (msg: string) => void;
  initialSubTab?: 'SETTINGS' | 'KOTLIN' | 'PLAY_STORE';
}

export const PLAY_STORE_ICON_URL =
  '/src/assets/images/onedrawer_play_store_icon_1794811051928.jpg';
export const PLAY_STORE_FEATURE_GRAPHIC_URL =
  '/src/assets/images/onedrawer_feature_graphic_1794811052032.jpg';

export const PLAY_STORE_METADATA = {
  appName: 'OneDrawer: Fast App Launcher', // 28 / 30 chars
  shortDescription:
    'One-handed app drawer, T9 search, system package manager & APK inspector.', // 73 / 80 chars
  longDescription: `Meet OneDrawer — the blazing-fast, one-handed Android App Launcher and deep Package Inspector that replaces two separate utilities on your phone.

Most app drawers are fast at launching apps but hide system packages, installer origins, and internal activities. Traditional package managers show deep metadata but are too slow for daily app launching. OneDrawer bridges both worlds in a zero-lag Material You & AMOLED interface.

WHY ONEDRAWER IS 1 STEP AHEAD:

1. Bottom-First One-Handed Ergonomics
Designed for modern 6.7"+ screens. Your Omni-Search bar, category filter chips, T9 numeric keypad, and A–Z fast-index scrubber sit comfortably within natural thumb reach.

2. Instant Multi-Mode Search (Initials, Package ID & T9)
• Type initials ("wa" for WhatsApp, "gps" for Google Play Services)
• Search raw package names ("com.whatsapp", "moe.shizuku")
• Search by granted permissions ("CAMERA", "WRITE_SECURE_SETTINGS")
• Toggle the compact T9 Dialpad for rapid one-thumb numeric dialing
• Optional "Auto-Launch on Unique Match" opens your app the instant 1 result remains

3. Installer Source Intelligence (Zero Broken Store Links)
Instantly see whether each app was installed from Google Play Store, F-Droid, Direct APK Sideload, or the Android System Image.
• Play Store apps show a verified "Open in Google Play Store" action
• Sideloaded & System apps automatically switch to "Search Package Online / Export APK" so you never hit a dead Play Store link

4. 8-Way Power Sorting & Smart Filters
• Sort by: Name (A–Z / Z–A), Most Used, Recently Opened, Recently Installed, Recently Updated, App Size (Largest First), or Target Android SDK (Oldest First)
• Filter by: All Apps, Favorites, Recent, User Installed, System Apps, Play Store, Sideloaded/F-Droid, Unused (30+ Days), and Biometric/PIN Hidden Vault

5. Zero-Jump Long-Press Quick Actions
• Launch exported sub-activities directly (bypass splash screens)
• Open native Android App Info (ACTION_APPLICATION_DETAILS_SETTINGS)
• Copy package ID, version code, or formatted App Spec Card in one tap
• Batch-select apps to share Play Store links or export JSON/Markdown inventories

6. App Intelligence & Bloatware Radar
Spot storage hogs, dormant apps unused for 30+ days, and legacy packages targeting older Android API levels.

100% Privacy-First: No ads, no analytics trackers, and zero internet permission required for core app indexing.`,
  permissionDeclaration: `Core Functionality Declaration (QUERY_ALL_PACKAGES):
OneDrawer is a dedicated Android App Launcher, App Drawer replacement, and On-Device Package Manager. Its primary user-facing purpose is to index, search, sort, launch, and inspect all user-installed and system packages on the device. Visibility into all installed packages via QUERY_ALL_PACKAGES is strictly required to display the complete app drawer and verify installer sources via PackageManager.getInstallSourceInfo(). Package data never leaves the user's device.`,
  buildCommands: `# 1. Bundle Web Assets & Wrap in Native Android (Capacitor)
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "OneDrawer" "app.onedrawer.launcher" --web-dir dist
npm run build
npx cap add android
npx cap sync android

# 2. Generate Upload Keystore (for Google Play App Signing)
keytool -genkey -v -keystore onedrawer-upload-key.jks \\
  -keyalg RSA -keysize 2048 -validity 10000 \\
  -alias onedrawer-upload

# 3. Build Debug APK & Production Play Store AAB
cd android
./gradlew assembleDebug   # Outputs: app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease   # Outputs: app/build/outputs/bundle/release/app-release.aab`,
};

const KOTLIN_BLUEPRINTS = [
  {
    id: 'manifest_xml',
    title: '1. AndroidManifest.xml (Launcher & Package Visibility)',
    description:
      'Declares HOME launcher category so Google Play recognizes OneDrawer as a compliant Launcher & Package Manager.',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="app.onedrawer.launcher">

    <!-- Required for listing all installed & system apps -->
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
    <!-- Optional: For 30-day unused & launch frequency sorting -->
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" />

    <application
        android:label="OneDrawer"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:stateNotNeeded="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.HOME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
  },
  {
    id: 'pkg_query',
    title: '2. Fast Package Indexing & Installer Source (API 30+)',
    description:
      'Queries all installed & system packages with getInstallSourceInfo() to distinguish Play Store, F-Droid, Sideloaded APK, and System apps.',
    code: `fun loadInstalledApps(context: Context): List<AppEntry> {
    val pm = context.packageManager
    val flags = PackageManager.ApplicationInfoFlags.of(
        PackageManager.GET_META_DATA.toLong()
    )
    return pm.getInstalledApplications(flags).map { appInfo ->
        val pkgName = appInfo.packageName
        val installerPkg = runCatching {
            pm.getInstallSourceInfo(pkgName).installingPackageName
        }.getOrNull()

        val source = when {
            (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0 -> InstallerSource.SYSTEM
            installerPkg == "com.android.vending" -> InstallerSource.PLAY_STORE
            installerPkg == "org.fdroid.fdroid" -> InstallerSource.FDROID
            else -> InstallerSource.SIDELOADED
        }

        AppEntry(
            name = pm.getApplicationLabel(appInfo).toString(),
            packageName = pkgName,
            targetSdk = appInfo.targetSdkVersion,
            installer = source
        )
    }.sortedBy { it.name.lowercase() }
}`,
  },
  {
    id: 'smart_store_intent',
    title: '3. Context-Aware Play Store & App Info Intents',
    description:
      'Prevents broken market:// links on sideloaded or system packages and opens native Android App Info directly.',
    code: `fun openSmartStoreOrFallback(context: Context, app: AppEntry) {
    if (app.installer == InstallerSource.PLAY_STORE) {
        val marketIntent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("market://details?id=\${app.packageName}")
        ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        context.startActivity(marketIntent)
    } else {
        val webQuery = Uri.encode("\${app.packageName} android apk")
        context.startActivity(
            Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/search?q=\$webQuery"))
        )
    }
}

fun openNativeAppInfo(context: Context, packageName: String) {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", packageName, null)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
}`,
  },
];

export const SettingsAndBlueprintScreen: React.FC<SettingsAndBlueprintScreenProps> = ({
  settings,
  onUpdateSettings,
  onTriggerToast,
  initialSubTab = 'SETTINGS',
}) => {
  const [subTab, setSubTab] = useState<'SETTINGS' | 'KOTLIN' | 'PLAY_STORE'>(
    initialSubTab
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string, label: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    onTriggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 thin-scrollbar">
      {/* Segmented Switcher: Preferences vs Kotlin vs Play Store Kit */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setSubTab('SETTINGS')}
          className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
            subTab === 'SETTINGS'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Prefs</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('KOTLIN')}
          className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
            subTab === 'KOTLIN'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 shrink-0" />
          <span>Kotlin</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('PLAY_STORE')}
          className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
            subTab === 'PLAY_STORE'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5 shrink-0" />
          <span>APK & Store Kit</span>
        </button>
      </div>

      {subTab === 'SETTINGS' && (
        <div className="space-y-4">
          {/* Theme Mode */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-2.5">
            <div className="text-xs font-bold">Surface Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'amoled', label: 'AMOLED' },
                  { id: 'slate', label: 'Slate Dark' },
                  { id: 'light', label: 'Clean Light' },
                ] as { id: ThemeMode; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`min-h-[40px] px-2 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    settings.theme === t.id
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Columns & Icon Shape */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div>
              <div className="text-xs font-bold mb-2">App Drawer Grid Columns</div>
              <div className="grid grid-cols-3 gap-2">
                {([4, 5, 6] as GridColumns[]).map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ gridColumns: cols, viewMode: 'GRID' })
                    }
                    className={`min-h-[40px] rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      settings.gridColumns === cols
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {cols} Columns
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold mb-2">Adaptive Icon Mask</div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'squircle', label: 'Squircle' },
                    { id: 'circle', label: 'Pixel Circle' },
                    { id: 'rounded-square', label: 'Rounded Box' },
                  ] as { id: IconShape; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onUpdateSettings({ iconShape: s.id })}
                    className={`min-h-[40px] rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      settings.iconShape === s.id
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Behavior Toggles */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div className="text-xs font-bold">Fast-Launch & Package Visibility</div>

            <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
              <div>
                <div className="text-xs font-semibold">Auto-Launch on Unique Search Match</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Immediately trigger app launch when search narrows down to 1 result
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoLaunchUniqueMatch}
                onChange={(e) =>
                  onUpdateSettings({ autoLaunchUniqueMatch: e.target.checked })
                }
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
              <div>
                <div className="text-xs font-semibold">Show System Apps in &ldquo;All Apps&rdquo;</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Include core Android packages alongside user-installed apps by default
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showSystemAppsInAll}
                onChange={(e) =>
                  onUpdateSettings({ showSystemAppsInAll: e.target.checked })
                }
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
              <div>
                <div className="text-xs font-semibold">Show Installer Source Badge on Icons</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Display Play Store (P), F-Droid (F), Sideloaded (S), and System (OS) tags
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showInstallerBadges}
                onChange={(e) =>
                  onUpdateSettings({ showInstallerBadges: e.target.checked })
                }
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
              <div>
                <div className="text-xs font-semibold">Enable Compact T9 Numeric Pad</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Dial numbers (e.g. 9-4-2 for WhatsApp) for fast one-handed thumb dialing
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showT9Keypad}
                onChange={(e) => onUpdateSettings({ showT9Keypad: e.target.checked })}
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {subTab === 'KOTLIN' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-slate-700 dark:text-zinc-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Ready for Android Studio:</span> Production Kotlin &amp; Manifest snippets powering OneDrawer&apos;s <code className="font-mono">PackageManager</code> indexing, installer verification, and native intents.
            </div>
          </div>

          {KOTLIN_BLUEPRINTS.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-900 text-zinc-100 border border-zinc-800 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-sky-400">{item.title}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{item.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(item.id, item.code, item.title)}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-[11px] font-mono text-zinc-200 overflow-x-auto thin-scrollbar leading-relaxed">
                {item.code}
              </pre>
            </div>
          ))}
        </div>
      )}

      {subTab === 'PLAY_STORE' && (
        <div className="space-y-4">
          {/* Generated Play Store Visual Assets */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div className="text-xs font-bold">Play Store Visual Assets (Hi-Res Icon &amp; Feature Graphic)</div>

            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-slate-200 dark:border-zinc-700 shrink-0">
                <img
                  src={PLAY_STORE_ICON_URL}
                  alt="OneDrawer 512x512 Google Play Store Icon"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold">512×512 App Icon</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Adaptive squircle icon for Play Console Store Listing
                </div>
                <a
                  href={PLAY_STORE_ICON_URL}
                  download="onedrawer-playstore-icon-512.jpg"
                  className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold transition-colors whitespace-nowrap"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Icon</span>
                </a>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Feature Graphic Banner (16:9 / 1024×500)</span>
                <a
                  href={PLAY_STORE_FEATURE_GRAPHIC_URL}
                  download="onedrawer-feature-graphic.jpg"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-[11px] font-semibold transition-colors whitespace-nowrap"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Banner</span>
                </a>
              </div>
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <img
                  src={PLAY_STORE_FEATURE_GRAPHIC_URL}
                  alt="OneDrawer Google Play Feature Graphic"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Play Store Listing Copy */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-3">
            <div className="text-xs font-bold">Google Play Console Store Listing Copy</div>

            {/* App Name */}
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  App Name ({PLAY_STORE_METADATA.appName.length}/30 chars)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText('app_name', PLAY_STORE_METADATA.appName, 'Play Store App Name')
                  }
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {copiedId === 'app_name' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-xs font-bold">{PLAY_STORE_METADATA.appName}</div>
            </div>

            {/* Short Description */}
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  Short Description ({PLAY_STORE_METADATA.shortDescription.length}/80 chars)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'short_desc',
                      PLAY_STORE_METADATA.shortDescription,
                      'Short Description'
                    )
                  }
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {copiedId === 'short_desc' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-xs">{PLAY_STORE_METADATA.shortDescription}</div>
            </div>

            {/* Full Long Description */}
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  Full Description ({PLAY_STORE_METADATA.longDescription.length}/4000 chars)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'long_desc',
                      PLAY_STORE_METADATA.longDescription,
                      'Full Play Store Description'
                    )
                  }
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {copiedId === 'long_desc' ? 'Copied' : 'Copy Full Text'}
                </button>
              </div>
              <pre className="text-[11px] font-sans text-slate-700 dark:text-zinc-300 max-h-40 overflow-y-auto thin-scrollbar whitespace-pre-wrap leading-relaxed">
                {PLAY_STORE_METADATA.longDescription}
              </pre>
            </div>

            {/* QUERY_ALL_PACKAGES Declaration */}
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                  Play Console Reviewer Note (QUERY_ALL_PACKAGES)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'perm_note',
                      PLAY_STORE_METADATA.permissionDeclaration,
                      'Permission Declaration'
                    )
                  }
                  className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {copiedId === 'perm_note' ? 'Copied' : 'Copy Note'}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                {PLAY_STORE_METADATA.permissionDeclaration}
              </p>
            </div>
          </div>

          {/* APK / AAB Build CLI Script */}
          <div className="rounded-2xl bg-slate-900 text-zinc-100 border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-emerald-400">
                  Build Signed APK &amp; Play Store AAB Bundle
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Run locally to generate app-debug.apk and app-release.aab
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    'build_cli',
                    PLAY_STORE_METADATA.buildCommands,
                    'APK/AAB build commands'
                  )
                }
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
              >
                {copiedId === 'build_cli' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy CLI</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-[11px] font-mono text-zinc-200 overflow-x-auto thin-scrollbar leading-relaxed">
              {PLAY_STORE_METADATA.buildCommands}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
