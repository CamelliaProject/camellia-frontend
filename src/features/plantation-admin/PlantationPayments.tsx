import { useEffect, useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, Calendar, Users, Tag,
  CheckCircle, Clock, Loader2, Search, ArrowUpDown,
  Globe, MapPin, DollarSign, BarChart2, UserCheck,
  XCircle, AlertTriangle, TrendingDown,
} from 'lucide-react';

import { adminApi } from '../../services/api';

// ── Types ──────────────────────────────────────────────────────────────────
interface PaymentRow {
  id: string;
  bookingReference: string;
  touristName: string;
  touristEmail: string;
  totalLKR: number | null;
  totalUSD: number | null;
  numAdults: number;
  numChildren: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  cancelledBy: 'tourist' | null;
  bookingDate: string;
  createdAt: string;
  experiences: string[];
}

interface Props { plantationId: string; }

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(raw: any) {
  if (!raw) return '—';
  try {
    const iso = raw instanceof Date ? raw.toISOString() : String(raw);
    const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
    if (!y || !mo || !d) return String(raw);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return String(raw); }
}

function mapRow(raw: any): PaymentRow {
  return {
    id: raw.id,
    bookingReference: raw.booking_reference || raw.id,
    touristName: raw.tourist_full_name || 'Guest',
    touristEmail: raw.tourist_email || '',
    totalLKR: raw.total_price_lkr != null ? Number(raw.total_price_lkr) : null,
    totalUSD: raw.total_price_usd != null ? Number(raw.total_price_usd) : null,
    numAdults: raw.num_adults ?? 1,
    numChildren: raw.num_children ?? 0,
    status: raw.status ?? 'upcoming',
    cancelledBy: raw.cancelled_by === 'tourist' ? 'tourist' : raw.cancelled_by === 'admin' ? null : null,
    bookingDate: raw.booking_date || '',
    createdAt: raw.created_at || '',
    experiences: Array.isArray(raw.experience_names) ? raw.experience_names : [],
  };
}

function toDate(raw: any): Date {
  if (!raw) return new Date(0);
  return raw instanceof Date ? raw : new Date(raw);
}

type Period = 'week' | 'month' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time',
};

