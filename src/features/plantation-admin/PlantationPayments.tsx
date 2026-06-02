import { useEffect, useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, Calendar, Users, Tag,
  CheckCircle, Clock, Loader2, Search, ArrowUpDown,
  Globe, MapPin, DollarSign,
} from 'lucide-react';

const USD_TO_LKR = 330;
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
    cancelledBy: raw.cancelled_by === 'tourist' ? 'tourist' : null,
    bookingDate: raw.booking_date || '',
    createdAt: raw.created_at || '',
    experiences: Array.isArray(raw.experience_names) ? raw.experience_names : [],
  };
}

// Parse created_at to Date safely
function toDate(raw: any): Date {
  if (!raw) return new Date(0);
  return raw instanceof Date ? raw : new Date(raw);
}

type Period = 'week' | 'month' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week', month: 'This Month', year: 'This Year', all: 'All Time',
};

// ── Component ──────────────────────────────────────────────────────────────
export default function PlantationPayments({ plantationId }: Props) {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // ── Fetch ─────────────────────────────────────────────────────────────
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

  // ── Period filter ─────────────────────────────────────────────────────
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

  // ── Revenue totals ────────────────────────────────────────────────────
  // Includes upcoming + completed — backend already excludes cancelled.
  const totals = useMemo(() => {
    let lkr = 0; let usd = 0;
    periodRows.forEach(r => {
      if (r.totalLKR) lkr += r.totalLKR;
      if (r.totalUSD) usd += r.totalUSD;
    });
    const combined = lkr + usd * USD_TO_LKR;
    return { lkr, usd, combined, count: periodRows.length };
  }, [periodRows]);

  const allTimeTotals = useMemo(() => {
    let lkr = 0; let usd = 0;
    rows.forEach(r => {
      if (r.totalLKR) lkr += r.totalLKR;
      if (r.totalUSD) usd += r.totalUSD;
    });
    return { lkr, usd, combined: lkr + usd * USD_TO_LKR };
  }, [rows]);

  // ── Filtered + sorted table rows (completed + tourist-cancelled) ──────
  const displayed = useMemo(() => {
    // Show completed visits and tourist-cancelled (non-refunded, still count as revenue)
    let list = periodRows.filter(r => r.status === 'completed' || r.cancelledBy === 'tourist');
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

  const completedCount = rows.filter(r => r.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
        <Loader2 className="animate-spin" size={22} /> Loading payment data…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center text-sm">{loadError}</div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Wallet size={22} className="text-[#2D6A4F]" />
        <h2 className="text-2xl font-bold text-[#1B4332]">Payments & Revenue</h2>
      </div>

      {/* ── All-time Total Revenue ── */}
      <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="opacity-80" />
          <span className="text-sm font-semibold uppercase tracking-widest opacity-80">All-Time Total Revenue</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Local (LKR) */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <MapPin size={14} />
              <span className="text-xs font-semibold uppercase tracking-wide">Local Revenue</span>
              <span className="text-xs opacity-60">(Sri Lankan Tourists · LKR)</span>
            </div>
            <p className="text-3xl font-bold">Rs {allTimeTotals.lkr.toLocaleString()}</p>
          </div>
          {/* Foreign (USD) */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Globe size={14} />
              <span className="text-xs font-semibold uppercase tracking-wide">Foreign Revenue</span>
              <span className="text-xs opacity-60">(International Tourists · USD)</span>
            </div>
            <p className="text-3xl font-bold">$ {allTimeTotals.usd.toLocaleString()}</p>
          </div>
        </div>
        {/* Combined total */}
        <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <CheckCircle size={15} />
            <span>{completedCount} completed booking{completedCount !== 1 ? 's' : ''} in total</span>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
            <DollarSign size={16} className="opacity-80" />
            <div>
              <p className="text-xs opacity-70 font-semibold uppercase tracking-wide">Total Revenue (LKR equiv.)</p>
              <p className="text-xl font-bold">Rs {allTimeTotals.combined.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Period tabs ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-1.5 flex gap-1 w-fit mb-5">
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

      {/* ── Period revenue breakdown ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Local */}
        <div className="bg-[#f0faf4] border border-[#B7E4C7] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 text-[#2D6A4F] opacity-80">
            <MapPin size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">Local · LKR</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">{PERIOD_LABELS[period]}</p>
          <p className="text-xl font-bold text-[#2D6A4F]">Rs {totals.lkr.toLocaleString()}</p>
        </div>
        {/* Foreign */}
        <div className="bg-[#f0faf4] border border-[#B7E4C7] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 text-[#2D6A4F] opacity-80">
            <Globe size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">Foreign · USD</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">{PERIOD_LABELS[period]}</p>
          <p className="text-xl font-bold text-[#2D6A4F]">$ {totals.usd.toLocaleString()}</p>
        </div>
        {/* Combined total */}
        <div className="bg-[#1B4332] text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <DollarSign size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">Total Revenue</span>
          </div>
          <p className="text-xs opacity-60 mb-1">{PERIOD_LABELS[period]} · LKR equiv.</p>
          <p className="text-xl font-bold">Rs {totals.combined.toLocaleString()}</p>
          <p className="text-xs opacity-50 mt-1">Local + Foreign (×{USD_TO_LKR})</p>
        </div>
        {/* Bookings */}
        <div className="bg-[#f0faf4] border border-[#B7E4C7] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 text-[#2D6A4F] opacity-80">
            <CheckCircle size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">Bookings</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">{PERIOD_LABELS[period]}</p>
          <p className="text-xl font-bold text-[#2D6A4F]">{totals.count}</p>
        </div>
      </div>

      {/* ── Search + sort ── */}
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

      {/* ── Payment rows ── */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-medium">{search ? 'No results match your search.' : `No payments in ${PERIOD_LABELS[period].toLowerCase()}.`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(r => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm hover:border-gray-200 transition">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F] font-bold shrink-0">
                  {(r.touristName || 'G')[0].toUpperCase()}
                </div>

                {/* Main */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#1B4332]">{r.touristName}</p>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      r.status === 'completed'        ? 'bg-green-100 text-green-800'  :
                      r.cancelledBy === 'tourist'     ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-100 text-blue-800'
                    }`}>
                      {r.status === 'completed'    ? 'Completed'                  :
                       r.cancelledBy === 'tourist' ? 'Cancelled by Customer'      :
                                                     'Upcoming'}
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

                {/* Payment amounts */}
                <div className="text-right shrink-0">
                  {r.totalLKR != null && (
                    <p className="font-bold text-lg text-[#2D6A4F]">Rs {r.totalLKR.toLocaleString()}</p>
                  )}
                  {r.totalUSD != null && (
                    <p className={`font-bold ${r.totalLKR != null ? 'text-sm text-gray-500' : 'text-lg text-[#2D6A4F]'}`}>
                      $ {r.totalUSD.toLocaleString()}
                    </p>
                  )}
                  {r.totalLKR == null && r.totalUSD == null && (
                    <p className="text-gray-400 text-sm">—</p>
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
