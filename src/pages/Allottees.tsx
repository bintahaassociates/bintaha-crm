import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Phone, RefreshCw, UserCheck, MapPin, Hash } from 'lucide-react';
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
  const [allottees, setAllottees] = useState<AllotteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSociety, setSelectedSociety] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Supabase table "Allottees" se data fetch
      const { data, error } = await supabase
        .from('Allottees')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Allottees load error:', error);
      } else if (data) {
        // Automatic Deduplication logic (double entries hatane ke liye)
        const seenCodes = new Set<string>();
        const uniqueList: AllotteeItem[] = [];

        for (const item of data) {
          const rawCode = String(item['ID/Code'] || '').trim();
          const person = String(item['Contact Person / Owner'] || item['Contact Person / Owne'] || '').trim();
          
          // Agar ID/Code unique ho to duplicate filter karein
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

  // Unique society list dropdown filter ke liye
  const societies = Array.from(new Set(allottees.map((a) => a.society_block).filter(Boolean)));

  const filtered = allottees.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.contact_person.toLowerCase().includes(q) ||
      a.id_code.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.cnic.toLowerCase().includes(q);

    const matchesSociety = selectedSociety === 'all' || a.society_block === selectedSociety;
    return matchesSearch && matchesSociety;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
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
            <option value="all">All Blocks / Societies</option>
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
                    No allottees found matching your search.
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
                        <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <Phone className="h-3 w-3 text-slate-400" /> {a.phone}
                        </span>
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
              Total {filtered.length} Unique Records | Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
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