// ── Mini split bar ─────────────────────────────────────────────────────────
function SplitBar({ lkrPct, usdPct }: { lkrPct: number; usdPct: number }) {
  if (lkrPct === 0 && usdPct === 0) {
    return <div className="h-2 rounded-full bg-gray-100 w-full" />;
  }
  return (
    <div className="flex h-2 rounded-full overflow-hidden w-full bg-gray-100">
      {lkrPct > 0 && (
        <div className="h-full bg-[#52B788] transition-all" style={{ width: `${lkrPct}%` }} title={`Local ${lkrPct.toFixed(0)}%`} />
      )}
      {usdPct > 0 && (
        <div className="h-full bg-blue-400 transition-all" style={{ width: `${usdPct}%` }} title={`Foreign ${usdPct.toFixed(0)}%`} />
      )}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, children, accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 ${accent ? 'bg-[#1B4332] text-white' : 'bg-white border border-gray-100'}`}>
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${accent ? 'text-white/60' : 'text-gray-400'}`}>
        <span className={accent ? 'text-white/70' : 'text-[#52B788]'}>{icon}</span>
        {label}
      </div>
      <div>
        <div className={`text-2xl font-bold ${accent ? 'text-white' : 'text-[#1B4332]'}`}>{value}</div>
        {sub && <div className={`text-xs mt-1 ${accent ? 'text-white/60' : 'text-gray-400'}`}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PlantationPayments({ plantationId }: Props) {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const res = await adminApi.getPlantationPayments(plantationId);
        setRows((res.data?.data || []).map(mapRow));
      } catch (err) {
        console.error('Failed to load payments:', err);
        setLoadError('Unable to load payment data. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [plantationId]);

  const periodStart = useMemo((): Date => {
    const now = new Date();
    if (period === 'week')  { const d = new Date(now); d.setDate(now.getDate() - 7); return d; }
    if (period === 'month') { const d = new Date(now); d.setMonth(now.getMonth() - 1); return d; }
    if (period === 'year')  { const d = new Date(now); d.setFullYear(now.getFullYear() - 1); return d; }
    return new Date(0);
  }, [period]);

  const periodRows = useMemo(
    () => rows.filter(r => toDate(r.createdAt) >= periodStart),
    [rows, periodStart]
  );

  // ── Analytics aggregates ──────────────────────────────────────────────────
  const analytics = useMemo(() => {
    let lkr = 0, usd = 0, combined = 0;
    let totalAdults = 0, totalChildren = 0;
    let completedCount = 0;
    const expFreq: Record<string, number> = {};

    periodRows.forEach(r => {
      // Admin-cancelled bookings are refunded — exclude from revenue totals
      const isAdminCancelled = r.status === 'cancelled' && r.cancelledBy !== 'tourist';
      if (!isAdminCancelled) {
        if (!r.totalUSD && r.totalLKR) lkr += r.totalLKR;
        if (r.totalUSD) usd += r.totalUSD;
        combined += r.totalLKR ?? (r.totalUSD ? r.totalUSD * 330 : 0);
        totalAdults += r.numAdults;
        totalChildren += r.numChildren;
        r.experiences.forEach(e => { expFreq[e] = (expFreq[e] ?? 0) + 1; });
      }
      if (r.status === 'completed') completedCount++;
    });

    const count = periodRows.length;
    const totalGuests = totalAdults + totalChildren;
    const avgPerBooking = count > 0 ? Math.round(combined / count) : 0;
    const avgGuests = count > 0 ? (totalGuests / count).toFixed(1) : '0';
    const completionRate = count > 0 ? Math.round((completedCount / count) * 100) : 0;
    const lkrEquiv = lkr;
    const usdEquiv = usd * 330;
    const lkrPct = combined > 0 ? (lkrEquiv / combined) * 100 : 0;
    const usdPct = combined > 0 ? (usdEquiv / combined) * 100 : 0;

    const topExperiences = Object.entries(expFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Cancellation revenue loss — only admin cancellations reduce revenue;
    // tourist cancellations are non-refundable so revenue is retained.
    const cancelledRows = periodRows.filter(r => r.status === 'cancelled');
    let lostLKR = 0, lostUSD = 0, lostCombined = 0;
    let cancelledByTourist = 0, cancelledByAdmin = 0;
    cancelledRows.forEach(r => {
      if (r.cancelledBy === 'tourist') {
        cancelledByTourist++;
      } else {
        cancelledByAdmin++;
        if (!r.totalUSD && r.totalLKR) lostLKR += r.totalLKR;
        if (r.totalUSD) lostUSD += r.totalUSD;
        lostCombined += r.totalLKR ?? (r.totalUSD ? r.totalUSD * 330 : 0);
      }
    });
    const cancelCount = cancelledRows.length;
    const potential = combined + lostCombined;
    const lostPct = potential > 0 ? Math.round((lostCombined / potential) * 100) : 0;

    return {
      lkr, usd, combined, count, totalGuests, totalAdults, totalChildren,
      avgPerBooking, avgGuests, completedCount, completionRate,
      lkrPct, usdPct, topExperiences,
      cancelCount, lostLKR, lostUSD, lostCombined, lostPct, cancelledByTourist, cancelledByAdmin,
    };
  }, [periodRows]);

  const allTime = useMemo(() => {
    let lkr = 0, usd = 0, combined = 0;
    rows.forEach(r => {
      if (r.status === 'cancelled' && r.cancelledBy !== 'tourist') return;
      if (!r.totalUSD && r.totalLKR) lkr += r.totalLKR;
      if (r.totalUSD) usd += r.totalUSD;
      combined += r.totalLKR ?? (r.totalUSD ? r.totalUSD * 330 : 0);
    });
    return { lkr, usd, combined, count: rows.length, completedCount: rows.filter(r => r.status === 'completed').length };
  }, [rows]);

  const displayed = useMemo(() => {
    let list = periodRows.filter(r => r.status === 'cancelled' && r.cancelledBy !== 'tourist');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.touristName.toLowerCase().includes(q) ||
        r.touristEmail.toLowerCase().includes(q) ||
        r.bookingReference.toLowerCase().includes(q) ||
        r.experiences.some(e => e.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const da = toDate(a.createdAt).getTime();
      const db = toDate(b.createdAt).getTime();
      return sortOrder === 'asc' ? da - db : db - da;
    });
  }, [periodRows, search, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
        <Loader2 className="animate-spin" size={22} /> Loading payment data…
      </div>
    );
  }

  if (loadError) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center text-sm">{loadError}</div>;
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Wallet size={22} className="text-[#2D6A4F]" />
          <h2 className="text-2xl font-bold text-[#1B4332]">Payments & Revenue</h2>
        </div>
        {/* All-time summary pill */}
        <div className="flex items-center gap-3 bg-[#f0faf4] border border-[#B7E4C7] rounded-xl px-4 py-2 text-sm text-[#2D6A4F]">
          <TrendingUp size={14} />
          <span>All-time: <strong>{allTime.count}</strong> bookings · <strong>{allTime.completedCount}</strong> completed</span>
          <span className="text-gray-300">|</span>
          <span>Rs <strong>{allTime.lkr.toLocaleString()}</strong> · $ <strong>{allTime.usd.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* ── Period tabs ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex gap-1 w-fit mb-6">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${period === p ? 'bg-[#2D6A4F] text-white shadow' : 'text-gray-500 hover:text-[#2D6A4F]'}`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Analytics cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* 1 · Total Revenue */}
        <StatCard
          accent
          icon={<DollarSign size={14} />}
          label="Total Revenue"
          value={`Rs ${analytics.combined.toLocaleString()}`}
          sub={`LKR equivalent · ${PERIOD_LABELS[period]}`}
        >
          <div className="space-y-1.5">
            <SplitBar lkrPct={analytics.lkrPct} usdPct={analytics.usdPct} />
            <div className="flex justify-between text-[10px] text-white/50">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#52B788] inline-block" /> Local {analytics.lkrPct.toFixed(0)}%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Foreign {analytics.usdPct.toFixed(0)}%</span>
            </div>
          </div>
        </StatCard>

        {/* 2 · Bookings & Completion */}
        <StatCard
          icon={<BarChart2 size={14} />}
          label="Bookings"
          value={analytics.count}
          sub={`${analytics.completedCount} completed · ${analytics.count - analytics.completedCount} pending/cancelled`}
        >
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${analytics.completionRate}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">{analytics.completionRate}% completion rate</p>
          </div>
        </StatCard>

        {/* 3 · Guests Hosted */}
        <StatCard
          icon={<UserCheck size={14} />}
          label="Guests Hosted"
          value={analytics.totalGuests}
          sub={`${analytics.totalAdults} adults · ${analytics.totalChildren} children`}
        >
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users size={11} />
            <span>avg <strong className="text-[#1B4332]">{analytics.avgGuests}</strong> guests per booking</span>
          </div>
        </StatCard>

        {/* 4 · Avg Booking Value */}
        <StatCard
          icon={<TrendingUp size={14} />}
          label="Avg Booking Value"
          value={`Rs ${analytics.avgPerBooking.toLocaleString()}`}
          sub="per booking (LKR equiv.)"
        >
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-[#f0faf4] rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1"><MapPin size={9} /> Local</p>
              <p className="text-xs font-bold text-[#2D6A4F]">Rs {analytics.lkr > 0 ? Math.round(analytics.lkr / Math.max(1, periodRows.filter(r => !r.totalUSD && r.totalLKR).length)).toLocaleString() : '—'}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1"><Globe size={9} /> Foreign</p>
              <p className="text-xs font-bold text-blue-600">$ {analytics.usd > 0 ? Math.round(analytics.usd / Math.max(1, periodRows.filter(r => r.totalUSD).length)).toLocaleString() : '—'}</p>
            </div>
          </div>
        </StatCard>
      </div>

      {/* ── Revenue sources + Top experiences side by side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {/* Revenue sources breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <DollarSign size={13} className="text-[#52B788]" /> Revenue Sources
          </h3>
          <div className="space-y-4">
            {/* LKR row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><MapPin size={13} className="text-[#52B788]" /> Local (LKR)</span>
                <span className="text-sm font-bold text-[#2D6A4F]">Rs {analytics.lkr.toLocaleString()}</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#52B788] rounded-full transition-all" style={{ width: `${analytics.lkrPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{analytics.lkrPct.toFixed(1)}% of total · {periodRows.filter(r => !r.totalUSD && r.totalLKR).length} bookings</p>
            </div>
            {/* USD row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><Globe size={13} className="text-blue-400" /> Foreign (USD)</span>
                <span className="text-sm font-bold text-blue-600">$ {analytics.usd.toLocaleString()}</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${analytics.usdPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{analytics.usdPct.toFixed(1)}% of total · {periodRows.filter(r => r.totalUSD).length} bookings</p>
            </div>
          </div>
        </div>

        {/* Top experiences */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <Tag size={13} className="text-[#52B788]" /> Top Experiences — {PERIOD_LABELS[period]}
          </h3>
          {analytics.topExperiences.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No experience data for this period.</p>
          ) : (
            <div className="space-y-3">
              {analytics.topExperiences.map(([name, count], i) => {
                const maxCount = analytics.topExperiences[0][1];
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-sm text-gray-700 font-medium truncate">
                        <span className="w-5 h-5 rounded-full bg-[#D8F3DC] text-[#2D6A4F] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        {name}
                      </span>
                      <span className="text-xs font-bold text-[#2D6A4F] shrink-0 ml-2">{count} booking{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-[#52B788] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cancellation Impact ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={18} className="text-red-500" />
          <h3 className="text-lg font-bold text-gray-800">Cancellation Impact</h3>
          <span className="text-xs text-gray-400 font-medium">— {PERIOD_LABELS[period]}</span>
        </div>

        {/* Impact summary banner */}
        {analytics.cancelledByAdmin > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">
                  Rs {analytics.lostCombined.toLocaleString()} in revenue was lost — {analytics.cancelledByAdmin} booking{analytics.cancelledByAdmin !== 1 ? 's' : ''} cancelled by the plantation this period
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  That is <strong>{analytics.lostPct}%</strong> of potential revenue. Customer cancellations are non-refundable and do not affect revenue.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-red-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Cancelled by Plantation</p>
                <p className="text-xl font-bold text-red-600">{analytics.cancelledByAdmin}</p>
              </div>
              <div className="bg-white border border-red-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Revenue Lost (LKR)</p>
                <p className="text-lg font-bold text-red-600">Rs {analytics.lostLKR.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-red-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Revenue Lost (USD)</p>
                <p className="text-lg font-bold text-red-600">$ {analytics.lostUSD.toLocaleString()}</p>
              </div>
              <div className="bg-white border border-orange-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Cancelled by Customer</p>
                <p className="text-lg font-bold text-orange-500">{analytics.cancelledByTourist}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">No revenue impact</p>
              </div>
            </div>
            {/* Loss bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Earned — Rs {analytics.combined.toLocaleString()}</span>
                <span>Lost to plantation cancellations — Rs {analytics.lostCombined.toLocaleString()} ({analytics.lostPct}%)</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full bg-[#52B788]" style={{ width: `${100 - analytics.lostPct}%` }} />
                <div className="h-full bg-red-400" style={{ width: `${analytics.lostPct}%` }} />
              </div>
            </div>
          </div>
        ) : analytics.cancelCount > 0 ? (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-3">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <p className="text-sm text-orange-700 font-medium">
              {analytics.cancelledByTourist} booking{analytics.cancelledByTourist !== 1 ? 's' : ''} cancelled by customers this period — no revenue impact (non-refundable).
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-3">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <p className="text-sm text-green-700 font-medium">No cancellations this period — full revenue retained.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, reference, experience…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
          />
        </div>
        <button
          onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-medium">{search ? 'No results match your search.' : `No plantation-cancelled bookings in ${PERIOD_LABELS[period].toLowerCase()}.`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(r => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm hover:border-gray-200 transition">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  r.cancelledBy === 'tourist' ? 'bg-orange-100 text-orange-500' : 'bg-red-100 text-red-500'
                }`}>
                  {(r.touristName || 'G')[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#1B4332]">{r.touristName}</p>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      r.cancelledBy === 'tourist' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <XCircle size={10} />
                      {r.cancelledBy === 'tourist' ? 'Cancelled by Customer' : 'Cancelled by Plantation'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.touristEmail}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> Visit: {fmtDate(r.bookingDate)}</span>
                    <span className="flex items-center gap-1.5"><Clock size={13} /> Booked: {fmtDate(r.createdAt)}</span>
                    <span className="flex items-center gap-1.5"><Users size={13} />
                      {r.numAdults} adult{r.numAdults !== 1 ? 's' : ''}
                      {r.numChildren > 0 ? `, ${r.numChildren} child${r.numChildren !== 1 ? 'ren' : ''}` : ''}
                    </span>
                  </div>

                  {r.experiences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {r.experiences.map((exp, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs bg-[#f0faf4] text-[#2D6A4F] border border-[#B7E4C7] px-2 py-0.5 rounded-full">
                          <Tag size={10} /> {exp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {r.cancelledBy === 'tourist' ? (
                    <>
                      <p className="text-[10px] text-green-500 font-semibold uppercase tracking-wide mb-0.5">Revenue Retained</p>
                      {r.totalUSD != null ? (
                        <>
                          <p className="font-bold text-lg text-gray-400">$ {r.totalUSD.toLocaleString()}</p>
                          {r.totalLKR != null && <p className="text-xs text-gray-300">≈ Rs {r.totalLKR.toLocaleString()}</p>}
                        </>
                      ) : r.totalLKR != null ? (
                        <p className="font-bold text-lg text-gray-400">Rs {r.totalLKR.toLocaleString()}</p>
                      ) : (
                        <p className="text-gray-400 text-sm">—</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide mb-0.5">Revenue Lost</p>
                      {r.totalUSD != null ? (
                        <>
                          <p className="font-bold text-lg text-red-500">$ {r.totalUSD.toLocaleString()}</p>
                          {r.totalLKR != null && <p className="text-xs text-red-300">≈ Rs {r.totalLKR.toLocaleString()}</p>}
                        </>
                      ) : r.totalLKR != null ? (
                        <p className="font-bold text-lg text-red-500">Rs {r.totalLKR.toLocaleString()}</p>
                      ) : (
                        <p className="text-gray-400 text-sm">—</p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-gray-400 mt-1">#{r.bookingReference}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
