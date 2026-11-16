import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BatteryCharging,
  ExternalLink,
  HardDrive,
  Play,
  Shield,
  Trash2,
} from 'lucide-react';
import { AndroidApp, IconShape } from '../types/app';
import {
  formatStorageSize,
  getSmartStoreAction,
  getTotalAppSizeMb,
} from '../utils/launcherLogic';
import { AppIcon } from './AppIcon';

interface AndroidAppInfoModalProps {
  app: AndroidApp | null;
  iconShape: IconShape;
  onClose: () => void;
  onLaunchApp: (app: AndroidApp) => void;
  onClearCache: (appId: string) => void;
  onForceStop: (appId: string) => void;
  onOpenStorePreview: (app: AndroidApp) => void;
  onTriggerToast: (msg: string) => void;
}

export const AndroidAppInfoModal: React.FC<AndroidAppInfoModalProps> = ({
  app,
  iconShape,
  onClose,
  onLaunchApp,
  onClearCache,
  onForceStop,
  onOpenStorePreview,
  onTriggerToast,
}) => {
  if (!app) return null;

  const totalSize = getTotalAppSizeMb(app);
  const storeAction = getSmartStoreAction(app);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`App Info for ${app.name}`}
      onClick={onClose}
    >
      <div
        className="w-full h-full sm:h-auto sm:max-h-[88vh] max-w-md sm:rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Android Settings Bar */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back to launcher"
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold leading-tight">App info</h2>
              <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                android.settings.APPLICATION_DETAILS_SETTINGS
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            API {app.targetSdk}
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 thin-scrollbar">
          {/* App Identity Header */}
          <div className="flex flex-col items-center text-center">
            <AppIcon app={app} shape={iconShape} size="xl" showInstallerDot />
            <h3 className="text-lg font-bold mt-3">{app.name}</h3>
            <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
              {app.packageName}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
              <span>v{app.versionName}</span>
              <span aria-hidden="true">·</span>
              <span>Code {app.versionCode}</span>
              <span aria-hidden="true">·</span>
              <span>{app.isSystem ? 'System Package' : 'User Installed'}</span>
            </div>
          </div>

          {/* Native 3-Button Action Strip: Open / Force Stop / Clear Cache */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-b border-slate-200 dark:border-zinc-800 py-3">
            <button
              type="button"
              onClick={() => {
                onLaunchApp(app);
                onClose();
              }}
              className="min-h-[52px] rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Open</span>
            </button>

            <button
              type="button"
              disabled={Boolean(app.isStopped)}
              onClick={() => onForceStop(app.id)}
              className={`min-h-[52px] rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                app.isStopped
                  ? 'border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{app.isStopped ? 'Stopped' : 'Force stop'}</span>
            </button>

            <button
              type="button"
              disabled={app.cacheSizeMb <= 0}
              onClick={() => onClearCache(app.id)}
              className={`min-h-[52px] rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                app.cacheSizeMb <= 0
                  ? 'border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear cache</span>
            </button>
          </div>

          {/* Storage & Cache Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <HardDrive className="w-4 h-4 text-sky-500" />
                <span>Storage & cache</span>
              </div>
              <span className="text-xs font-mono font-semibold tabular-nums">
                {formatStorageSize(totalSize)} total
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2 text-xs tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">App size (base.apk)</span>
                <span className="font-mono">{formatStorageSize(app.apkSizeMb)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">User data</span>
                <span className="font-mono">{formatStorageSize(app.dataSizeMb)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Cache</span>
                <span
                  className={`font-mono font-semibold ${
                    app.cacheSizeMb > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-500'
                  }`}
                >
                  {formatStorageSize(app.cacheSizeMb)}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Declared permissions</span>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                {app.permissions.length} granted
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
              {app.permissions.map((perm) => (
                <div
                  key={perm}
                  className="text-xs font-mono text-slate-700 dark:text-zinc-300 flex items-center justify-between py-0.5"
                >
                  <span>android.permission.{perm}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Allowed</span>
                </div>
              ))}
            </div>
          </div>

          {/* Battery & SDK Telemetry */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BatteryCharging className="w-4 h-4 text-amber-500" />
              <span>Battery & SDK target</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1.5 text-xs tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Battery usage today</span>
                <span className="font-mono">{app.batteryMahToday} mAh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Target SDK / Min SDK</span>
                <span className="font-mono">
                  API {app.targetSdk} / Min API {app.minSdk}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Total launches</span>
                <span className="font-mono">{app.launchCount} sessions</span>
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (storeAction.type === 'PLAY_STORE') {
                  onOpenStorePreview(app);
                } else {
                  onTriggerToast(
                    `Package ${app.packageName} installed via ${storeAction.installerLabel}`
                  );
                }
              }}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold">App details in store</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Installed from {storeAction.installerLabel} ({app.developer})
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
