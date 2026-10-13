import { useState } from 'react';
import { Settings as SettingsIcon, Crown, User, Bell, Shield, Palette, Database, Globe, Save } from 'lucide-react';

interface SettingsSection {
  id: string;
  label: string;
  icon: typeof User;
}

const sections: SettingsSection[] = [
  { id: 'company', label: 'Company Profile', icon: Crown },
  { id: 'account', label: 'Account Settings', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data', label: 'Data & Backup', icon: Database },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('company');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      {/* Settings Navigation */}
      <div className="space-y-1">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {activeSection === 'company' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Company Profile</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your company information and branding</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                <Crown className="h-8 w-8 text-black" />
              </div>
              <div>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">Bin Taha Associates</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Real Estate CRM System</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Company Name</label>
                <input defaultValue="Bin Taha Associates" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Tagline</label>
                <input defaultValue="Real Estate CRM System" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Contact Phone</label>
                <input defaultValue="+92 300 1234567" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Contact Email</label>
                <input defaultValue="info@bintaha.com" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Office Address</label>
                <input defaultValue="Banjara Hills, Hyderabad, Pakistan" className={inputClass} />
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl">
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        )}

        {activeSection === 'account' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal account preferences</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Display Name</label>
                <input defaultValue="Admin User" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                <input defaultValue="admin@bintaha.com" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Phone Number</label>
                <input defaultValue="+92 300 1234567" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Role</label>
                <input defaultValue="Administrator" disabled className={`${inputClass} opacity-60`} />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notification Preferences</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Control what alerts and updates you receive</p>
            </div>
            {['New lead assigned', 'Booking payment received', 'Follow-up reminder due', 'Staff activity logged', 'Project status update'].map((label) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                <ToggleSwitch />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Security Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Keep your account secure</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Current Password</label>
                <input type="password" placeholder="••••••••" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">New Password</label>
                <input type="password" placeholder="••••••••" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Confirm New Password</label>
                <input type="password" placeholder="••••••••" className={inputClass} />
              </div>
              <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl">
                <Shield className="h-4 w-4" /> Update Password
              </button>
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Appearance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Customize the look and feel of your CRM</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="cursor-pointer rounded-xl border-2 border-amber-500 bg-amber-50 p-4 dark:bg-amber-500/10">
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
                  <Crown className="h-8 w-8 text-black" />
                </div>
                <p className="text-center text-sm font-semibold text-amber-700 dark:text-amber-400">Gold & Black (Active)</p>
              </div>
              <div className="cursor-pointer rounded-xl border-2 border-slate-200 p-4 transition-colors hover:border-amber-300 dark:border-slate-700">
                <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-slate-600">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <p className="text-center text-sm font-semibold text-slate-500">Silver & Slate</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Data & Backup</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your CRM data and exports</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Export All Data</p>
                    <p className="text-xs text-slate-400">Download a complete backup of your CRM data</p>
                  </div>
                </div>
                <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Export</button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Database Status</p>
                    <p className="text-xs text-slate-400">Connected to Supabase PostgreSQL</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function ToggleSwitch() {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
