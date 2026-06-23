import { useEffect, useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, Tag,
  CheckCircle, Loader2, Globe, MapPin,
  DollarSign, BarChart2, UserCheck, AlertTriangle, TrendingDown,
} from 'lucide-react';
import { adminApi } from '../../services/api';

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
    cancelledBy: raw.cancelled_by === 'tourist' ? 'tourist' : null,
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

// ── KPI card ───────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <div
      className="group bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4 border-t-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
      style={{ borderColor }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1B4332] leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────
function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { color: string; pct: number }[];
  centerLabel: string;
  centerValue: string;
}) {
  let cumulative = 0;
  const stops = segments
    .map(s => {
      const start = cumulative;
      cumulative += s.pct;
      return `${s.color} ${start}% ${cumulative}%`;
    })
    .join(', ');

  return (
    <div className="relative w-32 h-32 shrink-0">
      <div
        className="w-full h-full rounded-full transition-all duration-500"
        style={{ background: cumulative > 0 ? `conic-gradient(${stops})` : '#f3f4f6' }}
      />
      <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center text-center px-1">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{centerLabel}</p>
        <p className="text-sm font-bold text-[#1B4332] leading-tight">{centerValue}</p>
      </div>
    </div>
  );
}

const MEDAL_COLORS = [
  { bg: '#fef3c7', text: '#b45309', bar: 'linear-gradient(90deg, #fbbf24, #b45309)' },
  { bg: '#f1f5f9', text: '#64748b', bar: 'linear-gradient(90deg, #cbd5e1, #64748b)' },
  { bg: '#ffedd5', text: '#c2410c', bar: 'linear-gradient(90deg, #fb923c, #c2410c)' },
];
const DEFAULT_MEDAL = { bg: '#D8F3DC', text: '#2D6A4F', bar: 'linear-gradient(90deg, #52B788, #1B4332)' };

