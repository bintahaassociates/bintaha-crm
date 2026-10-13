import { type ReactNode } from 'react';
import Sidebar, { type PageId } from './Sidebar';
export type { PageId };
import { Bell, Search, RefreshCw } from 'lucide-react';
import { useSyncState } from '@/lib/sync';

interface LayoutProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function Layout({ currentPage, onPageChange, title, subtitle, children, actions }: LayoutProps) {
  const { syncing, doSync } = useSyncState();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />

      <div className="ml-64 transition-all duration-300">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 border-b border-amber-200/50 bg-white/90 backdrop-blur-lg dark:border-amber-900/30 dark:bg-black/80">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-amber-400">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              {actions}
              <button
                onClick={doSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
                title="Sync data from server"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:w-64 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-amber-900/30 dark:bg-slate-900 dark:text-slate-300"
                />
              </div>
              <button className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-400">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-black animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
