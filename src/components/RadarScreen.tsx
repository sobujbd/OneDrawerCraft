import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  HardDrive,
  Layers,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AndroidApp, IconShape, InstallerSource } from '../types/app';
import {
  computeRadarMetrics,
  formatRelativeTime,
  formatStorageSize,
  getTotalAppSizeMb,
} from '../utils/launcherLogic';
import { AppIcon } from './AppIcon';

interface RadarScreenProps {
  apps: AndroidApp[];
  iconShape: IconShape;
  onSelectApp: (app: AndroidApp) => void;
  onClearAllCaches: () => void;
  onJumpToDrawerFilter: (filter: 'UNUSED_30D' | 'PLAY_STORE' | 'SIDELOADED' | 'SYSTEM') => void;
}

export const RadarScreen: React.FC<RadarScreenProps> = ({
  apps,
  iconShape,
  onSelectApp,
  onClearAllCaches,
  onJumpToDrawerFilter,
}) => {
  const [activeSection, setActiveSection] = useState<'STORAGE' | 'UNUSED' | 'SDK'>('STORAGE');
  const metrics = computeRadarMetrics(apps);
  const maxHogSize = metrics.storageHogs[0] ? getTotalAppSizeMb(metrics.storageHogs[0]) : 1;

  const installerMeta: {
    key: InstallerSource;
    label: string;
    color: string;
    filterTarget: 'PLAY_STORE' | 'SIDELOADED' | 'SYSTEM';
  }[] = [
    {
      key: 'PLAY_STORE',
      label: 'Google Play Store',
      color: 'bg-emerald-500',
      filterTarget: 'PLAY_STORE',
    },
    {
      key: 'SIDELOADED',
      label: 'Direct APK Sideload',
      color: 'bg-amber-500',
      filterTarget: 'SIDELOADED',
    },
    {
      key: 'FDROID',
      label: 'F-Droid FOSS',
      color: 'bg-sky-500',
      filterTarget: 'SIDELOADED',
    },
    {
      key: 'SYSTEM',
      label: 'Android System Image',
      color: 'bg-slate-500',
      filterTarget: 'SYSTEM',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 thin-scrollbar">
      {/* Header & Reclaimable Cache Action */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">App Intelligence & Radar</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Storage telemetry, dormant bloatware, and Android SDK targets
          </p>
        </div>
        <button
          type="button"
          disabled={metrics.totalCacheMb <= 0}
          onClick={onClearAllCaches}
          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
            metrics.totalCacheMb > 0
              ? 'bg-sky-600 hover:bg-sky-500 text-white'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {metrics.totalCacheMb > 0
              ? `Purge ${formatStorageSize(metrics.totalCacheMb)} Cache`
              : 'Cache Clean'}
          </span>
        </button>
      </div>

      {/* Top 4 KPI Summary Grid */}
      <div className="grid grid-cols-2 gap-2.5 tabular-nums">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Total App Footprint</span>
            <HardDrive className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg font-bold mt-1">{formatStorageSize(metrics.totalStorageMb)}</div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {metrics.userAppsCount} user · {metrics.systemAppsCount} system
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveSection('UNUSED')}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 text-left transition-colors cursor-pointer"
        >
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Unused (30+ Days)</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold mt-1 text-amber-600 dark:text-amber-400">
            {metrics.unusedApps.length} apps
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Dormant storage candidates
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('SDK')}
          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 text-left transition-colors cursor-pointer"
        >
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Legacy Target SDK</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-bold mt-1 text-rose-600 dark:text-rose-400">
            {metrics.outdatedSdkApps.length} packages
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Targeting API ≤ 33
          </div>
        </button>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800">
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Reclaimable Cache</span>
            <Trash2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold mt-1">{formatStorageSize(metrics.totalCacheMb)}</div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Across {metrics.totalApps} indexed packages
          </div>
        </div>
      </div>

      {/* Installer Source Distribution Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>Installer Source Intelligence</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
            {metrics.totalApps} packages
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-zinc-800">
          {installerMeta.map((item) => {
            const count = metrics.installerCounts[item.key] || 0;
            const pct = metrics.totalApps > 0 ? (count / metrics.totalApps) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={item.key}
                style={{ width: `${pct}%` }}
                className={`${item.color} h-full transition-all`}
                title={`${item.label}: ${count}`}
              />
            );
          })}
        </div>

        {/* Interactive Legend */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {installerMeta.map((item) => {
            const count = metrics.installerCounts[item.key] || 0;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onJumpToDrawerFilter(item.filterTarget)}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-xs ${item.color} shrink-0`} />
                  <span className="truncate text-slate-700 dark:text-zinc-300">{item.label}</span>
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 tabular-nums ml-1">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Segmented Section Selector */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveSection('STORAGE')}
          className={`flex-1 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSection === 'STORAGE'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Storage Hogs ({metrics.storageHogs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('UNUSED')}
          className={`flex-1 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSection === 'UNUSED'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Unused 30d+ ({metrics.unusedApps.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('SDK')}
          className={`flex-1 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSection === 'SDK'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Old SDK ({metrics.outdatedSdkApps.length})
        </button>
      </div>

      {/* Drill-down List */}
      {activeSection === 'STORAGE' && (
        <div className="space-y-2">
          {metrics.storageHogs.map((app) => {
            const totalMb = getTotalAppSizeMb(app);
            const ratio = Math.min(100, Math.max(6, (totalMb / maxHogSize) * 100));
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => onSelectApp(app)}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <AppIcon app={app} shape={iconShape} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{app.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                        {app.packageName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <div className="text-xs font-mono font-bold">
                      {formatStorageSize(totalMb)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      Cache {formatStorageSize(app.cacheSizeMb)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${ratio}%` }}
                    className="h-full bg-sky-500 rounded-full"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeSection === 'UNUSED' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 px-1">
            <span>Apps not launched in the past 30 days</span>
            <button
              type="button"
              onClick={() => onJumpToDrawerFilter('UNUSED_30D')}
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
            >
              Filter in Drawer
            </button>
          </div>
          {metrics.unusedApps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onSelectApp(app)}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AppIcon app={app} shape={iconShape} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{app.name}</div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400">
                    Last opened: {formatRelativeTime(app.lastOpenedAt)}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 tabular-nums">
                <div className="text-xs font-mono font-bold">
                  {formatStorageSize(getTotalAppSizeMb(app))}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {app.launchCount} launches
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeSection === 'SDK' && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500 dark:text-zinc-400 px-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Packages targeting older Android API levels (lack granular photo/background restrictions)</span>
          </div>
          {metrics.outdatedSdkApps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onSelectApp(app)}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AppIcon app={app} shape={iconShape} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{app.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                    {app.packageName}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 font-mono tabular-nums">
                <div
                  className={`text-xs font-bold ${
                    app.targetSdk <= 29
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  Target API {app.targetSdk}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Min API {app.minSdk}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
