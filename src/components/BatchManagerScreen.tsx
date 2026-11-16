import React, { useState } from 'react';
import {
  CheckSquare,
  Copy,
  FileCode2,
  FileText,
  Share2,
  Square,
  Star,
} from 'lucide-react';
import { AndroidApp, IconShape } from '../types/app';
import {
  formatBatchMarkdownTable,
  formatBatchShareLinks,
  formatStorageSize,
  getTotalAppSizeMb,
} from '../utils/launcherLogic';
import { AppIcon } from './AppIcon';

interface BatchManagerScreenProps {
  apps: AndroidApp[];
  iconShape: IconShape;
  onBatchPinFavorites: (appIds: string[], pin: boolean) => void;
  onTriggerToast: (msg: string) => void;
}

export const BatchManagerScreen: React.FC<BatchManagerScreenProps> = ({
  apps,
  iconShape,
  onBatchPinFavorites,
  onTriggerToast,
}) => {
  const visibleApps = apps.filter((a) => !a.isHiddenInVault);
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'whatsapp',
    'spotify',
    'termux',
    'shizuku',
    'firefox',
  ]);
  const [exportPreview, setExportPreview] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllUserApps = () => {
    setSelectedIds(visibleApps.filter((a) => !a.isSystem).map((a) => a.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setExportPreview(null);
  };

  const selectedApps = visibleApps.filter((a) => selectedIds.includes(a.id));

  const handleBatchSharePlayLinks = () => {
    if (selectedApps.length === 0) return;
    const text = formatBatchShareLinks(selectedApps);
    navigator.clipboard?.writeText(text).catch(() => {});
    setExportPreview({
      title: `Batch Share Links (${selectedApps.length} Apps)`,
      content: text,
    });
    onTriggerToast(`Copied ${selectedApps.length} app links to clipboard`);
  };

  const handleExportMarkdown = () => {
    if (selectedApps.length === 0) return;
    const md = formatBatchMarkdownTable(selectedApps);
    navigator.clipboard?.writeText(md).catch(() => {});
    setExportPreview({
      title: `Markdown Inventory (${selectedApps.length} Apps)`,
      content: md,
    });
    onTriggerToast(`Copied Markdown table for ${selectedApps.length} apps`);
  };

  const handleExportJson = () => {
    if (selectedApps.length === 0) return;
    const json = JSON.stringify(
      selectedApps.map((a) => ({
        name: a.name,
        packageName: a.packageName,
        versionName: a.versionName,
        installer: a.installer,
        targetSdk: a.targetSdk,
        totalSizeMb: getTotalAppSizeMb(a),
      })),
      null,
      2
    );
    navigator.clipboard?.writeText(json).catch(() => {});
    setExportPreview({
      title: `JSON Package Manifest (${selectedApps.length} Apps)`,
      content: json,
    });
    onTriggerToast(`Copied JSON manifest for ${selectedApps.length} apps`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Batch Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Batch Manager & Export</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {selectedIds.length} of {visibleApps.length} packages selected
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={selectAllUserApps}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Select User Apps
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-medium transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Batch Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleBatchSharePlayLinks}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Links</span>
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => onBatchPinFavorites(selectedIds, true)}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Pin Favorites</span>
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleExportMarkdown}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Markdown</span>
          </button>

          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={handleExportJson}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 text-violet-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Live Export Preview Box (if active) */}
      {exportPreview && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-slate-900 text-zinc-100 border border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-sky-400">{exportPreview.title}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(exportPreview.content).catch(() => {});
                  onTriggerToast('Copied export output to clipboard');
                }}
                className="text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button
                type="button"
                onClick={() => setExportPreview(null)}
                className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
          <pre className="text-[10px] font-mono text-zinc-300 max-h-28 overflow-y-auto thin-scrollbar whitespace-pre-wrap">
            {exportPreview.content}
          </pre>
        </div>
      )}

      {/* Multi-Select App List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 thin-scrollbar">
        {visibleApps.map((app) => {
          const isChecked = selectedIds.includes(app.id);
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => toggleSelect(app.id)}
              className={`w-full min-h-[54px] px-3 py-2 rounded-2xl border flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                isChecked
                  ? 'bg-sky-500/10 border-sky-500/40'
                  : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200/70 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-sky-500 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <AppIcon app={app} shape={iconShape} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{app.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                    {app.packageName}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 tabular-nums">
                <div className="text-[11px] font-mono font-medium">
                  {formatStorageSize(getTotalAppSizeMb(app))}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {app.installer}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
