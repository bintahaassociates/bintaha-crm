import { useState, useCallback } from 'react';
import { TrendingUp, DollarSign, Home, Users, ReceiptText, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Property, Lead, Transaction, Installment, Booking } from '@/lib/types';
import { mockProperties, mockLeads, mockTransactions, mockInstallments, mockBookings } from '@/lib/mockData';
import { formatCurrency, formatNumber, formatDate, daysUntil } from '@/lib/utils';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import LineChart from '@/components/charts/LineChart';

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [installments, setInstallments] = useState<Installment[]>(mockInstallments);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [props, lds, txns, insts, bks] = await Promise.all([
        supabase.from('properties').select('*').limit(20),
        supabase.from('leads').select('*').limit(20),
        supabase.from('transactions').select('*').limit(20),
        supabase.from('installments').select('*').limit(20),
        supabase.from('bookings').select('*').limit(20),
      ]);
      if (props.data && props.data.length > 0) setProperties(props.data);
      if (lds.data && lds.data.length > 0) setLeads(lds.data);
      if (txns.data && txns.data.length > 0) setTransactions(txns.data);
      if (insts.data && insts.data.length > 0) setInstallments(insts.data);
      if (bks.data && bks.data.length > 0) setBookings(bks.data);
    } catch (err) {
      console.error('Failed to load dashboard data, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useSyncTrigger(loadData);

  // Monthly sales data (bar chart) — from transactions
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = months.map((m, i) => {
    const monthTxns = transactions.filter((t) => t.type === 'revenue' && new Date(t.transaction_date).getMonth() === i);
    const value = monthTxns.reduce((sum, t) => sum + Number(t.amount), 0);
    const prevValue = i > 0 ? months.slice(0, i).reduce((prev, _, j) => {
      const prevTxns = transactions.filter((t) => t.type === 'revenue' && new Date(t.transaction_date).getMonth() === j);
      return prev + prevTxns.reduce((s, t) => s + Number(t.amount), 0);
    }, 0) / i : value * 0.85;
    return { label: m, value, prevValue: i > 0 ? prevValue : value * 0.85 };
  });

  // Revenue vs Expense (pie chart)
  const totalRevenue = transactions.filter((t) => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const pieData = [
    { label: 'Revenue', value: totalRevenue, color: '#d4af37' },
    { label: 'Expenses', value: totalExpense, color: '#f43f5e' },
  ];

  // Collections line graph — installment payments over months
  const collectionData = months.map((m, i) => {
    const monthInst = installments.filter((inst) => {
      const d = new Date(inst.due_date);
      return d.getMonth() === i && inst.status === 'paid';
    });
    return { label: m, value: monthInst.reduce((s, inst) => s + Number(inst.amount), 0) };
  });

  // Stats
  const availableProps = properties.filter((p) => p.status === 'available').length;
  const soldProps = properties.filter((p) => p.status === 'sold').length;
  const bookedProps = properties.filter((p) => p.status === 'booked').length;
  const closedLeads = leads.filter((l) => l.status === 'closed').length;
  const pendingDues = installments.filter((i) => i.status === 'pending');
  const overdueDues = pendingDues.filter((i) => daysUntil(i.due_date) < 0);
  const totalRevenueFormatted = formatCurrency(totalRevenue);
  const revenueGrowth = 12.5;

  // Recent bookings
  const recentBookings = bookings.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={totalRevenueFormatted}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: revenueGrowth, label: 'vs last period' }}
          color="gold"
        />
        <StatCard
          title="Properties Sold"
          value={`${soldProps}`}
          icon={<Home className="h-6 w-6" />}
          trend={{ value: 8.2, label: 'this quarter' }}
          color="blue"
        />
        <StatCard
          title="Active Leads"
          value={`${leads.filter((l) => l.status !== 'closed').length}`}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: -3.1, label: 'vs last week' }}
          color="amber"
        />
        <StatCard
          title="Pending Dues"
          value={`${pendingDues.length}`}
          icon={<AlertCircle className="h-6 w-6" />}
          trend={{ value: overdueDues.length > 0 ? -5.0 : 0, label: `${overdueDues.length} overdue` }}
          color="rose"
        />
      </div>

      {/* Charts Row 1: Bar + Pie */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Sales Bar Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Monthly Sales Performance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Revenue comparison with previous period</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-gradient-to-t from-amber-500 to-amber-300" />
                <span className="text-slate-500 dark:text-slate-400">Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-slate-200 dark:bg-slate-700" />
                <span className="text-slate-500 dark:text-slate-400">Previous</span>
              </div>
            </div>
          </div>
          <BarChart data={monthlyRevenue} />
        </div>

        {/* Revenue vs Expense Pie */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Revenue vs Expense</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Year to date breakdown</p>
          </div>
          <PieChart data={pieData} />
          <div className="mt-6 flex items-center justify-center gap-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="text-center">
              <p className="text-xs text-slate-400">Net Profit</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalRevenue - totalExpense)}</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <p className="text-xs text-slate-400">Margin</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {totalRevenue > 0 ? `${(((totalRevenue - totalExpense) / totalRevenue) * 100).toFixed(0)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Line chart + Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Collections Line Graph */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Collections Trend</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Monthly installment collections</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 dark:bg-amber-500/10">
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">+15.3%</span>
            </div>
          </div>
          <LineChart data={collectionData} color="#d4af37" />
        </div>

        {/* Recent Bookings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Bookings</h3>
            <ReceiptText className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No bookings yet</p>
            )}
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(Number(b.total_price))}</p>
                  <p className="text-xs text-slate-400">{formatDate(b.booking_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Down Payment</p>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{formatCurrency(Number(b.down_payment))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Property Status Overview + Pending Dues */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Property Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Property Status Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-500/10">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{availableProps}</p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Available</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-500/10">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{bookedProps}</p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Booked</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-4 text-center dark:bg-slate-800">
              <p className="text-3xl font-bold text-slate-600 dark:text-slate-300">{soldProps}</p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Sold</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="bg-amber-500 transition-all duration-1000"
                style={{ width: `${properties.length > 0 ? (availableProps / properties.length) * 100 : 0}%` }}
              />
              <div
                className="bg-amber-500 transition-all duration-1000 delay-150"
                style={{ width: `${properties.length > 0 ? (bookedProps / properties.length) * 100 : 0}%` }}
              />
              <div
                className="bg-slate-400 transition-all duration-1000 delay-300"
                style={{ width: `${properties.length > 0 ? (soldProps / properties.length) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">{properties.length} total properties</p>
          </div>
        </div>

        {/* Pending Dues Alert */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pending Installment Alerts</h3>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 dark:bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">{overdueDues.length} overdue</span>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingDues.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No pending dues</p>}
            {pendingDues.slice(0, 6).map((inst) => {
              const days = daysUntil(inst.due_date);
              const isOverdue = days < 0;
              return (
                <div
                  key={inst.id}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    isOverdue
                      ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-500/10' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10'}`}>
                      {isOverdue ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Installment #{inst.installment_number}</p>
                      <p className="text-xs text-slate-400">Due: {formatDate(inst.due_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatNumber(Number(inst.amount))}</p>
                    <p className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {isOverdue ? `${Math.abs(days)} days overdue` : `in ${days} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
