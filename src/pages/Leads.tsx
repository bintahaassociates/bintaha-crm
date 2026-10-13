import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  Phone, 
  MapPin, 
  CreditCard, 
  Tag, 
  DollarSign, 
  Calendar, 
  Eye, 
  MessageSquare, 
  X,
  Users,
  Smartphone,
  TrendingUp,
  ExternalLink,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LeadItem {
  id: string | number;
  date: string;
  name: string;
  phone: string;
  cnic: string;
  address: string;
  service: string;
  budget: string;
  details: string;
  isTapOnly: boolean;
}

const ITEMS_PER_PAGE = 25;

export default function Leads() {
  const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'taps'>('all');
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeLead, setActiveLead] = useState<LeadItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dc_card')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error loading dc_card data:', error);
      } else if (data) {
        const mapped: LeadItem[] = data.map((d: any) => {
          const rawPhone = d.Phone || d.phone || '';
          const isTap = String(rawPhone).includes('Card Tap') || (!d.Name && !d.Phone);

          return {
            id: d.id,
            date: d.Date || d.created_at?.slice(0, 10) || '-',
            name: d.Name || (isTap ? 'Digital Card Visitor (NFC Tap)' : 'Direct Lead'),
            phone: rawPhone || '-',
            cnic: d.CNIC || '-',
            address: d.ADRESS || d.Address || '-',
            service: d.Service || (isTap ? 'Profile Visit' : 'Inquiry'),
            budget: d.Budget || '-',
            details: d.Details || '',
            isTapOnly: isTap,
          };
        });
        setLeads(mapped);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics Calculation
  const totalInteractions = leads.length;
  const verifiedLeadsCount = leads.filter((item) => !item.isTapOnly).length;
  const cardTapsCount = leads.filter((item) => item.isTapOnly).length;
  const highBudgetCount = leads.filter((item) => item.budget && item.budget !== '-' && item.budget !== 'NULL').length;

  const filtered = leads.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      item.service.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q);

    let matchTab = true;
    if (activeTab === 'leads') {
      matchTab = !item.isTapOnly;
    } else if (activeTab === 'taps') {
      matchTab = item.isTapOnly;
    }

    return matchSearch && matchTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Interactions */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Card Taps & Leads</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{totalInteractions}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>

        {/* Direct Client Inquiries */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Direct Client Leads</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{verifiedLeadsCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* NFC Visitors */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">NFC Profile Visitors</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{cardTapsCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        {/* High Budget Inquiries */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Budgeted Inquiries</p>
            <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{highBudgetCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('all');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'all'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" /> All Activity
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            {totalInteractions}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('leads');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'leads'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Users className="h-4 w-4" /> Client Inquiries
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
            {verifiedLeadsCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('taps');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'taps'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard className="h-4 w-4" /> NFC Card Visitors
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {cardTapsCount}
          </span>
        </button>

        <a
          href="https://bintahaassociates.github.io/bintaha-dc/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Live Digital Card
        </a>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, phone, service, budget..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>

          <button
            onClick={loadData}
            title="ریفریش کریں"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">تاریخ</th>
                <th className="px-4 py-3">نام / نوعیت</th>
                <th className="px-4 py-3">رابطہ فون</th>
                <th className="px-4 py-3">سروس کی ڈیمانڈ</th>
                <th className="px-4 py-3">بجٹ</th>
                <th className="px-4 py-3">ایڈریس / تفصیل</th>
                <th className="px-4 py-3 text-center">ایکشن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    <p className="mt-2 text-xs text-slate-400">ڈیجیٹل کارڈ سے لیڈز لوڈ ہو رہی ہیں...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    کوئی ریکارڈ نہیں ملا۔
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {item.date}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.isTapOnly ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <CreditCard className="h-3 w-3 text-slate-400" /> کارڈ وزٹ
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.phone && item.phone !== '-' && !item.isTapOnly ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <Phone className="h-3 w-3" /> {item.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <Tag className="h-3 w-3" /> {item.service}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.budget && item.budget !== '-' && item.budget !== 'NULL' ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.budget}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={item.details || item.address}>
                      {item.details || item.address}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setActiveLead(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-500 hover:text-black dark:bg-amber-400/20 dark:text-amber-300"
                      >
                        <Eye className="h-3.5 w-3.5" /> تفصیل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              کل {filtered.length} اینٹریز | دکھائے جا رہے ہیں {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-amber-500/30 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-amber-500/10 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-amber-400">ڈیجیٹل کارڈ انکوائری تفصیل</h3>
              <button
                onClick={() => setActiveLead(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400">کلائنٹ کا نام</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{activeLead.name}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400">فون نمبر</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold text-amber-600 dark:text-amber-400">{activeLead.phone}</p>
                    {activeLead.phone && activeLead.phone !== '-' && (
                      <a
                        href={`https://wa.me/${activeLead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-600"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400">ڈیمانڈ / سروس</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{activeLead.service}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400">بجٹ</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{activeLead.budget}</p>
                </div>
              </div>

              {activeLead.cnic && activeLead.cnic !== '-' && activeLead.cnic !== 'NULL' && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400">شناختی کارڈ نمبر (CNIC)</p>
                  <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{activeLead.cnic}</p>
                </div>
              )}

              {activeLead.address && activeLead.address !== '-' && activeLead.address !== 'NULL' && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-400">ایڈریس</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{activeLead.address}</p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  انکوائری تفصیلات / میسج:
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  {activeLead.details || 'کوئی اضافی تفصیل درج نہیں ہے۔'}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => setActiveLead(null)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
