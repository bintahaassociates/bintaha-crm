import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Phone, MapPin, RefreshCw, Tag, Eye, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PropertyItem {
  id: string | number;
  prop_id: string;
  title: string;
  type: string;
  society: string;
  price: string;
  phone: string;
  description: string;
  original_dealer_name?: string;
  original_dealer_phone?: string;
  full_description?: string;
}

const ITEMS_PER_PAGE = 25;

export default function Properties() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSociety, setSelectedSociety] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activePrivateModal, setActivePrivateModal] = useState<PropertyItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Properties ٹیبل سے ڈیٹا حاصل کریں
      const propsRes = await supabase
        .from('properties')
        .select('*')
        .order('id', { ascending: false });

      // 2. Private CRM ٹیبل سے ڈیٹا حاصل کریں
      const privRes = await supabase
        .from('private_crm')
        .select('*');

      console.log('Props count:', propsRes.data?.length);
      console.log('Private count:', privRes.data?.length);

      // Private CRM کا آسان میپ بنائیں
      const privateMap = new Map<string, any>();
      if (privRes.data) {
        for (const item of privRes.data) {
          // ID کو ہر ممکن طریقے سے کی (Key) بنائیں
          const rawId = String(item.ID ?? item.id ?? '').trim();
          const cleanTitle = String(item.Title ?? item.title ?? '').trim().toLowerCase();
          
          if (rawId) privateMap.set(rawId, item);
          if (cleanTitle) privateMap.set(cleanTitle, item);
        }
      }

      if (propsRes.data) {
        const mapped: PropertyItem[] = propsRes.data.map((p: any) => {
          const pId = String(p.ID ?? p.id ?? '').trim();
          const pTitle = String(p.Title ?? p.title ?? '').trim().toLowerCase();

          // پہلے ID سے تلاش کریں، نہ ملے تو Title سے
          const priv = privateMap.get(pId) || privateMap.get(pTitle) || {};

          // نام، فون اور میسج تمام ممکنہ کالمز سے نکالیں
          const origName = 
            priv['Original Dealer Name'] || 
            priv['Original Dealer'] || 
            priv['Original De'] || 
            p['Original Dealer Name'] || 
            p['original_dealer_name'] || 
            '';

          const origPhone = 
            priv['Original Dealer Phone'] || 
            priv['Original Phone'] || 
            priv['Original De'] || 
            p['Original Dealer Phone'] || 
            p['original_dealer_phone'] || 
            '';

          const fullMsg = 
            priv['Full Description'] || 
            priv['Full Descri'] || 
            priv['description'] || 
            p['Full Description'] || 
            p['Description'] || 
            p['description'] || 
            '';

          return {
            id: p.id,
            prop_id: p.ID || p.id || '-',
            title: p.Title || p.title || 'Untitled Property',
            type: p.Type || p.type || 'Plot',
            society: p.Society || p.society || 'Lahore',
            price: p.Price || p.price || '-',
            phone: p.Phone || p.phone || '-',
            description: p.Description || p.description || '',
            original_dealer_name: origName.trim() || undefined,
            original_dealer_phone: origPhone.trim() || undefined,
            full_description: fullMsg.trim() || undefined,
          };
        });

        setProperties(mapped);
      }
    } catch (err) {
      console.error('Error fetching properties or private_crm:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const societies = Array.from(new Set(properties.map((p) => p.society).filter(Boolean)));

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      p.society.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      String(p.prop_id).toLowerCase().includes(q) ||
      (p.original_dealer_name && p.original_dealer_name.toLowerCase().includes(q)) ||
      (p.original_dealer_phone && p.original_dealer_phone.toLowerCase().includes(q)) ||
      (p.full_description && p.full_description.toLowerCase().includes(q));

    const matchesSociety = selectedSociety === 'all' || p.society === selectedSociety;
    return matchesSearch && matchesSociety;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, society, private owner, or full msg..."
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
            <option value="all">تمام سوسائٹیز (All Societies)</option>
            {societies.map((soc) => (
              <option key={soc} value={soc}>
                {soc}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            title="Reload Properties & Private Msg"
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
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Property Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Society</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Display Contact</th>
                <th className="px-4 py-3 text-center">Private CRM Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    <p className="mt-2 text-xs text-slate-400">Loading Properties & Matching Private CRM Messages...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    No properties found.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const hasPrivate = Boolean(p.original_dealer_name || p.original_dealer_phone || p.full_description);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.prop_id}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          <Tag className="h-3 w-3" /> {p.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <MapPin className="h-3 w-3 text-slate-400" /> {p.society}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">{p.price}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <Phone className="h-3 w-3 text-slate-400" /> {p.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setActivePrivateModal(p)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            hasPrivate
                              ? 'bg-amber-500 text-black hover:bg-amber-600 shadow-sm font-bold'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500'
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {hasPrivate ? 'اصل ڈیٹا دیکھیں' : 'تفصیلات'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              کل {filtered.length} پراپرٹیز | دکھائے جا رہے ہیں {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
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

      {/* Private CRM Popup Modal */}
      {activePrivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-amber-500/30 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-amber-500/10 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-amber-400">
                  اصل مالک / پرائیویٹ CRM ڈیٹا (ID: {activePrivateModal.prop_id})
                </h3>
              </div>
              <button
                onClick={() => setActivePrivateModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-slate-400">اصل ڈیلر / مالک کا نام</p>
                  <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                    {activePrivateModal.original_dealer_name || 'معلومات دستیاب نہیں'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-xs font-medium text-slate-400">اصل فون / واٹس ایپ نمبر</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                      {activePrivateModal.original_dealer_phone || '-'}
                    </span>
                    {activePrivateModal.original_dealer_phone && (
                      <a
                        href={`https://wa.me/${activePrivateModal.original_dealer_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-600"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Description / Raw Message */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="h-4 w-4 text-amber-500" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    مکمل اصل میسج (Full Raw Description):
                  </label>
                </div>
                <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  {activePrivateModal.full_description || activePrivateModal.description || 'کوئی اضافی تفصیلات درج نہیں ہیں۔'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => setActivePrivateModal(null)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
