import { useState, useCallback } from 'react';
import { Plus, ReceiptText, AlertCircle, CheckCircle2, Clock, Printer, Eye, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Booking, Installment, Property, Lead } from '@/lib/types';
import { mockBookings, mockInstallments, mockProperties, mockLeads } from '@/lib/mockData';
import { formatCurrency, formatNumber, formatDate, daysUntil } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

interface BookingWithDetails extends Booking {
  property?: Property | null;
  lead?: Lead | null;
  installments?: Installment[];
}

export default function Bookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>(mockBookings.map((b) => ({ ...b, installments: mockInstallments.filter((i) => i.booking_id === b.id) })));
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<BookingWithDetails | null>(null);
  const [form, setForm] = useState({ property_id: '', lead_id: '', total_price: '', down_payment: '', installment_months: '12' });
  const [saving, setSaving] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState<BookingWithDetails | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bks, props, lds] = await Promise.all([
        supabase.from('bookings').select('*, property(*), lead(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('properties').select('*').eq('status', 'available').limit(20),
        supabase.from('leads').select('*').limit(20),
      ]);

      if (bks.data && bks.data.length > 0) {
        const bookingsWithInstalls = await Promise.all(
          bks.data.map(async (b) => {
            const { data: insts } = await supabase
              .from('installments')
              .select('*')
              .eq('booking_id', b.id)
              .order('installment_number', { ascending: true });
            return { ...b, installments: insts || [] };
          })
        );
        setBookings(bookingsWithInstalls);
      }
      if (props.data && props.data.length > 0) setProperties(props.data);
      if (lds.data && lds.data.length > 0) setLeads(lds.data);
    } catch (err) {
      console.error('Failed to load bookings data, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  function reloadData() { loadData(); }

  useSyncTrigger(loadData);

  async function handleSave() {
    setSaving(true);
    try {
      const totalPrice = Number(form.total_price) || 0;
      const downPayment = Number(form.down_payment) || 0;
      const months = Number(form.installment_months) || 12;
      const monthlyAmount = (totalPrice - downPayment) / months;

      const { data: booking } = await supabase.from('bookings').insert({
        property_id: form.property_id || null,
        lead_id: form.lead_id || null,
        total_price: totalPrice,
        down_payment: downPayment,
        installment_months: months,
        booking_date: new Date().toISOString().split('T')[0],
      }).select().single();

      if (booking) {
        if (form.property_id) {
          await supabase.from('properties').update({ status: 'sold' }).eq('id', form.property_id);
        }

        const installments = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 1);
        for (let i = 1; i <= months; i++) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
          installments.push({
            booking_id: booking.id,
            installment_number: i,
            due_date: dueDate.toISOString().split('T')[0],
            amount: monthlyAmount,
            status: 'pending',
          });
        }
        await supabase.from('installments').insert(installments);
      }
    } catch (err) {
      console.error('Failed to save booking:', err);
    } finally {
      setSaving(false);
      setModalOpen(false);
      setForm({ property_id: '', lead_id: '', total_price: '', down_payment: '', installment_months: '12' });
      reloadData();
    }
  }

  async function markPaid(instId: string) {
    try {
      await supabase.from('installments').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', instId);
    } catch (err) {
      console.error('Failed to mark installment paid:', err);
    }
    reloadData();
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  // Calculate summary stats
  const allInstallments = bookings.flatMap((b) => b.installments || []);
  const pendingInst = allInstallments.filter((i) => i.status === 'pending');
  const overdueInst = pendingInst.filter((i) => daysUntil(i.due_date) < 0);
  const totalCollected = allInstallments.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = pendingInst.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Bookings" value={String(bookings.length)} icon={<ReceiptText className="h-5 w-5" />} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <SummaryCard title="Total Collected" value={formatCurrency(totalCollected)} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <SummaryCard title="Pending Dues" value={formatCurrency(totalPending)} icon={<Clock className="h-5 w-5" />} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <SummaryCard title="Overdue" value={String(overdueInst.length)} icon={<AlertCircle className="h-5 w-5" />} color="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" />
      </div>

      {/* Add Booking Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Record New Booking
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((b) => {
          const insts = b.installments || [];
          const paidCount = insts.filter((i) => i.status === 'paid').length;
          const progress = insts.length > 0 ? (paidCount / insts.length) * 100 : 0;
          const bOverdue = insts.filter((i) => i.status === 'pending' && daysUntil(i.due_date) < 0).length;

          return (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                    <ReceiptText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {b.property?.title || 'Unknown Property'}
                    </p>
                    <p className="text-sm text-slate-400">
                      {b.lead?.name || 'Walk-in'} · {formatDate(b.booking_date)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total Price</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(Number(b.total_price))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Down Payment</p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(Number(b.down_payment))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Installments</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{paidCount}/{b.installment_months}</p>
                  </div>
                  {bOverdue > 0 && (
                    <div className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 dark:bg-red-500/10">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">{bOverdue} overdue</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewBooking(b)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => setReceiptBooking(b)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-5 pb-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Payment Progress</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <ReceiptText className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="mt-4 text-sm text-slate-400">No bookings recorded yet</p>
        </div>
      )}

      {/* Add Booking Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record New Booking"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Record Booking'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Property</label>
            <select value={form.property_id} onChange={(e) => {
              const prop = properties.find((p) => p.id === e.target.value);
              setForm({ ...form, property_id: e.target.value, total_price: prop ? String(prop.price) : form.total_price });
            }} className={inputClass}>
              <option value="">Select property</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title} - {formatCurrency(Number(p.price))}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Lead / Customer</label>
            <select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} className={inputClass}>
              <option value="">Select lead</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name} - {l.phone}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Total Price (₹)</label>
              <input type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} className={inputClass} placeholder="4500000" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Down Payment (₹)</label>
              <input type="number" value={form.down_payment} onChange={(e) => setForm({ ...form, down_payment: e.target.value })} className={inputClass} placeholder="900000" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Installment Months</label>
            <input type="number" value={form.installment_months} onChange={(e) => setForm({ ...form, installment_months: e.target.value })} className={inputClass} placeholder="12" />
          </div>
        </div>
      </Modal>

      {/* View Booking + Installments */}
      <Modal
        open={!!viewBooking}
        onClose={() => setViewBooking(null)}
        title="Booking Details & Installment Schedule"
        footer={<button onClick={() => setViewBooking(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Close</button>}
      >
        {viewBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="Property" value={viewBooking.property?.title || '-'} />
              <DetailItem label="Customer" value={viewBooking.lead?.name || '-'} />
              <DetailItem label="Booking Date" value={formatDate(viewBooking.booking_date)} />
              <DetailItem label="Total Price" value={formatNumber(Number(viewBooking.total_price))} />
              <DetailItem label="Down Payment" value={formatNumber(Number(viewBooking.down_payment))} />
              <DetailItem label="Monthly Installment" value={formatNumber((Number(viewBooking.total_price) - Number(viewBooking.down_payment)) / viewBooking.installment_months)} />
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">Installment Schedule</h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {(viewBooking.installments || []).map((inst) => {
                  const days = daysUntil(inst.due_date);
                  const isOverdue = inst.status === 'pending' && days < 0;
                  return (
                    <div
                      key={inst.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        isOverdue
                          ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                          : inst.status === 'paid'
                          ? 'border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {inst.installment_number}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatNumber(Number(inst.amount))}</p>
                          <p className="text-xs text-slate-400">
                            Due: {formatDate(inst.due_date)}
                            {inst.status === 'paid' && inst.paid_date && ` · Paid: ${formatDate(inst.paid_date)}`}
                            {isOverdue && ` · ${Math.abs(days)} days overdue`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={inst.status} />
                        {inst.status === 'pending' && (
                          <button
                            onClick={() => markPaid(inst.id)}
                            className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        open={!!receiptBooking}
        onClose={() => setReceiptBooking(null)}
        title="Payment Receipt"
        footer={
          <>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              <Download className="h-4 w-4" /> Print
            </button>
            <button onClick={() => setReceiptBooking(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Close</button>
          </>
        }
      >
        {receiptBooking && (
          <div className="space-y-4 rounded-xl border border-slate-200 p-6 dark:border-slate-700">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                <ReceiptText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Bin Taha Associates</h3>
              <p className="text-xs text-slate-400">Official Payment Receipt</p>
            </div>

            <div className="border-t border-b border-slate-200 py-4 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ReceiptRow label="Receipt No" value={`RCPT-${receiptBooking.id.slice(0, 8).toUpperCase()}`} />
                <ReceiptRow label="Date" value={formatDate(receiptBooking.booking_date)} />
                <ReceiptRow label="Customer" value={receiptBooking.lead?.name || '-'} />
                <ReceiptRow label="Phone" value={receiptBooking.lead?.phone || '-'} />
                <ReceiptRow label="Property" value={receiptBooking.property?.title || '-'} />
                <ReceiptRow label="Plot No" value={receiptBooking.property?.plot_number || '-'} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total Property Price</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(Number(receiptBooking.total_price))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Down Payment Received</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{formatNumber(Number(receiptBooking.down_payment))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Installment Plan</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{receiptBooking.installment_months} months</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100">Balance Due</span>
                <span className="font-bold text-red-600 dark:text-red-400">{formatNumber(Number(receiptBooking.total_price) - Number(receiptBooking.down_payment))}</span>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">This is a computer-generated receipt and does not require a signature.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-semibold text-slate-700 dark:text-slate-300">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
