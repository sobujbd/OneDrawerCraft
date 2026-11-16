import React from 'react';
import {
  BookOpen,
  Camera,
  Code,
  Compass,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  FileText,
  Film,
  Folder,
  Globe,
  HardDrive,
  Hash,
  Image,
  Key,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Music,
  Package,
  Play,
  Radio,
  RefreshCw,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Terminal,
  Wifi,
  Zap,
} from 'lucide-react';
import { AndroidApp, IconShape } from '../types/app';

const GLYPH_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Music,
  Terminal,
  ShieldCheck,
  Globe,
  Settings,
  Send,
  Camera,
  Play,
  FileText,
  Lock,
  MapPin,
  Cpu,
  ShoppingBag,
  HardDrive,
  Key,
  Sparkles,
  Zap,
  Database,
  Folder,
  Code,
  Film,
  RefreshCw,
  Wifi,
  Sliders,
  Package,
  Hash,
  MessageSquare,
  CreditCard,
  DollarSign,
  Image,
  Share2,
  Download,
  BookOpen,
  Radio,
  Compass,
};

interface AppIconProps {
  app: AndroidApp;
  shape: IconShape;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showInstallerDot?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  app,
  shape,
  size = 'md',
  showInstallerDot = false,
}) => {
  const GlyphComponent = GLYPH_MAP[app.iconGlyph] || Package;

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
  }[size];

  const shapeClass = {
    squircle: 'rounded-[28%]',
    circle: 'rounded-full',
    'rounded-square': 'rounded-xl',
  }[shape];

  const installerIndicator = {
    PLAY_STORE: { label: 'P', bg: 'bg-emerald-600 text-white' },
    FDROID: { label: 'F', bg: 'bg-sky-600 text-white' },
    SIDELOADED: { label: 'S', bg: 'bg-amber-600 text-white' },
    SYSTEM: { label: 'OS', bg: 'bg-slate-600 text-white' },
  }[app.installer];

  return (
    <div className="relative inline-flex shrink-0 select-none">
      <div
        className={`${sizeClasses} ${shapeClass} flex items-center justify-center shadow-sm transition-transform duration-150 group-hover:scale-105 group-active:scale-95`}
        style={{
          backgroundColor: app.iconBg,
          color: app.iconColor,
        }}
      >
        <GlyphComponent className={iconSizes} />
      </div>
      {showInstallerDot && (
        <span
          title={`Source: ${app.installer}`}
          className={`absolute -bottom-0.5 -right-0.5 px-1 min-w-[16px] h-4 rounded text-[9px] font-mono font-semibold flex items-center justify-center leading-none border border-black/30 ${installerIndicator.bg}`}
        >
          {installerIndicator.label}
        </span>
      )}
    </div>
  );
};
