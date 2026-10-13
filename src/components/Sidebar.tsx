import { LayoutDashboard, Building2, MapPin, Users, ReceiptText, HardHat, Moon, Sun, Crown, UserCog, Settings as SettingsIcon, Globe, ExternalLink, Calculator, Smartphone, Contact, Star, UserCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export type PageId = 'dashboard' | 'properties' | 'leads' | 'dealers' | 'bookings' | 'projects' | 'staff' | 'website' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'properties', label: 'Properties Hub', icon: MapPin },
  { id: 'leads', label: 'Leads Hub', icon: Users },
  { id: 'dealers', label: 'Dealers Directory', icon: UserCircle },
  { id: 'allottees', label: 'Allottees Directory', icon: UserCheck },
  { id: 'staff', label: 'Staff & Agents', icon: UserCog },
  { id: 'bookings', label: 'Bookings & Installments', icon: ReceiptText },
  { id: 'projects', label: 'Projects', icon: Building2 },
  { id: 'website', label: 'Website Management', icon: Globe },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const externalHubs = [
  { label: 'Main Web Portal', url: 'https://bintahaassociates.github.io/bintaha-main/', icon: Globe },
  { label: 'Accounting ERP', url: 'https://bintahaassociates.github.io/bintaha-acconting/', icon: Calculator },
  { label: 'Digital Business Card', url: 'https://bintahaassociates.github.io/bintaha-dc/', icon: Contact },
  { label: 'Bin Taha Mobile App', url: 'https://bintahaassociates.github.io/app/', icon: Smartphone },
  { label: 'Google Review', url: 'https://g.page/r/CWz-AXhNPX1kEBM/review', icon: Star },
];

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-black text-slate-100 transition-all duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-amber-900/30 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
          <Crown className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-amber-400">Bin Taha</h1>
          <p className="text-xs text-amber-600/70">Associates CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-amber-700/50">CRM Modules</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:bg-amber-900/10 hover:text-amber-400'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  {item.label}
                  {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-black animate-pulse" />}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-amber-700/50">External Hubs</p>
        <ul className="space-y-1">
          {externalHubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <li key={hub.url}>
                <a
                  href={hub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-amber-900/10 hover:text-amber-400"
                >
                  <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
                  {hub.label}
                  <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-600 transition-colors group-hover:text-amber-500" />
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Theme Toggle + Footer */}
      <div className="border-t border-amber-900/30 p-4">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-amber-900/10 hover:text-amber-400"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-amber-900/10 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-black">
            AD
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-amber-400">Admin User</p>
            <p className="truncate text-xs text-amber-700/60">admin@bintaha.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
