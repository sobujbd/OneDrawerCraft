import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  BatteryCharging,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Compass,
  Delete,
  ExternalLink,
  Grid,
  Hash,
  Info,
  LayoutGrid,
  List,
  Lock,
  Maximize2,
  Minimize2,
  MoreVertical,
  Play,
  Radar,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Signal,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { INITIAL_ANDROID_APPS, REFERENCE_NOW } from './data/appsData';
import {
  ActiveTab,
  AndroidApp,
  ExportedActivity,
  FilterCategory,
  LauncherSettings,
  SortOption,
} from './types/app';
import {
  computeRadarMetrics,
  filterApps,
  formatRelativeTime,
  formatStorageSize,
  getAppInitials,
  getSmartStoreAction,
  getTotalAppSizeMb,
  sortApps,
} from './utils/launcherLogic';
import { AppIcon } from './components/AppIcon';
import { AppActionSheet } from './components/AppActionSheet';
import { AndroidAppInfoModal } from './components/AndroidAppInfoModal';
import { PlayStorePreviewModal } from './components/PlayStorePreviewModal';
import { VaultPinModal } from './components/VaultPinModal';
import { RadarScreen } from './components/RadarScreen';
import { BatchManagerScreen } from './components/BatchManagerScreen';
import { SettingsAndBlueprintScreen } from './components/SettingsAndBlueprintScreen';

const FILTER_CHIPS: { id: FilterCategory; label: string }[] = [
  { id: 'ALL', label: 'All Apps' },
  { id: 'FAVORITES', label: 'Favorites' },
  { id: 'RECENT', label: 'Recent' },
  { id: 'USER', label: 'User Installed' },
  { id: 'SYSTEM', label: 'System Apps' },
  { id: 'PLAY_STORE', label: 'Play Store' },
  { id: 'SIDELOADED', label: 'Sideloaded' },
  { id: 'UNUSED_30D', label: 'Unused (30d+)' },
  { id: 'VAULT', label: 'Hidden Vault' },
];

const SORT_OPTIONS: { id: SortOption; label: string; badge: string }[] = [
  { id: 'NAME_ASC', label: 'Name (A–Z)', badge: 'A→Z' },
  { id: 'NAME_DESC', label: 'Name (Z–A)', badge: 'Z→A' },
  { id: 'MOST_USED', label: 'Most Used (Launch Count)', badge: 'Freq' },
  { id: 'RECENTLY_OPENED', label: 'Recently Opened', badge: 'Recent' },
  { id: 'RECENTLY_INSTALLED', label: 'Recently Installed', badge: 'New' },
  { id: 'RECENTLY_UPDATED', label: 'Recently Updated', badge: 'Upd' },
  { id: 'SIZE_DESC', label: 'App Size (Largest First)', badge: 'Size' },
  { id: 'SDK_ASC', label: 'Target SDK (Oldest First)', badge: 'SDK' },
];

