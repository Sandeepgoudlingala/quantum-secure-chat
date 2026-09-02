import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  FolderLock,
  Vault,
  Activity,
  KeyRound,
  Key,
  Lock,
  Unlock,
  User,
  UserPlus,
  Users,
  Mail,
  Search,
  Send,
  ArrowRight,
  ArrowUpRight,
  Upload,
  Download,
  RefreshCw,
  Copy,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  LogOut,
  X,
  Filter,
  Loader2,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sun,
  Moon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Terminal,
  Cpu,
  Database,
  Radio,
  Fingerprint,
  Layers,
  Share2,
  Server,
  Network
} from 'lucide-react';

/**
 * Official Lucide Icons Suite (https://lucide.dev/icons/)
 * Every icon conforms to Lucide's 24x24 grid with 2px default stroke width,
 * customizable via className, size, and strokeWidth.
 */

// Helper to wrap Lucide icons with consistent default styling
const createLucideIcon = (IconComponent, defaultStroke = 2) => {
  return function WrappedLucideIcon({ className = "w-4 h-4", strokeWidth = defaultStroke, ...props }) {
    return <IconComponent className={className} strokeWidth={strokeWidth} {...props} />;
  };
};

// Application Monogram & Core Identity (Lucide ShieldCheck + Cpu blend)
export function LogoMark({ className = "w-6 h-6", ...props }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <ShieldCheck className="w-full h-full text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" strokeWidth={2} {...props} />
    </div>
  );
}

// Navigation & Core Modules (from https://lucide.dev/icons/)
export const OverviewIcon = createLucideIcon(LayoutDashboard);
export const ChatIcon = createLucideIcon(MessageSquare);
export const VaultIcon = createLucideIcon(FolderLock);
export const AuditIcon = createLucideIcon(Activity);
export const KeyIcon = createLucideIcon(KeyRound);
export const LockIcon = createLucideIcon(Lock);
export const UnlockIcon = createLucideIcon(Unlock);

// User & Authentication
export const UserIcon = createLucideIcon(User);
export const UserPlusIcon = createLucideIcon(UserPlus);
export const UsersIcon = createLucideIcon(Users);
export const MailIcon = createLucideIcon(Mail);

// Actions & Controls
export const SearchIcon = createLucideIcon(Search);
export const SendIcon = createLucideIcon(Send);
export const ArrowRightIcon = createLucideIcon(ArrowRight);
export const ArrowUpRightIcon = createLucideIcon(ArrowUpRight);
export const UploadIcon = createLucideIcon(Upload);
export const DownloadIcon = createLucideIcon(Download);
export const RefreshIcon = createLucideIcon(RefreshCw);
export const CopyIcon = createLucideIcon(Copy);
export const CheckIcon = createLucideIcon(Check);
export const CheckCheckIcon = createLucideIcon(CheckCheck);
export const EyeIcon = createLucideIcon(Eye);
export const EyeOffIcon = createLucideIcon(EyeOff);
export const LogOutIcon = createLucideIcon(LogOut);
export const CloseIcon = createLucideIcon(X);
export const FilterIcon = createLucideIcon(Filter);

// Loaders & Layout Navigation
export function SpinnerIcon({ className = "w-4 h-4", ...props }) {
  return <Loader2 className={`animate-spin ${className}`} strokeWidth={2} {...props} />;
}
export const SidebarToggleIcon = createLucideIcon(PanelLeft);
export const ChevronLeftIcon = createLucideIcon(ChevronLeft);
export const ChevronRightIcon = createLucideIcon(ChevronRight);
export const TrashIcon = createLucideIcon(Trash2);

// Theme Toggle
export const SunIcon = createLucideIcon(Sun);
export const MoonIcon = createLucideIcon(Moon);

// Security & Cryptographic Telemetry
export const ShieldIcon = createLucideIcon(Shield);
export const ShieldCheckIcon = createLucideIcon(ShieldCheck);
export const ShieldAlertIcon = createLucideIcon(ShieldAlert);
export const SparklesIcon = createLucideIcon(Sparkles);
export const TerminalIcon = createLucideIcon(Terminal);
export const CpuIcon = createLucideIcon(Cpu);
export const DatabaseIcon = createLucideIcon(Database);
export const RadioIcon = createLucideIcon(Radio);
export const FingerprintIcon = createLucideIcon(Fingerprint);
export const LayersIcon = createLucideIcon(Layers);
export const ShareIcon = createLucideIcon(Share2);
export const ServerIcon = createLucideIcon(Server);
export const NetworkIcon = createLucideIcon(Network);

// Direct Lucide Named Exports for arbitrary component usage
export {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  FolderLock,
  Vault,
  Activity,
  KeyRound,
  Key,
  Lock,
  Unlock,
  User,
  UserPlus,
  Users,
  Mail,
  Search,
  Send,
  ArrowRight,
  ArrowUpRight,
  Upload,
  Download,
  RefreshCw,
  Copy,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  LogOut,
  X,
  Filter,
  Loader2,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sun,
  Moon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Terminal,
  Cpu,
  Database,
  Radio,
  Fingerprint,
  Layers,
  Share2,
  Server,
  Network
};


