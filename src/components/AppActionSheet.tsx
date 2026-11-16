import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  EyeOff,
  Info,
  Layers,
  Play,
  Share2,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { AndroidApp, ExportedActivity, IconShape } from '../types/app';
import {
  formatRelativeTime,
  formatStorageSize,
  getSmartStoreAction,
  getTotalAppSizeMb,
} from '../utils/launcherLogic';
import { AppIcon } from './AppIcon';

interface AppActionSheetProps {
  app: AndroidApp | null;
  iconShape: IconShape;
  onClose: () => void;
  onLaunchApp: (app: AndroidApp, activity?: ExportedActivity) => void;
  onToggleFavorite: (appId: string) => void;
  onToggleVault: (appId: string) => void;
  onOpenAppInfo: (app: AndroidApp) => void;
  onOpenPlayStorePreview: (app: AndroidApp) => void;
  onTriggerToast: (message: string) => void;
}

export const AppActionSheet: React.FC<AppActionSheetProps> = ({
  app,
  iconShape,
  onClose,
  onLaunchApp,
  onToggleFavorite,
  onToggleVault,
  onOpenAppInfo,
  onOpenPlayStorePreview,
  onTriggerToast,
}) => {
  const [showActivities, setShowActivities] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copiedPkg, setCopiedPkg] = useState(false);

  if (!app) return null;

  const storeAction = getSmartStoreAction(app);
  const totalSize = formatStorageSize(getTotalAppSizeMb(app));

  const handleCopyPackage = () => {
    navigator.clipboard?.writeText(app.packageName).catch(() => {});
    setCopiedPkg(true);
    onTriggerToast(`Copied package ID: ${app.packageName}`);
    setTimeout(() => setCopiedPkg(false), 1800);
  };

  const handleSmartStoreClick = () => {
    if (storeAction.type === 'PLAY_STORE') {
      onOpenPlayStorePreview(app);
    } else {
      onTriggerToast(
        `Extracted ${app.packageName}_v${app.versionName}.apk (${app.apkSizeMb} MB) to /Download/OneDrawer/`
      );
      onClose();
    }
  };

  const handleCopyShareSpec = (mode: 'URL' | 'CARD' | 'APK') => {
    if (mode === 'URL') {
      navigator.clipboard?.writeText(storeAction.url).catch(() => {});
      onTriggerToast(`Copied link: ${storeAction.url}`);
    } else if (mode === 'CARD') {
      const spec = `${app.name} (${app.packageName})\nVersion: ${app.versionName} (${app.versionCode})\nSource: ${storeAction.installerLabel}\nSize: ${totalSize} | Target SDK: API ${app.targetSdk}\nLink: ${storeAction.url}`;
      navigator.clipboard?.writeText(spec).catch(() => {});
      onTriggerToast(`Copied formatted App Spec Card for ${app.name}`);
    } else {
      onTriggerToast(`Shared base.apk (${app.apkSizeMb} MB) via Android Nearby Share`);
    }
    setShowSharePanel(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label={`${app.name} Quick Actions`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-5 shadow-2xl max-h-[88vh] overflow-y-auto thin-scrollbar text-slate-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

        {/* App Metadata Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <AppIcon app={app} shape={iconShape} size="lg" showInstallerDot />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold truncate">{app.name}</h3>
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono shrink-0">
                  v{app.versionName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyPackage}
                className="group flex items-center gap-1.5 text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline mt-0.5 text-left truncate max-w-full"
                title="Tap to copy package name"
              >
                <span className="truncate">{app.packageName}</span>
                {copiedPkg ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 opacity-70 group-hover:opacity-100 shrink-0" />
                )}
              </button>

              {/* Unboxed clean metadata with middot separators */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
                <span>{storeAction.installerLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{totalSize}</span>
                <span aria-hidden="true">·</span>
                <span>API {app.targetSdk}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRelativeTime(app.lastOpenedAt)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close action sheet"
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Launch & Favorite Row */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <button
            type="button"
            onClick={() => {
              onLaunchApp(app);
              onClose();
            }}
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch App</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(app.id)}
            className={`min-h-[46px] px-4 py-2.5 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              app.isFavorite
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Star className={`w-4 h-4 ${app.isFavorite ? 'fill-current' : ''}`} />
            <span>{app.isFavorite ? 'Pinned Favorite' : 'Pin to Favorites'}</span>
          </button>
        </div>

        {/* Action List */}
        <div className="space-y-1.5">
          {/* Context-Aware Smart Store / APK Action */}
          <button
            type="button"
            onClick={handleSmartStoreClick}
            className="w-full min-h-[52px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  storeAction.type === 'PLAY_STORE'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {storeAction.type === 'PLAY_STORE' ? (
                  <ShoppingBag className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{storeAction.primaryLabel}</div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                  {storeAction.secondaryLabel}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Open Android System App Info */}
          <button
            type="button"
            onClick={() => {
              onOpenAppInfo(app);
              onClose();
            }}
            className="w-full min-h-[52px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Open Android App Info</div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                  ACTION_APPLICATION_DETAILS_SETTINGS
                </div>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">Inspect</span>
          </button>

          {/* Expandable Exported Sub-Activities Launcher */}
          <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowActivities((v) => !v)}
              aria-expanded={showActivities}
              className="w-full min-h-[52px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    Launch Exported Activity ({app.exportedActivities.length})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Bypass splash screen and jump directly into internal screens
                  </div>
                </div>
              </div>
              {showActivities ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {showActivities && (
              <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-slate-200/60 dark:border-zinc-800">
                {app.exportedActivities.map((act) => (
                  <button
                    key={act.className}
                    type="button"
                    onClick={() => {
                      onLaunchApp(app, act);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-sky-50 dark:hover:bg-zinc-800/90 border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                        {act.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                        {act.className}
                      </div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share App Drawer */}
          <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSharePanel((v) => !v)}
              aria-expanded={showSharePanel}
              className="w-full min-h-[52px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Share App</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Copy Play Store URL, App Spec Card, or send base.apk
                  </div>
                </div>
              </div>
              {showSharePanel ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {showSharePanel && (
              <div className="px-3 pb-3 pt-1 grid grid-cols-3 gap-2 border-t border-slate-200/60 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleCopyShareSpec('URL')}
                  className="min-h-[44px] px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-center cursor-pointer"
                >
                  Copy Store Link
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyShareSpec('CARD')}
                  className="min-h-[44px] px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-center cursor-pointer"
                >
                  Copy Spec Card
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyShareSpec('APK')}
                  className="min-h-[44px] px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-center cursor-pointer"
                >
                  Export .APK
                </button>
              </div>
            )}
          </div>

          {/* Hide / Unhide in Vault */}
          <button
            type="button"
            onClick={() => {
              onToggleVault(app.id);
              onClose();
            }}
            className="w-full min-h-[48px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {app.isHiddenInVault ? 'Restore from Hidden Vault' : 'Hide in Biometric Vault'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {app.isHiddenInVault
                    ? 'Make visible again in standard app drawer lists'
                    : 'Conceal from main drawer behind PIN / Biometric lock'}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