const T9_KEYS = [
  { digit: '1', sub: 'PKG' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
];

const ALPHABET_INDEX = [
  '★',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

export default function App() {
  const [apps, setApps] = useState<AndroidApp[]>(INITIAL_ANDROID_APPS);
  const [nowClock, setNowClock] = useState<number>(REFERENCE_NOW);
  const [activeTab, setActiveTab] = useState<ActiveTab>('DRAWER');
  const [settingsSubTab, setSettingsSubTab] = useState<'SETTINGS' | 'KOTLIN' | 'PLAY_STORE'>('PLAY_STORE');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NAME_ASC');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSortSheetOpen, setIsSortSheetOpen] = useState<boolean>(false);
  const [showFavoritesStrip, setShowFavoritesStrip] = useState<boolean>(true);
  const [isFullScreenMobile, setIsFullScreenMobile] = useState<boolean>(false);

  // Vault unlock state
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);

  // Selected app for sheets/modals
  const [actionSheetAppId, setActionSheetAppId] = useState<string | null>(null);
  const [appInfoAppId, setAppInfoAppId] = useState<string | null>(null);
  const [playStoreAppId, setPlayStoreAppId] = useState<string | null>(null);

  // Active simulated app launch banner
  const [launchedBanner, setLaunchedBanner] = useState<{
    app: AndroidApp;
    activity?: ExportedActivity;
  } | null>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fast-index scrubber state
  const [activeScrubLetter, setActiveScrubLetter] = useState<string | null>(null);
  const drawerScrollRef = useRef<HTMLDivElement | null>(null);
  const letterRefs = useRef<Record<string, HTMLElement | null>>({});

  // Launcher settings
  const [settings, setSettings] = useState<LauncherSettings>({
    viewMode: 'LIST',
    gridColumns: 4,
    iconShape: 'squircle',
    theme: 'amoled',
    showSystemAppsInAll: true,
    autoLaunchUniqueMatch: false,
    showT9Keypad: false,
    showInstallerBadges: true,
    showPackageNamesInList: true,
    vaultPin: '1234',
  });

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [settings.theme]);

  const triggerToast = (message: string) => {
    setToastMsg(message);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const updateSettings = (partial: Partial<LauncherSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Filtered + Sorted Apps
  const filteredAndSortedApps = useMemo(() => {
    const filtered = filterApps(
      apps,
      activeFilter,
      searchQuery,
      settings.showSystemAppsInAll,
      nowClock
    );
    return sortApps(filtered, sortBy);
  }, [apps, activeFilter, searchQuery, settings.showSystemAppsInAll, sortBy, nowClock]);

  // Pinned Favorites & Recently Opened strips
  const favoriteApps = useMemo(
    () => apps.filter((a) => a.isFavorite && !a.isHiddenInVault),
    [apps]
  );

  const recentApps = useMemo(
    () =>
      apps
        .filter((a) => !a.isHiddenInVault && a.lastOpenedAt !== null)
        .sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))
        .slice(0, 8),
    [apps]
  );

  const radarSummary = useMemo(() => computeRadarMetrics(apps, nowClock), [apps, nowClock]);

  // Launch App Handler
  const handleLaunchApp = (app: AndroidApp, activity?: ExportedActivity) => {
    const nextTimestamp = nowClock + 60 * 1000;
    setNowClock(nextTimestamp);
    setApps((prev) =>
      prev.map((item) =>
        item.id === app.id
          ? {
              ...item,
              lastOpenedAt: nextTimestamp,
              launchCount: item.launchCount + 1,
              isStopped: false,
            }
          : item
      )
    );
    setLaunchedBanner({ app, activity });
    triggerToast(
      activity
        ? `Launched ${app.name} → ${activity.label}`
        : `Launched ${app.name} (${app.packageName})`
    );
  };

  // Auto-Launch on Unique Match
  useEffect(() => {
    if (
      settings.autoLaunchUniqueMatch &&
      searchQuery.trim().length >= 2 &&
      filteredAndSortedApps.length === 1
    ) {
      const targetApp = filteredAndSortedApps[0];
      const timer = setTimeout(() => {
        handleLaunchApp(targetApp);
        setSearchQuery('');
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [
    settings.autoLaunchUniqueMatch,
    searchQuery,
    filteredAndSortedApps,
  ]);

  // Favorite toggle
  const handleToggleFavorite = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const nextFav = !a.isFavorite;
        triggerToast(
          nextFav ? `Pinned ${a.name} to Favorites` : `Removed ${a.name} from Favorites`
        );
        return { ...a, isFavorite: nextFav };
      })
    );
  };

  // Vault toggle
  const handleToggleVault = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const nextVault = !a.isHiddenInVault;
        triggerToast(
          nextVault
            ? `Moved ${a.name} to Hidden Biometric Vault`
            : `Restored ${a.name} to main App Drawer`
        );
        return { ...a, isHiddenInVault: nextVault };
      })
    );
  };

  // Clear Cache (Single App)
  const handleClearAppCache = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        triggerToast(
          `Cleared ${formatStorageSize(a.cacheSizeMb)} cache for ${a.name}`
        );
        return { ...a, cacheSizeMb: 0 };
      })
    );
  };

  // Force Stop (Single App)
  const handleForceStopApp = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        triggerToast(`Force stopped ${a.packageName}`);
        return { ...a, isStopped: true };
      })
    );
  };

  // Clear All Caches (Radar)
  const handleClearAllCaches = () => {
    const totalCleared = radarSummary.totalCacheMb;
    setApps((prev) => prev.map((a) => ({ ...a, cacheSizeMb: 0 })));
    triggerToast(`Purged ${formatStorageSize(totalCleared)} cache across all packages`);
  };

  // Batch Pin Favorites
  const handleBatchPinFavorites = (appIds: string[], pin: boolean) => {
    setApps((prev) =>
      prev.map((a) => (appIds.includes(a.id) ? { ...a, isFavorite: pin } : a))
    );
    triggerToast(`Pinned ${appIds.length} apps to Favorites strip`);
  };

  // Handle Filter Chip Selection (with Vault PIN check)
  const handleSelectFilterChip = (cat: FilterCategory) => {
    if (cat === 'VAULT' && !isVaultUnlocked) {
      setIsVaultModalOpen(true);
      return;
    }
    setActiveFilter(cat);
  };

  // A–Z Fast-Index Scrubber Handler
  const handleScrubToLetter = (letter: string) => {
    setActiveScrubLetter(letter);
    setTimeout(() => setActiveScrubLetter(null), 900);

    if (letter === '★') {
      drawerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If not sorted alphabetically, switch to NAME_ASC so letter scrubbing makes immediate sense
    if (sortBy !== 'NAME_ASC' && sortBy !== 'NAME_DESC') {
      setSortBy('NAME_ASC');
    }

    const targetEl = letterRefs.current[letter];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Resolve active modal app objects
  const actionSheetApp = useMemo(
    () => apps.find((a) => a.id === actionSheetAppId) || null,
    [apps, actionSheetAppId]
  );
  const appInfoApp = useMemo(
    () => apps.find((a) => a.id === appInfoAppId) || null,
    [apps, appInfoAppId]
  );
  const playStoreApp = useMemo(
    () => apps.find((a) => a.id === playStoreAppId) || null,
    [apps, playStoreAppId]
  );

  // Default inspected app for Desktop Companion Dock
  const [desktopInspectId, setDesktopInspectId] = useState<string>('whatsapp');
  const desktopInspectedApp = useMemo(
    () =>
      actionSheetApp ||
      appInfoApp ||
      apps.find((a) => a.id === desktopInspectId) ||
      apps[0],
    [actionSheetApp, appInfoApp, apps, desktopInspectId]
  );

  const currentSortMeta =
    SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];

  // Theme surface classes for the phone screen
  const phoneSurfaceClasses = {
    amoled: 'bg-black text-zinc-100 border-zinc-800',
    slate: 'bg-slate-950 text-slate-100 border-slate-800',
    light: 'bg-white text-slate-900 border-slate-200',
  }[settings.theme];

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col">
      {/* Top Bar Contract (Desktop Header — 3 Clean Zones) */}
      {!isFullScreenMobile && (
        <header className="hidden lg:flex items-center justify-between gap-8 px-8 h-14 border-b border-slate-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('DRAWER');
            }}
            className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            OneDrawer
          </a>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav className="flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => setActiveTab('DRAWER')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'DRAWER'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold underline underline-offset-4'
                  : ''
              }`}
            >
              App Drawer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RADAR')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'RADAR'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold underline underline-offset-4'
                  : ''
              }`}
            >
              Bloatware Radar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BATCH')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'BATCH'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold underline underline-offset-4'
                  : ''
              }`}
            >
              Batch Manager
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'SETTINGS'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold underline underline-offset-4'
                  : ''
              }`}
            >
              Kotlin Blueprint
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsFullScreenMobile(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Expand Full-Screen View
            </button>
          </div>
        </header>
      )}

      {/* Main Responsive Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center lg:py-5 lg:px-8 gap-8">
        {/* ANDROID PHONE LAUNCHER FRAME (or Full-Screen Mobile Container) */}
        <div
          className={`relative flex flex-col overflow-hidden transition-all ${phoneSurfaceClasses} ${
            isFullScreenMobile
              ? 'w-full h-screen max-w-2xl mx-auto border-x'
              : 'w-full h-screen lg:w-[420px] lg:h-[810px] lg:rounded-[40px] lg:border-[6px] lg:border-zinc-800 lg:shadow-2xl shrink-0'
          }`}
        >
          {/* Android System Status Bar */}
          <div className="h-8 px-5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400 select-none shrink-0 border-b border-slate-200/40 dark:border-zinc-900">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">21:35</span>
              <span>·</span>
              <span>Android 15</span>
            </div>

            <div className="flex items-center gap-2">
              {isFullScreenMobile && (
                <button
                  type="button"
                  onClick={() => setIsFullScreenMobile(false)}
                  className="hidden lg:inline-flex items-center gap-1 text-[10px] text-sky-500 hover:underline mr-1 cursor-pointer"
                >
                  <Minimize2 className="w-3 h-3" /> Frame View
                </button>
              )}
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <span className="tabular-nums">94%</span>
            </div>
          </div>

          {/* Active App Launch Simulation Banner */}
          {launchedBanner && (
            <div className="mx-3 mt-2 px-3.5 py-2.5 rounded-2xl bg-sky-600 text-white shadow-lg flex items-center justify-between gap-2 z-30">
              <div className="flex items-center gap-2.5 min-w-0">
                <Play className="w-4 h-4 fill-current shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    Launching {launchedBanner.app.name}
                  </div>
                  <div className="text-[10px] font-mono text-sky-100 truncate">
                    {launchedBanner.activity
                      ? launchedBanner.activity.className
                      : `${launchedBanner.app.packageName} · Launch #${
                          launchedBanner.app.launchCount + 1
                        }`}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLaunchedBanner(null)}
                aria-label="Dismiss launch banner"
                className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-semibold shrink-0 cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Toast Notification Overlay */}
          {toastMsg && (
            <div
              role="status"
              className="absolute top-11 left-4 right-4 z-40 px-3.5 py-2 rounded-xl bg-zinc-900/95 dark:bg-zinc-800/95 text-white border border-zinc-700 text-xs font-medium shadow-lg flex items-center justify-between gap-2"
            >
              <span className="truncate">{toastMsg}</span>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                aria-label="Close notification"
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SCREEN 1: MAIN LAUNCHER & APP DRAWER */}
          {activeTab === 'DRAWER' && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Top Quick Stats & View Controls Bar */}
              <div className="px-4 py-2.5 flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-zinc-900 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold tracking-tight truncate">
                    OneDrawer
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span
                    data-testid="visible-apps-count"
                    className="text-xs font-mono text-slate-500 dark:text-zinc-400 tabular-nums whitespace-nowrap"
                  >
                    {filteredAndSortedApps.length} apps
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle Pinned / Recent Strip */}
                  <button
                    type="button"
                    onClick={() => setShowFavoritesStrip((v) => !v)}
                    aria-label={
                      showFavoritesStrip ? 'Hide Favorites Strip' : 'Show Favorites Strip'
                    }
                    title="Toggle Pinned Favorites & Recent Strip"
                    className={`min-h-[38px] px-2.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      showFavoritesStrip
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono">{favoriteApps.length}</span>
                  </button>

                  {/* Sort Sheet Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsSortSheetOpen(true)}
                    aria-label="Sort apps"
                    className="min-h-[38px] px-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-sky-500" />
                    <span className="font-mono text-[11px]">{currentSortMeta.badge}</span>
                  </button>

                  {/* View Mode Toggle: Grid vs List */}
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        viewMode: settings.viewMode === 'LIST' ? 'GRID' : 'LIST',
                      })
                    }
                    aria-label={
                      settings.viewMode === 'LIST'
                        ? 'Switch to Grid View'
                        : 'Switch to Detailed List View'
                    }
                    className="min-w-[38px] min-h-[38px] rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {settings.viewMode === 'LIST' ? (
                      <LayoutGrid className="w-4 h-4 text-sky-500" />
                    ) : (
                      <List className="w-4 h-4 text-sky-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Scrollable Main Drawer Area */}
              <div
                ref={drawerScrollRef}
                className="flex-1 overflow-y-auto pr-7 pl-3.5 py-2.5 space-y-3 thin-scrollbar"
              >
                {/* Collapsible Pinned Favorites & Recently Opened Strip */}
                {showFavoritesStrip && !searchQuery.trim() && activeFilter === 'ALL' && (
                  <div className="space-y-2.5 pb-2 border-b border-slate-200/70 dark:border-zinc-900">
                    {/* Pinned Favorites Row */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1.5 px-0.5">
                        <span>Pinned Favorites</span>
                        <span className="font-mono">{favoriteApps.length} pinned</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {favoriteApps.map((fav) => (
                          <button
                            key={fav.id}
                            type="button"
                            onClick={() => {
                              setDesktopInspectId(fav.id);
                              handleLaunchApp(fav);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setDesktopInspectId(fav.id);
                              setActionSheetAppId(fav.id);
                            }}
                            className="group flex flex-col items-center w-14 shrink-0 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                          >
                            <AppIcon
                              app={fav}
                              shape={settings.iconShape}
                              size="sm"
                              showInstallerDot={settings.showInstallerBadges}
                            />
                            <span className="text-[10px] font-medium truncate w-full text-center mt-1">
                              {fav.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recently Opened Row */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1 px-0.5">
                        <span>Recently Opened</span>
                        <span className="font-mono">Live history</span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {recentApps.slice(0, 5).map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => {
                              setDesktopInspectId(rec.id);
                              handleLaunchApp(rec);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/90 hover:bg-slate-200/70 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800/80 shrink-0 transition-colors cursor-pointer"
                          >
                            <AppIcon app={rec} shape={settings.iconShape} size="sm" />
                            <div className="text-left">
                              <div className="text-[11px] font-semibold leading-tight truncate max-w-[82px]">
                                {rec.name}
                              </div>
                              <div className="text-[9px] font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                                {formatRelativeTime(rec.lastOpenedAt, nowClock)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty Search / Filter State */}
                {filteredAndSortedApps.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2">
                    <p className="text-sm font-bold">No matching Android packages</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      No installed or system apps matched &ldquo;{searchQuery}&rdquo; in {activeFilter}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('ALL');
                      }}
                      className="mt-2 min-h-[40px] px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Reset Search & Filters
                    </button>
                  </div>
                ) : settings.viewMode === 'GRID' ? (
                  /* GRID VIEW (4 / 5 / 6 Columns) */
                  <div
                    className={`grid gap-2 pt-1 ${
                      settings.gridColumns === 4
                        ? 'grid-cols-4'
                        : settings.gridColumns === 5
                        ? 'grid-cols-5'
                        : 'grid-cols-6'
                    }`}
                  >
                    {filteredAndSortedApps.map((app) => {
                      const firstChar = app.name[0]?.toUpperCase() || '#';
                      return (
                        <div
                          key={app.id}
                          ref={(el) => {
                            if (el && !letterRefs.current[firstChar]) {
                              letterRefs.current[firstChar] = el;
                            }
                          }}
                          className="group relative flex flex-col items-center p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setDesktopInspectId(app.id);
                              handleLaunchApp(app);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setDesktopInspectId(app.id);
                              setActionSheetAppId(app.id);
                            }}
                            className="flex flex-col items-center w-full cursor-pointer"
                          >
                            <AppIcon
                              app={app}
                              shape={settings.iconShape}
                              size="md"
                              showInstallerDot={settings.showInstallerBadges}
                            />
                            <span className="text-[11px] font-medium text-center truncate w-full mt-1.5 leading-tight">
                              {app.name}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                              {formatStorageSize(getTotalAppSizeMb(app))}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDesktopInspectId(app.id);
                              setActionSheetAppId(app.id);
                            }}
                            aria-label={`More actions for ${app.name}`}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* DETAILED LIST VIEW */
                  <div className="divide-y divide-slate-200/60 dark:divide-zinc-900">
                    {filteredAndSortedApps.map((app, index) => {
                      const firstChar = app.name[0]?.toUpperCase() || '#';
                      const prevChar =
                        index > 0
                          ? filteredAndSortedApps[index - 1].name[0]?.toUpperCase()
                          : null;
                      const isFirstOfLetter = firstChar !== prevChar;
                      const totalMb = getTotalAppSizeMb(app);
                      const installerText = {
                        PLAY_STORE: 'Play Store',
                        FDROID: 'F-Droid',
                        SIDELOADED: 'Sideloaded',
                        SYSTEM: 'System',
                      }[app.installer];

                      return (
                        <div
                          key={app.id}
                          ref={(el) => {
                            if (isFirstOfLetter && el) {
                              letterRefs.current[firstChar] = el;
                            }
                          }}
                          className="py-1.5 flex items-center justify-between gap-2 group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setDesktopInspectId(app.id);
                              handleLaunchApp(app);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setDesktopInspectId(app.id);
                              setActionSheetAppId(app.id);
                            }}
                            className="flex-1 min-h-[54px] flex items-center gap-3 text-left rounded-xl px-1.5 py-1 hover:bg-slate-100/80 dark:hover:bg-zinc-900/80 transition-colors min-w-0 cursor-pointer"
                          >
                            <AppIcon
                              app={app}
                              shape={settings.iconShape}
                              size="md"
                              showInstallerDot={settings.showInstallerBadges}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold truncate">
                                  {app.name}
                                </span>
                                {app.isFavorite && (
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                )}
                              </div>

                              {settings.showPackageNamesInList && (
                                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                                  {app.packageName}
                                </div>
                              )}

                              {/* Clean unboxed metadata with middots on a single line */}
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 tabular-nums mt-0.5 whitespace-nowrap overflow-hidden">
                                <span className="shrink-0">{installerText}</span>
                                <span aria-hidden="true" className="shrink-0">·</span>
                                <span className="shrink-0">{formatStorageSize(totalMb)}</span>
                                <span aria-hidden="true" className="shrink-0">·</span>
                                <span className="truncate max-w-[78px]">v{app.versionName}</span>
                                <span aria-hidden="true" className="shrink-0">·</span>
                                <span className="shrink-0">API {app.targetSdk}</span>
                              </div>
                            </div>
                          </button>

                          {/* 3-Dot Context Action Sheet Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setDesktopInspectId(app.id);
                              setActionSheetAppId(app.id);
                            }}
                            aria-label={`Actions for ${app.name}`}
                            className="min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating Material You Fast-Index Bubble */}
              {activeScrubLetter && (
                <div className="pointer-events-none absolute top-1/3 right-12 w-14 h-14 rounded-2xl bg-sky-600 text-white font-bold text-xl flex items-center justify-center shadow-xl z-30">
                  {activeScrubLetter}
                </div>
              )}

              {/* Right-Edge A–Z Fast-Index Scrubber */}
              <div
                aria-label="Alphabet fast index scrubber"
                className="absolute right-0.5 top-14 bottom-32 w-6 flex flex-col items-center justify-between py-1 select-none z-20"
              >
                {ALPHABET_INDEX.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleScrubToLetter(letter)}
                    aria-label={`Jump to ${letter}`}
                    className="w-5 h-3.5 text-[9px] font-mono font-semibold text-slate-400 dark:text-zinc-500 hover:text-sky-500 dark:hover:text-sky-400 flex items-center justify-center leading-none cursor-pointer"
                  >
                    {letter}
                  </button>
                ))}
              </div>

              {/* BOTTOM-FIRST ONE-HANDED ERGONOMIC ZONE */}
              <div className="border-t border-slate-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 pt-2 pb-2 space-y-2 shrink-0 z-20">
                {/* Auto-Launch on Unique Match Indicator */}
                {settings.autoLaunchUniqueMatch &&
                  searchQuery.trim().length >= 2 &&
                  filteredAndSortedApps.length === 1 && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
                      <span>
                        Auto-launching {filteredAndSortedApps[0].name}...
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="underline text-[11px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                {/* Horizontally Scrollable Filter Chips */}
                <div
                  role="tablist"
                  aria-label="App category filters"
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
                >
                  {FILTER_CHIPS.map((chip) => {
                    const isActive = activeFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleSelectFilterChip(chip.id)}
                        className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {chip.id === 'VAULT' && <Lock className="w-3 h-3" />}
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Compact T9 Dialpad */}
                {settings.showT9Keypad && (
                  <div className="grid grid-cols-5 gap-1 pt-0.5">
                    {T9_KEYS.map((k) => (
                      <button
                        key={k.digit}
                        type="button"
                        onClick={() => setSearchQuery((q) => q + k.digit)}
                        className="h-9 rounded-lg bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 flex flex-col items-center justify-center leading-none cursor-pointer"
                      >
                        <span className="text-xs font-mono font-bold">{k.digit}</span>
                        <span className="text-[8px] font-mono text-slate-400">{k.sub}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSearchQuery((q) => q.slice(0, -1))}
                      aria-label="Backspace T9"
                      className="h-9 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center cursor-pointer"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Bottom Omni-Search Bar */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1 flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search installed or system apps"
                      placeholder="Search app, initials (WA), pkg, or T9..."
                      className="w-full h-11 pl-9 pr-8 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-sky-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search query"
                        className="absolute right-2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Toggle T9 Keypad Button */}
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({ showT9Keypad: !settings.showT9Keypad })
                    }
                    aria-label="Toggle T9 Keypad"
                    title="Toggle T9 Numeric Dialpad"
                    className={`min-w-[44px] h-11 rounded-2xl border flex items-center justify-center text-xs font-mono font-bold transition-colors cursor-pointer ${
                      settings.showT9Keypad
                        ? 'bg-sky-600 border-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    T9
                  </button>

                  {/* Toggle Auto-Launch on 1 Match */}
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        autoLaunchUniqueMatch: !settings.autoLaunchUniqueMatch,
                      })
                    }
                    aria-label="Toggle Auto-Launch on Unique Match"
                    title="Auto-Launch when search narrows down to 1 app"
                    className={`min-w-[44px] h-11 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer ${
                      settings.autoLaunchUniqueMatch
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: APP INTELLIGENCE & BLOATWARE RADAR */}
          {activeTab === 'RADAR' && (
            <RadarScreen
              apps={apps}
              iconShape={settings.iconShape}
              onSelectApp={(app) => {
                setDesktopInspectId(app.id);
                setActionSheetAppId(app.id);
              }}
              onClearAllCaches={handleClearAllCaches}
              onJumpToDrawerFilter={(filter) => {
                setActiveFilter(filter);
                setActiveTab('DRAWER');
              }}
            />
          )}

          {/* SCREEN 3: BATCH MANAGER & EXPORT */}
          {activeTab === 'BATCH' && (
            <BatchManagerScreen
              apps={apps}
              iconShape={settings.iconShape}
              onBatchPinFavorites={handleBatchPinFavorites}
              onTriggerToast={triggerToast}
            />
          )}

          {/* SCREEN 4: SETTINGS & KOTLIN BLUEPRINT */}
          {activeTab === 'SETTINGS' && (
            <SettingsAndBlueprintScreen
              key={settingsSubTab}
              settings={settings}
              onUpdateSettings={updateSettings}
              onTriggerToast={triggerToast}
              initialSubTab={settingsSubTab}
            />
          )}

          {/* Fixed Bottom Navigation Tab Bar (4 Primary Destinations) */}
          <nav
            aria-label="Primary Launcher Navigation"
            className="grid grid-cols-4 items-center h-14 border-t border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 shrink-0 select-none"
          >
            <button
              type="button"
              onClick={() => setActiveTab('DRAWER')}
              className={`h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${
                activeTab === 'DRAWER'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Drawer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RADAR')}
              className={`h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${
                activeTab === 'RADAR'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Radar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BATCH')}
              className={`h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${
                activeTab === 'BATCH'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Batch</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className={`h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${
                activeTab === 'SETTINGS'
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Settings</span>
            </button>
          </nav>

          {/* MULTI-DIMENSIONAL SORT BOTTOM SHEET */}
          {isSortSheetOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs"
              role="dialog"
              aria-modal="true"
              aria-label="Sort Applications"
              onClick={() => setIsSortSheetOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-5 shadow-2xl text-slate-900 dark:text-zinc-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-10 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <h3 className="text-sm font-bold">Sort Applications By</h3>
                  <button
                    type="button"
                    onClick={() => setIsSortSheetOpen(false)}
                    aria-label="Close sort menu"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5 mt-3 max-h-[60vh] overflow-y-auto">
                  {SORT_OPTIONS.map((option) => {
                    const selected = sortBy === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSortBy(option.id);
                          setIsSortSheetOpen(false);
                        }}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                          selected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-50 dark:bg-zinc-800/70 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        <span>{option.label}</span>
                        {selected ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="font-mono text-[10px] opacity-60">
                            {option.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DESKTOP COMPANION INSPECTOR & ARCHITECTURE WORKBENCH (Visible on 1440px Desktop) */}
        {!isFullScreenMobile && (
          <aside className="hidden lg:flex flex-col flex-1 max-w-2xl h-[810px] rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 overflow-y-auto thin-scrollbar space-y-6">
            {/* Workbench Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  OneDrawer Package Inspector & Live Telemetry
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Unified daily Android App Launcher + Deep Package Manager. Select any app in the device frame to inspect its manifest, activities, and store routing.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({
                      theme:
                        settings.theme === 'amoled'
                          ? 'slate'
                          : settings.theme === 'slate'
                          ? 'light'
                          : 'amoled',
                    })
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Theme: {settings.theme.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Live Selected Package Deep Inspector Card */}
            {desktopInspectedApp && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <AppIcon
                      app={desktopInspectedApp}
                      shape={settings.iconShape}
                      size="lg"
                      showInstallerDot
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold truncate">
                          {desktopInspectedApp.name}
                        </h2>
                        <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                          v{desktopInspectedApp.versionName}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-sky-600 dark:text-sky-400 truncate">
                        {desktopInspectedApp.packageName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
                        <span>{desktopInspectedApp.developer}</span>
                        <span aria-hidden="true">·</span>
                        <span>Target API {desktopInspectedApp.targetSdk}</span>
                        <span aria-hidden="true">·</span>
                        <span>{desktopInspectedApp.launchCount} launches</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActionSheetAppId(desktopInspectedApp.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Action Sheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppInfoAppId(desktopInspectedApp.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Android App Info
                    </button>
                  </div>
                </div>

                {/* Storage & Smart Store Routing Grid */}
                <div className="grid grid-cols-3 gap-3 pt-2 tabular-nums">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Total Storage
                    </div>
                    <div className="text-sm font-bold font-mono mt-0.5">
                      {formatStorageSize(getTotalAppSizeMb(desktopInspectedApp))}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      APK {desktopInspectedApp.apkSizeMb}M · Cache{' '}
                      {desktopInspectedApp.cacheSizeMb}M
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Installer Origin
                    </div>
                    <div className="text-sm font-bold font-mono mt-0.5">
                      {desktopInspectedApp.installer}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {desktopInspectedApp.installer === 'PLAY_STORE'
                        ? 'market:// verified'
                        : 'Smart APK/Web fallback'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Exported Activities
                    </div>
                    <div className="text-sm font-bold font-mono mt-0.5">
                      {desktopInspectedApp.exportedActivities.length} entrypoints
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {desktopInspectedApp.permissions.length} permissions
                    </div>
                  </div>
                </div>

                {/* Direct Sub-Activity Shortcuts */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                    Direct Exported Activities (Click to Launch Sub-Screen)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {desktopInspectedApp.exportedActivities.map((act) => (
                      <button
                        key={act.className}
                        type="button"
                        onClick={() => handleLaunchApp(desktopInspectedApp, act)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-sky-500/10 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{act.label}</div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                            {act.className}
                          </div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Interactive Filter & Feature Matrix */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold">
                Why OneDrawer Replaces Separate App Drawers & Package Analyzers
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('DRAWER');
                    setSearchQuery('wa');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                    01. Initials, Package & T9 Omni-Search
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Type &ldquo;wa&rdquo; for WhatsApp, &ldquo;moe.shizuku&rdquo; for package IDs, or dial T9 numbers one-handed. Click to test &ldquo;wa&rdquo;.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('DRAWER');
                    setSearchQuery('');
                    setActiveFilter('SIDELOADED');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    02. Smart Installer Source Routing
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Distinguishes Play Store, F-Droid, Sideloaded APKs, and System packages—never shows a dead Play Store link.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('RADAR')}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    03. 30-Day Dormant & Old SDK Radar
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Replaces standalone storage analyzers by flagging unused 30d+ bloatware ({radarSummary.unusedApps.length} apps) and legacy Target SDKs.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettingsSubTab('PLAY_STORE');
                    setActiveTab('SETTINGS');
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-violet-600 dark:text-violet-400">
                    04. APK / AAB & Play Store Release Kit
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Download the 512×512 Play Store Icon, Feature Graphic, ASO copy, and Capacitor/Gradle APK/AAB scripts.
                  </p>
                </button>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* CONTEXT-AWARE LONG-PRESS / TAP ACTION SHEET */}
      <AppActionSheet
        app={actionSheetApp}
        iconShape={settings.iconShape}
        onClose={() => setActionSheetAppId(null)}
        onLaunchApp={handleLaunchApp}
        onToggleFavorite={handleToggleFavorite}
        onToggleVault={handleToggleVault}
        onOpenAppInfo={(app) => setAppInfoAppId(app.id)}
        onOpenPlayStorePreview={(app) => {
          setActionSheetAppId(null);
          setPlayStoreAppId(app.id);
        }}
        onTriggerToast={triggerToast}
      />

      {/* NATIVE ANDROID APP INFO SIMULATION MODAL */}
      <AndroidAppInfoModal
        app={appInfoApp}
        iconShape={settings.iconShape}
        onClose={() => setAppInfoAppId(null)}
        onLaunchApp={handleLaunchApp}
        onClearCache={handleClearAppCache}
        onForceStop={handleForceStopApp}
        onOpenStorePreview={(app) => {
          setAppInfoAppId(null);
          setPlayStoreAppId(app.id);
        }}
        onTriggerToast={triggerToast}
      />

      {/* GOOGLE PLAY STORE LISTING PREVIEW MODAL */}
      <PlayStorePreviewModal
        app={playStoreApp}
        iconShape={settings.iconShape}
        onClose={() => setPlayStoreAppId(null)}
        onLaunchApp={handleLaunchApp}
      />

      {/* BIOMETRIC / PIN VAULT UNLOCK MODAL */}
      <VaultPinModal
        isOpen={isVaultModalOpen}
        expectedPin={settings.vaultPin}
        onUnlockSuccess={() => {
          setIsVaultUnlocked(true);
          setIsVaultModalOpen(false);
          setActiveFilter('VAULT');
          triggerToast('Biometric Vault unlocked');
        }}
        onClose={() => setIsVaultModalOpen(false)}
      />
    </div>
  );
}