export default function PlantationPayments({ plantationId }: Props) {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const res = await adminApi.getPlantationPayments(plantationId);
        setRows((res.data?.data || []).map(mapRow));
      } catch {
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
    [rows, periodStart],
  );

  const analytics = useMemo(() => {
    let lkr = 0, usd = 0, combined = 0;
    let totalAdults = 0, totalChildren = 0, completedCount = 0;
    const expFreq: Record<string, number> = {};

    const lkrBookings = periodRows.filter(r => !r.totalUSD && r.totalLKR && r.status !== 'cancelled');
    const usdBookings = periodRows.filter(r => r.totalUSD && r.status !== 'cancelled');

    periodRows.forEach(r => {
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

    const topExperiences = Object.entries(expFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

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
      cancelCount, lostLKR, lostUSD, lostCombined, lostPct,
      cancelledByTourist, cancelledByAdmin,
      lkrBookings: lkrBookings.length,
      usdBookings: usdBookings.length,
    };
  }, [periodRows]);

  const allTime = useMemo(() => {
    let lkr = 0, usd = 0;
    rows.forEach(r => {
      if (r.status === 'cancelled' && r.cancelledBy !== 'tourist') return;
      if (!r.totalUSD && r.totalLKR) lkr += r.totalLKR;
      if (r.totalUSD) usd += r.totalUSD;
    });
    return { lkr, usd, count: rows.length, completedCount: rows.filter(r => r.status === 'completed').length };
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
        <Loader2 className="animate-spin" size={20} /> Loading payment data…
      </div>
    );
  }

  if (loadError) {
    return <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center text-sm">{loadError}</div>;
  }

  return (
    <div className="space-y-6">

      {/* ── Page title + all-time snapshot ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={20} className="text-[#2D6A4F]" />
            <h2 className="text-xl font-bold text-[#1B4332]">Payments & Revenue</h2>
          </div>
          <p className="text-sm text-gray-400">
            All-time: <span className="text-gray-600 font-medium">{allTime.count} bookings</span> &middot; <span className="text-gray-600 font-medium">{allTime.completedCount} completed</span> &middot; Rs <span className="text-gray-600 font-medium">{allTime.lkr.toLocaleString()}</span> &middot; $ <span className="text-gray-600 font-medium">{allTime.usd.toLocaleString()}</span>
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p
                  ? 'bg-white text-[#1B4332] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign size={20} />}
          label="Total Revenue"
          value={`Rs ${analytics.combined.toLocaleString()}`}
          sub={analytics.usd > 0 ? `Includes $${analytics.usd.toLocaleString()} USD` : 'Local payments only'}
          iconBg="#dcfce7"
          iconColor="#15803d"
          borderColor="#1B4332"
        />
        <KpiCard
          icon={<BarChart2 size={20} />}
          label="Total Bookings"
          value={analytics.count}
          sub={`${analytics.completedCount} completed · ${analytics.completionRate}% completion rate`}
          iconBg="#dbeafe"
          iconColor="#1d4ed8"
          borderColor="#1B4332"
        />
        <KpiCard
          icon={<UserCheck size={20} />}
          label="Guests Hosted"
          value={analytics.totalGuests}
          sub={`${analytics.totalAdults} adults · ${analytics.totalChildren} children`}
          iconBg="#fef9c3"
          iconColor="#a16207"
          borderColor="#1B4332"
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="Avg per Booking"
          value={`Rs ${analytics.avgPerBooking.toLocaleString()}`}
          sub={`Avg ${analytics.avgGuests} guests per booking`}
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          borderColor="#1B4332"
        />
      </div>

      {/* ── Revenue sources + Top experiences ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Revenue sources */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#1B4332] flex items-center gap-2">
            <DollarSign size={15} className="text-[#2D6A4F]" /> Revenue by Currency
          </h3>
          {analytics.combined === 0 ? (
            <p className="text-sm text-gray-400 italic">No revenue in this period.</p>
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart
                segments={[
                  { color: '#52B788', pct: analytics.lkrPct },
                  { color: '#60a5fa', pct: analytics.usdPct },
                ]}
                centerLabel="Total"
                centerValue={`Rs ${analytics.combined.toLocaleString()}`}
              />
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#52B788] shrink-0" />
                    <MapPin size={13} className="text-[#52B788] shrink-0" /> Local (LKR)
                  </span>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#1B4332]">Rs {analytics.lkr.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{Math.round(analytics.lkrPct)}% · {analytics.lkrBookings} booking{analytics.lkrBookings !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa] shrink-0" />
                    <Globe size={13} className="text-blue-400 shrink-0" /> Foreign (USD)
                  </span>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#1B4332]">$ {analytics.usd.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{Math.round(analytics.usdPct)}% · {analytics.usdBookings} booking{analytics.usdBookings !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top experiences */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#1B4332] flex items-center gap-2">
            <Tag size={15} className="text-[#2D6A4F]" /> Top Experiences
          </h3>
          {analytics.topExperiences.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No experience data for this period.</p>
          ) : (
            analytics.topExperiences.map(([name, count], i) => {
              const pct = Math.round((count / analytics.topExperiences[0][1]) * 100);
              const medal = MEDAL_COLORS[i] ?? DEFAULT_MEDAL;
              return (
                <div key={name} className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: medal.bg, color: medal.text }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-700 truncate">{name}</span>
                      <span className="text-sm font-semibold text-[#2D6A4F] shrink-0 ml-3">
                        {count} booking{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: medal.bar }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Cancellation summary ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1B4332] flex items-center gap-2 mb-4">
          <TrendingDown size={15} className="text-red-400" /> Cancellation Summary
          <span className="text-xs text-gray-400 font-normal">— {PERIOD_LABELS[period]}</span>
        </h3>

        {analytics.cancelledByAdmin > 0 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-4">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {analytics.cancelledByAdmin} plantation cancellation{analytics.cancelledByAdmin !== 1 ? 's' : ''} — Rs {analytics.lostCombined.toLocaleString()} revenue lost ({analytics.lostPct}% of potential)
                </p>
                {analytics.cancelledByTourist > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    + {analytics.cancelledByTourist} customer cancellation{analytics.cancelledByTourist !== 1 ? 's' : ''} (non-refundable, no revenue impact)
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Cancelled by Plantation</p>
                <p className="text-2xl font-bold text-red-500">{analytics.cancelledByAdmin}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Lost Revenue (LKR)</p>
                <p className="text-lg font-bold text-red-500">Rs {analytics.lostLKR.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Lost Revenue (USD)</p>
                <p className="text-lg font-bold text-red-500">$ {analytics.lostUSD.toLocaleString()}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Earned</span>
                <span>Lost ({analytics.lostPct}%)</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full bg-[#52B788]" style={{ width: `${100 - analytics.lostPct}%` }} />
                <div className="h-full bg-red-400" style={{ width: `${analytics.lostPct}%` }} />
              </div>
            </div>
          </div>
        ) : analytics.cancelCount > 0 ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-4">
            <CheckCircle size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              {analytics.cancelledByTourist} customer cancellation{analytics.cancelledByTourist !== 1 ? 's' : ''} this period — non-refundable, no revenue impact.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg p-4">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <p className="text-sm text-green-700">No cancellations this period — full revenue retained.</p>
          </div>
        )}
      </div>

    </div>
  );
}
