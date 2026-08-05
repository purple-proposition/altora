import {
  Banknote,
  Bell,
  Briefcase,
  Calendar,
  CalendarClock,
  Car,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDashed,
  CircleHelp,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Folder,
  FolderOpen,
  FolderX,
  GraduationCap,
  Home,
  Hourglass,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Upload,
  UserCog,
  Users,
  X,
  type LucideProps,
} from 'lucide-react';

// Named imports (rather than `import * as icons`) so the bundler can tree-
// shake down to only the ~35 icons the site actually uses — `import *`
// pulled in lucide-react's entire icon set (1000+ components) into every
// page's client bundle, undoing the earlier perf work.
const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  banknote: Banknote,
  bell: Bell,
  briefcase: Briefcase,
  calendar: Calendar,
  'calendar-clock': CalendarClock,
  car: Car,
  'check-circle': CheckCircle,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  circle: Circle,
  'circle-dashed': CircleDashed,
  'circle-help': CircleHelp,
  download: Download,
  'external-link': ExternalLink,
  'file-check-2': FileCheck2,
  'file-text': FileText,
  folder: Folder,
  'folder-open': FolderOpen,
  'folder-x': FolderX,
  'graduation-cap': GraduationCap,
  home: Home,
  hourglass: Hourglass,
  'list-checks': ListChecks,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  'map-pin': MapPin,
  menu: Menu,
  monitor: Monitor,
  moon: Moon,
  'panel-left-close': PanelLeftClose,
  'panel-left-open': PanelLeftOpen,
  pencil: Pencil,
  plus: Plus,
  'refresh-cw': RefreshCw,
  search: Search,
  'sliders-horizontal': SlidersHorizontal,
  sparkles: Sparkles,
  sun: Sun,
  target: Target,
  'trash-2': Trash2,
  upload: Upload,
  'user-cog': UserCog,
  users: Users,
  x: X,
};

// Replaces the old <i data-lucide="..."> + lucide.createIcons() pattern
// inside React-rendered markup. That pattern had lucide mutate the DOM
// directly (swapping the <i> for a real <svg> outside React's own
// reconciliation), which crashed with "NotFoundError: The object can not be
// found here" the moment React later tried to unmount/update that node
// itself (e.g. navigating away, or Sidebar swapping its isHome/non-home
// branch) — React's fiber still pointed at a DOM node lucide had already
// detached. A real lucide-react component is rendered and owned by React
// end to end, so there is nothing left for anything else to mutate
// underneath it. (public/tracker.js keeps using data-lucide + createIcons()
// for the kanban board/calendar it builds imperatively — that markup is
// never touched by React, so no such conflict exists there.)
export default function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component {...props} />;
}
