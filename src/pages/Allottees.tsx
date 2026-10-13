import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  RefreshCw, 
  UserCheck, 
  MapPin, 
  Hash,
  Users,
  Building,
  IdCard,
  Layers,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AllotteeItem {
  id: string | number;
  id_code: string;
  name_entity: string;
  contact_person: string;
  phone: string;
  society_block: string;
  cnic: string;
  address: string;
}

const ITEMS_PER_PAGE = 30;

export default function Allottees() {
  const [activeTab, setActiveTab] = useState<'all' | 'lda' | 'contacts'>('all');
  const [allottees, setAllottees] = useState<AllotteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSociety, setSelectedSociety] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Allottees')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Allottees load error:', error);
      } else if (data) {
        const seenCodes = new Set<string>();
        const uniqueList: AllotteeItem[] = [];

        for (const item of data) {
          const rawCode = String(item['ID/Code'] || '').trim();
          const person = String(item['Contact Person / Owner'] || item['Contact Person / Owne'] || '').trim();
          const uniqueKey = rawCode ? rawCode : `${person}_${item.id}`;

          if (!seenCodes.has(uniqueKey)) {
            seenCodes.add(uniqueKey);
            uniqueList.push({
              id: item.id,
              id_code: rawCode || '-',
              name_entity: item['Name/Entity'] || '',
              contact_person: person || 'Unknown',
              phone: item['Phone / What'] || item['Phone / Whats'] || '-',
              society_block: item['Sorting / Society / Speciali'] || item['Sorting / Society / Special'] || 'LDA Avenue 1',
              cnic: item.CNIC || '-',
              address: item.Address || '-',
            });
          }
        }

        setAllottees(uniqueList);
      }
    } catch (err) {
      console.error('Failed to load allottees:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics Calculation
  const totalCount = allottees.length;
  const ldaCount = allottees.filter((a) => a.society_block.toLowerCase().includes('lda')).length;
  const withPhoneCount = allottees.filter((a) => a.phone && a.phone !== '-').length;
  const withCnicCount = allottees.filter((a) => a.cnic && a.cnic !== '-').length;

  const societies = Array.from(new Set(allottees.map((a) => a.society_block).filter(Boolean)));

  const filtered = allottees.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.contact_person.toLowerCase().includes(q) ||
      a.id_code.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.cnic.toLowerCase().includes(q) ||
      a.society_block.toLowerCase().includes(q);

    const matchesSociety = selectedSociety === 'all' || a.society_block === selectedSociety;

    let matchesTab = true;
    if (activeTab === 'lda') {
      matchesTab = a.society_block.toLowerCase().includes('lda');
    } else if (activeTab === 'contacts') {
      matchesTab = Boolean(a.phone && a.phone !== '-');
    }

    return matchesSearch && matchesSociety && matchesTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Unique Records */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Verified Records</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{totalCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* LDA Avenue 1 Records */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">LDA Avenue 1 Owners</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{ldaCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Building className="h-5 w-5" />
          </div>
        </div>

        {/* Active Phone Contacts */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Direct Phone Numbers</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{withPhoneCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Phone className="h-5 w-5" />
          </div>
        </div>

        {/* Verified CNIC Records */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Verified CNIC Records</p>
            <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{withCnicCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <IdCard className="h-5 w-5" />
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
          <Layers className="h-4 w-4" /> All Allottees
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('lda');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'lda'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Building className="h-4 w-4" /> LDA Avenue 1
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
            {ldaCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('contacts');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'contacts'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Phone className="h-4 w-4" /> With Contact Numbers
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400">
            {withPhoneCount}
          </span>
        </button>

        <a
          href="https://bintahaassociates.github.io/bintaha-main/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Official Ecosystem
        </a>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plot code [LDA-1], owner name, phone, CNIC..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>

          <select
            value={selectedSociety}
            onChange={(e) => {
              setSelectedSociety(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">تمام بلاکس و سوسائٹیز (All Blocks)</option>
            {societies.map((soc) => (
              <option key={soc} value={soc}>
                {soc}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            title="Reload Data"
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
                <th className="px-4 py-3">Sr</th>
                <th className="px-4 py-3">Plot ID / Code</th>
                <th className="px-4 py-3">Allottee / Owner Name</th>
                <th className="px-4 py-3">Contact Number</th>
                <th className="px-4 py-3">Society / Block</th>
                <th className="px-4 py-3">CNIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    <p className="mt-2 text-xs text-slate-400">Loading Allottees Data (Filtering duplicates)...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    کوئی ریکارڈ نہیں ملا۔
                  </td>
                </tr>
              ) : (
                paginated.map((a, idx) => {
                  const rowNum = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{rowNum}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Hash className="h-3 w-3" /> {a.id_code}
                        </span>
                        {a.name_entity && <p className="text-[11px] text-slate-400">{a.name_entity}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <UserCheck className="h-4 w-4 text-slate-400" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{a.contact_person}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                            <Phone className="h-3 w-3 text-slate-400" /> {a.phone}
                          </span>
                          {a.phone && a.phone !== '-' && (
                            <a
                              href={`https://wa.me/${a.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-600"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <MapPin className="h-3 w-3 text-slate-400" /> {a.society_block}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{a.cnic}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination Bar */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              کل {filtered.length} تصدیق شدہ ریکارڈز | دکھائے جا رہے ہیں {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
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
    </div>
  );
}
