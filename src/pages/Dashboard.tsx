import { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  Wrench, 
  Smartphone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Globe, 
  ExternalLink, 
  Layers, 
  Phone, 
  TrendingUp, 
  RefreshCw,
  UserCheck,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'stream' | 'ecosystem'>('overview');
  const [loading, setLoading] = useState(true);

  // Live Counts & Data
  const [counts, setCounts] = useState({
    properties: 0,
    leads: 0,
    services: 0,
    dealers: 0,
    allottees: 0,
    webInquiries: 0,
    pendingServices: 0,
    completedServices: 0,
  });

  const [societyChartData, setSocietyChartData] = useState<{ label: string; value: number }[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch exact total counts from all operational tables in parallel
      const [
        propsCountRes,
        leadsCountRes,
        servicesCountRes,
        dealersCountRes,
        allotteesCountRes,
        webCountRes,
        servicesDataRes,
        recentLeadsRes,
        propsSampleRes
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('dc_card').select('*', { count: 'exact', head: true }),
        supabase.from('Services').select('*', { count: 'exact', head: true }),
        supabase.from('Dealers').select('*', { count: 'exact', head: true }),
        supabase.from('Allottees').select('*', { count: 'exact', head: true }),
        supabase.from('Web_Clients').select('*', { count: 'exact', head: true }),
        supabase.from('Services').select('*').order('id', { ascending: false }).limit(6),
        supabase.from('dc_card').select('*').order('id', { ascending: false }).limit(6),
        supabase.from('properties').select('Society').limit(500),
      ]);

      const srvList = servicesDataRes.data || [];
      const pendingSrv = srvList.filter((s: any) => String(s.Status).toLowerCase() === 'pending').length;
      const completedSrv = srvList.filter((s: any) => String(s.Status).toLowerCase() === 'completed').length;

      setCounts({
        properties: propsCountRes.count || 0,
        leads: leadsCountRes.count || 0,
        services: servicesCountRes.count || 0,
        dealers: dealersCountRes.count || 0,
        allottees: allotteesCountRes.count || 0,
        webInquiries: webCountRes.count || 0,
        pendingServices: pendingSrv,
        completedServices: completedSrv,
      });

      setRecentServices(srvList);
      setRecentLeads(recentLeadsRes.data || []);

      // Calculate Society Distribution
      if (propsSampleRes.data) {
        const countsBySoc: Record<string, number> = {};
        for (const row of propsSampleRes.data) {
          const soc = row.Society ? String(row.Society).trim() : 'Other';
          countsBySoc[soc] = (countsBySoc[soc] || 0) + 1;
        }

        const sortedSoc = Object.entries(countsBySoc)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([label, value]) => ({ label, value }));

        setSocietyChartData(sortedSoc);
      }
    } catch (err) {
      console.error('Failed to load full dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Status Pie Data
  const servicePieData = [
    { label: 'Pending', value: Math.max(counts.pendingServices, 1), color: '#f59e0b' },
    { label: 'Completed', value: Math.max(counts.completedServices, 1), color: '#10b981' },
    { label: 'Total Services', value: counts.services || 1, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Properties Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Live Properties</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
              {loading ? '...' : counts.properties.toLocaleString()}
            </p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Live Verified Inventory
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Inquiries & Leads Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Client Inquiries & Leads</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {loading ? '...' : (counts.leads + counts.webInquiries).toLocaleString()}
            </p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {counts.leads} Digital Card | {counts.webInquiries} Web
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Smartphone className="h-6 w-6" />
          </div>
        </div>

        {/* Services Operations Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Service Requests</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? '...' : counts.services.toLocaleString()}
            </p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Construction & Clearances
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Wrench className="h-6 w-6" />
          </div>
        </div>

        {/* Dealers & Allottees Network Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Network & Allottees</p>
            <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {loading ? '...' : (counts.dealers + counts.allottees).toLocaleString()}
            </p>
            <span className="mt-1 inline-block text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              {counts.dealers} Dealers | {counts.allottees} Owners
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Executive Overview
        </button>

        <button
          onClick={() => setActiveTab('stream')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'stream'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" /> Live Operations Stream
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            {recentLeads.length + recentServices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ecosystem')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'ecosystem'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Globe className="h-4 w-4" /> Official Ecosystem
        </button>

        <button
          onClick={loadDashboardData}
          title="Reload Dashboard"
          className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> ریفریش ڈیٹا
        </button>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Society Inventory Bar Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Inventory Distribution by Society</h3>
                  <p className="text-xs text-slate-400">LDA Avenue 1, DHA, and key projects volume</p>
                </div>
                <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  Top Societies
                </span>
              </div>
              <BarChart data={societyChartData} />
            </div>

            {/* Service & Operational Distribution Pie */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Service Pipeline Status</h3>
                <p className="text-xs text-slate-400">Current work orders and clearance requests</p>
              </div>
              <PieChart data={servicePieData} />
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="text-center">
                  <p className="text-xs text-slate-400">Pending</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{counts.pendingServices}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{counts.completedServices}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE OPERATIONS STREAM */}
      {activeTab === 'stream' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Latest Direct Inquiries */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Leads & NFC Visits</h3>
              <span className="text-xs text-slate-400">Digital Card Leads</span>
            </div>
            <div className="space-y-3">
              {recentLeads.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.Name || 'Digital Card Visitor'}</p>
                    <p className="text-xs text-slate-400">{item.Service || 'Profile Visit'} | Budget: {item.Budget || '-'}</p>
                  </div>
                  {item.Phone && item.Phone !== '-' && (
                    <a
                      href={`https://wa.me/${item.Phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-600"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Latest Service Requests */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Service Requests</h3>
              <span className="text-xs text-slate-400">Operations Hub</span>
            </div>
            <div className="space-y-3">
              {recentServices.map((srv, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{srv.Name}</p>
                    <p className="text-xs text-slate-400">{srv.Subject} - {srv.Date}</p>
                  </div>
                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    {srv.Status || 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OFFICIAL ECOSYSTEM */}
      {activeTab === 'ecosystem' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="https://bintahaassociates.github.io/bintaha-main/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <Globe className="h-6 w-6 text-amber-500" />
            <h4 className="mt-3 font-bold text-slate-800 dark:text-slate-100">Main Web Portal</h4>
            <p className="mt-1 text-xs text-slate-400">Public listings, inquiries & company info</p>
          </a>

          <a
            href="https://bintahaassociates.github.io/bintaha-dc/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <Smartphone className="h-6 w-6 text-emerald-500" />
            <h4 className="mt-3 font-bold text-slate-800 dark:text-slate-100">Digital Business Card</h4>
            <p className="mt-1 text-xs text-slate-400">NFC profile & direct customer intake</p>
          </a>

          <a
            href="https://bintahaassociates.github.io/bintaha-acconting/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <DollarSign className="h-6 w-6 text-blue-500" />
            <h4 className="mt-3 font-bold text-slate-800 dark:text-slate-100">Accounting ERP</h4>
            <p className="mt-1 text-xs text-slate-400">Ledgers, cashbook & business finances</p>
          </a>

          <a
            href="https://bintahaassociates.github.io/app/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <Building2 className="h-6 w-6 text-purple-500" />
            <h4 className="mt-3 font-bold text-slate-800 dark:text-slate-100">Bin Taha Mobile App</h4>
            <p className="mt-1 text-xs text-slate-400">Mobile client app & on-the-go tools</p>
          </a>
        </div>
      )}
    </div>
  );
}
