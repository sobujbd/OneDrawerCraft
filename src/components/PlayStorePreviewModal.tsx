import React from 'react';
import { CheckCircle2, ExternalLink, Play, ShieldCheck, Star, X } from 'lucide-react';
import { AndroidApp, IconShape } from '../types/app';
import { formatStorageSize, getSmartStoreAction } from '../utils/launcherLogic';
import { AppIcon } from './AppIcon';

interface PlayStorePreviewModalProps {
  app: AndroidApp | null;
  iconShape: IconShape;
  onClose: () => void;
  onLaunchApp: (app: AndroidApp) => void;
}

export const PlayStorePreviewModal: React.FC<PlayStorePreviewModalProps> = ({
  app,
  iconShape,
  onClose,
  onLaunchApp,
}) => {
  if (!app) return null;

  const storeAction = getSmartStoreAction(app);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Google Play Store listing for ${app.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 shadow-2xl text-slate-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              Google Play Store
            </span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              Verified Installer
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Play Store modal"
            className="min-w-[40px] min-h-[40px] -mr-2 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 my-4">
          <AppIcon app={app} shape={iconShape} size="xl" />
          <div className="min-w-0">
            <h3 className="text-lg font-bold truncate">{app.name}</h3>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {app.developer}
            </p>
            <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate mt-0.5">
              {app.packageName}
            </p>
          </div>
        </div>

        {/* Store Metrics Strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-zinc-800 py-3 my-3 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl text-center tabular-nums">
          <div>
            <div className="text-sm font-bold flex items-center justify-center gap-1">
              <span>{app.storeRating ?? '4.6'}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Rating</div>
          </div>
          <div>
            <div className="text-sm font-bold">{app.storeDownloads ?? '10M+'}</div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Downloads</div>
          </div>
          <div>
            <div className="text-sm font-bold">{formatStorageSize(app.apkSizeMb)}</div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">APK Size</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Verified by Play Protect · v{app.versionName} (API {app.targetSdk})</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={storeAction.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Web Play Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => {
              onLaunchApp(app);
              onClose();
            }}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Open Installed App</span>
          </button>
        </div>

        <div className="mt-3 text-[10px] font-mono text-slate-400 dark:text-zinc-500 flex items-center justify-between">
          <span>Intent: {storeAction.marketUri}</span>
          <span className="flex items-center gap-1 text-emerald-500">
            <CheckCircle2 className="w-3 h-3" /> Up to date
          </span>
        </div>
      </div>
    </div>
  );
};
