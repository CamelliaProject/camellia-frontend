import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import SignInModal from '../../components/layout/SignInModal';
import { plantationApi } from '../../services/api';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  Users,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';

const USD_TO_LKR = 330;
const TODAY = new Date().toISOString().split('T')[0];
const TOMORROW = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
})();
const MAX_DATE = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().split('T')[0];
})();

type Step = 'experiences' | 'datetime' | 'details';

interface Experience {
  id: string;
  name: string;
  category: string;
  short_description: string;
  detailed_description: string;
  announcement: string;
  price_usd_adult: number;
  price_usd_child: number;
  price_lkr_adult: number;
  price_lkr_child: number;
  images: string[];
  is_active: boolean;
}

const STEP_ORDER: Step[] = ['experiences', 'datetime', 'details'];
const STEP_LABELS: Record<Step, string> = {
  experiences: 'Select Experiences',
  datetime: 'Date & Guests',
  details: 'Your Details',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Hiking & Tea Plucking': 'bg-emerald-100 text-emerald-800',
  'Tea Factory Tour & Tasting': 'bg-amber-100 text-amber-800',
  Cultural: 'bg-purple-100 text-purple-800',
  Adventure: 'bg-blue-100 text-blue-800',
  Relaxation: 'bg-rose-100 text-rose-800',
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700';
}

function formatDate(raw: string) {
  if (!raw) return '';
  return new Date(raw + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_ORDER.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                ${i < idx ? 'bg-[#2D6A4F] text-white' : i === idx ? 'bg-[#52B788] text-white ring-4 ring-[#B7E4C7]' : 'bg-gray-200 text-gray-500'}`}
            >
              {i < idx ? <Check size={14} /> : i + 1}
            </div>
            <span className={`mt-1 text-xs font-medium ${i === idx ? 'text-[#2D6A4F]' : 'text-gray-400'}`}>
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < STEP_ORDER.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 ${i < idx ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Experience card
// ─────────────────────────────────────────────────────────────────────────────
function ExperienceCard({
  exp,
  isSelected,
  currency,
  isResident,
  onToggle,
}: {
  exp: Experience;
  isSelected: boolean;
  currency: 'LKR' | 'USD';
  isResident: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const adultPrice = isResident
    ? (exp.price_lkr_adult || exp.price_usd_adult * USD_TO_LKR)
    : exp.price_usd_adult;
  const childPrice = isResident
    ? (exp.price_lkr_child || exp.price_usd_child * USD_TO_LKR)
    : exp.price_usd_child;
  const symbol = isResident ? 'Rs' : '$';

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isSelected ? 'border-[#2D6A4F] shadow-md' : 'border-gray-200 hover:border-[#52B788]'}`}
    >
      {/* Card header — always visible */}
      <div
        className={`p-4 cursor-pointer ${isSelected ? 'bg-[#f0faf4]' : 'bg-white'}`}
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div
            className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
              ${isSelected ? 'bg-[#2D6A4F] border-[#2D6A4F]' : 'border-gray-400 bg-white'}`}
          >
            {isSelected && <Check size={12} className="text-white" />}
          </div>

          {/* Name + category */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 text-base leading-tight">{exp.name}</h3>
              {exp.category && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${categoryColor(exp.category)}`}>
                  <Tag size={10} />
                  {exp.category}
                </span>
              )}
            </div>
            {exp.short_description && (
              <p className="text-sm text-gray-500 line-clamp-2">{exp.short_description}</p>
            )}
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-lg font-bold text-[#2D6A4F]">
              {symbol} {adultPrice.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">/ adult</div>
            {childPrice > 0 && (
              <div className="text-sm text-gray-600">
                {symbol} {childPrice.toLocaleString()} / child
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable details */}
      {(exp.detailed_description || exp.announcement || (exp.images && exp.images.length > 0)) && (
        <div className={`border-t ${isSelected ? 'border-[#B7E4C7]' : 'border-gray-100'}`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:text-[#2D6A4F] transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide details' : 'View details'}
          </button>

          {expanded && (
            <div className={`px-4 pb-4 ${isSelected ? 'bg-[#f0faf4]' : 'bg-gray-50'}`}>
              {/* Announcement */}
              {exp.announcement && (
                <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{exp.announcement}</span>
                </div>
              )}

              {/* Detailed description */}
              {exp.detailed_description && (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{exp.detailed_description}</p>
              )}

              {/* Images */}
              {exp.images && exp.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {exp.images.slice(0, 3).map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${exp.name} ${i + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking summary sidebar
// ─────────────────────────────────────────────────────────────────────────────
function BookingSummary({
  plantationName,
  selectedExperiences,
  date,
  adults,
  children,
  currency,
  isResident,
  total,
}: {
  plantationName: string;
  selectedExperiences: Experience[];
  date: string;
  adults: number;
  children: number;
  currency: string;
  isResident: boolean;
  total: number;
}) {
  const symbol = isResident ? 'Rs' : '$';
  return (
    <aside className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-24">
      <h3 className="font-bold text-[#1B4332] text-base mb-4">Booking Summary</h3>

      <div className="text-sm text-gray-500 mb-3">
        <span className="font-semibold text-gray-800">{plantationName}</span>
      </div>

      {/* Experiences */}
      {selectedExperiences.length > 0 ? (
        <ul className="space-y-1.5 mb-4">
          {selectedExperiences.map((exp) => {
            const ap = isResident ? (exp.price_lkr_adult || exp.price_usd_adult * USD_TO_LKR) : exp.price_usd_adult;
            const cp = isResident ? (exp.price_lkr_child || exp.price_usd_child * USD_TO_LKR) : exp.price_usd_child;
            const expTotal = ap * adults + cp * children;
            return (
              <li key={exp.id} className="flex justify-between items-start text-sm">
                <span className="text-gray-700 flex-1 mr-2">{exp.name}</span>
                <span className="font-medium text-gray-900 whitespace-nowrap">
                  {symbol} {expTotal.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 italic mb-4">No experiences selected</p>
      )}

      {/* Guests */}
      {(adults > 0 || children > 0) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Users size={14} />
          <span>{adults} adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}</span>
        </div>
      )}

      {/* Date */}
      {date && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Calendar size={14} />
          <span>{formatDate(date)}</span>
        </div>
      )}

      {/* Total */}
      <div className="border-t pt-3 mt-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total ({currency})</span>
          <span className="text-xl font-bold text-[#2D6A4F]">
            {symbol} {total.toLocaleString()}
          </span>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guest counter widget
// ─────────────────────────────────────────────────────────────────────────────
function GuestCounter({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span className="font-medium text-gray-800">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors font-bold"
        >
          −
        </button>
        <span className="w-6 text-center font-bold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border-2 border-[#52B788] bg-[#52B788] flex items-center justify-center text-white hover:bg-[#40916c] hover:border-[#40916c] transition-colors font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function OnePageBooking() {
  const { id: plantationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>('experiences');
  const [plantation, setPlantation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Step 1 state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isResident, setIsResident] = useState(true);

  // Step 2 state
  const [selectedDate, setSelectedDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Step 3 state
  const [details, setDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    nicPassportNumber: '',
    country: '',
    city: '',
    specialNotes: '',
  });

  const currency: 'LKR' | 'USD' = isResident ? 'LKR' : 'USD';
  const symbol = isResident ? 'Rs' : '$';

  // ── Load plantation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!plantationId) { setIsLoading(false); return; }
    const load = async () => {
      try {
        const res = await plantationApi.getById(plantationId);
        setPlantation(res.data?.data ?? null);
      } catch {
        setLoadError('Unable to load plantation details.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [plantationId]);

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) setDetails((d) => ({ ...d, email: user.email }));
  }, [user]);

  // Restore booking state after the user signs in (handles both same-page auth
  // state change and remount after redirect back to this page).
  useEffect(() => {
    if (!isAuthenticated || !plantationId) return;
    const key = `booking_resume_${plantationId}`;
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    try {
      const s = JSON.parse(saved) as {
        step: Step;
        selectedIds: string[];
        isResident: boolean;
        selectedDate: string;
        adults: number;
        children: number;
        details: typeof details;
      };
      sessionStorage.removeItem(key);
      setStep(s.step ?? 'details');
      setSelectedIds(s.selectedIds ?? []);
      setIsResident(s.isResident ?? true);
      setSelectedDate(s.selectedDate ?? '');
      setAdults(s.adults ?? 1);
      setChildren(s.children ?? 0);
      setDetails(s.details ?? { fullName: '', email: user?.email ?? '', phone: '', nicPassportNumber: '', country: '', city: '', specialNotes: '' });
    } catch {
      sessionStorage.removeItem(key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, plantationId]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const experiences: Experience[] = plantation?.experiences ?? [];
  const selected = experiences.filter((e) => selectedIds.includes(e.id));

  const computeTotal = (exps: Experience[] = selected) => {
    let t = 0;
    exps.forEach((exp) => {
      const ap = isResident ? (exp.price_lkr_adult || exp.price_usd_adult * USD_TO_LKR) : exp.price_usd_adult;
      const cp = isResident ? (exp.price_lkr_child || exp.price_usd_child * USD_TO_LKR) : exp.price_usd_child;
      t += ap * adults + cp * children;
    });
    return t;
  };

  // ── Navigation helpers ───────────────────────────────────────────────────
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  const goToDatetime = () => {
    setStep('datetime');
    scrollTop();
  };

  const isDateTooSoon = selectedDate === TODAY;

  const goToDetails = () => {
    if (!selectedDate || isDateTooSoon) return;
    setStep('details');
    scrollTop();
  };

  const goBack = () => {
    setStep((s) => {
      const i = STEP_ORDER.indexOf(s);
      return i > 0 ? STEP_ORDER[i - 1] : s;
    });
    scrollTop();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      // Persist all booking state so it survives sign-in redirect / re-mount.
      sessionStorage.setItem(
        `booking_resume_${plantationId}`,
        JSON.stringify({ step: 'details', selectedIds, isResident, selectedDate, adults, children, details })
      );
      setIsSignInOpen(true);
      return;
    }

    const total = computeTotal();
    navigate('/payment', {
      state: {
        bookingSummary: {
          plantationId: plantation.id,
          plantationName: plantation.name,
          experiences: selected,
          date: selectedDate,
          adults,
          children,
          totalPrice: total,
          currency,
        },
        touristDetails: {
          fullName: details.fullName,
          email: details.email,
          phone: details.phone,
          nicPassportNumber: details.nicPassportNumber,
          country: details.country,
          city: details.city,
          notes: details.specialNotes,
        },
      },
    });
  };

  // ── Loading / error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="py-24 flex flex-col items-center justify-center gap-4 text-[#1B4332]">
          <Loader2 className="animate-spin" size={40} />
          <p className="text-lg font-medium">Loading plantation details…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!plantation) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="py-24 px-12 text-center">
          <h1 className="text-3xl font-bold mb-4 text-[#1B4332]">Plantation not found</h1>
          {loadError && <p className="text-red-600 mb-6">{loadError}</p>}
          <button onClick={() => navigate('/plantations')} className="bg-[#2D6A4F] text-white px-6 py-3 rounded-lg hover:bg-[#1B4332] transition">
            Back to Plantations
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const total = computeTotal();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans text-[#1B4332]">
      <Navbar />

      <main ref={topRef} className="py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <button
            onClick={() => navigate(`/plantation/${plantationId}`)}
            className="text-[#2D6A4F] text-sm font-medium hover:underline mb-6 flex items-center gap-1"
          >
            ← Back to {plantation.name}
          </button>

          <h1 className="text-3xl font-bold mb-2">{plantation.name}</h1>
          <p className="text-gray-500 mb-8">{plantation.address}</p>

          {/* Progress bar */}
          <StepBar current={step} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Main content ────────────────────────────────────────── */}
            <div className="lg:col-span-2">

              {/* ════════ STEP 1: EXPERIENCES ════════ */}
              {step === 'experiences' && (
                <div>
                  {/* Residency toggle */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm mb-0.5">Your residency</p>
                      <p className="text-xs text-gray-500">Prices differ for residents and foreign tourists</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsResident(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition border-2 ${isResident ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-300'}`}
                      >
                        Sri Lankan Resident
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsResident(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition border-2 ${!isResident ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-gray-600 border-gray-300'}`}
                      >
                        Foreign Tourist
                      </button>
                    </div>
                  </div>

                  {/* Experience list */}
                  {experiences.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
                      <Info size={36} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No experiences available yet</p>
                      <p className="text-sm mt-1">The plantation admin hasn't added any experiences. Check back soon!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {experiences.map((exp) => (
                        <ExperienceCard
                          key={exp.id}
                          exp={exp}
                          isSelected={selectedIds.includes(exp.id)}
                          currency={currency}
                          isResident={isResident}
                          onToggle={() =>
                            setSelectedIds((prev) =>
                              prev.includes(exp.id) ? prev.filter((x) => x !== exp.id) : [...prev, exp.id]
                            )
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={selectedIds.length === 0}
                      onClick={goToDatetime}
                      className="flex items-center gap-2 bg-[#52B788] hover:bg-[#40916c] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition"
                    >
                      Next: Date & Guests <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ════════ STEP 2: DATE, TIME & GUESTS ════════ */}
              {step === 'datetime' && (
                <div className="space-y-5">
                  {/* Date picker */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <label className="block font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Calendar size={18} className="text-[#2D6A4F]" /> Choose a date
                    </label>
                    <input
                      type="date"
                      min={TOMORROW}
                      max={MAX_DATE}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-gray-800 transition
                        ${isDateTooSoon
                          ? 'border-amber-400 focus:ring-amber-300'
                          : 'border-gray-300 focus:ring-[#52B788]'}`}
                    />
                    {isDateTooSoon && (
                      <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                        <AlertCircle size={15} className="shrink-0" />
                        Bookings must be made at least 1 day in advance. Please select a future date.
                      </div>
                    )}
                  </div>

                  {/* Guest counts */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                      <Users size={18} className="text-[#2D6A4F]" /> Number of guests
                    </p>
                    <p className="text-xs text-gray-500 mb-4">Prices are calculated per person</p>
                    <GuestCounter label="Adults" value={adults} min={1} onChange={setAdults} />
                    <GuestCounter label="Children" value={children} min={0} onChange={setChildren} />
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-3">
                    <button type="button" onClick={goBack} className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-[#2D6A4F] hover:text-[#2D6A4F] font-semibold py-3 rounded-lg transition">
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!selectedDate || isDateTooSoon}
                      onClick={goToDetails}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#52B788] hover:bg-[#40916c] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                    >
                      Next: Your Details <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ════════ STEP 3: PERSONAL DETAILS ════════ */}
              {step === 'details' && (
                <form onSubmit={handleSubmit}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
                    <h2 className="font-bold text-gray-900 text-lg mb-5">Your personal details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(
                        [
                          { name: 'fullName', label: 'Full Name', placeholder: 'John Doe', type: 'text', required: true },
                          { name: 'email', label: 'Email Address', placeholder: 'john@example.com', type: 'email', required: true },
                          { name: 'phone', label: 'Phone Number', placeholder: '+94 77 123 4567', type: 'tel', required: true },
                          { name: 'nicPassportNumber', label: 'NIC / Passport No.', placeholder: 'P1234567890', type: 'text', required: true },
                          { name: 'country', label: 'Country', placeholder: 'Sri Lanka', type: 'text', required: true },
                          { name: 'city', label: 'City', placeholder: 'Colombo', type: 'text', required: true },
                        ] as const
                      ).map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type={field.type}
                            name={field.name}
                            value={details[field.name]}
                            onChange={(e) => setDetails((d) => ({ ...d, [field.name]: e.target.value }))}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] text-gray-800"
                          />
                        </div>
                      ))}

                      {/* Special notes — full width */}
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Special notes (optional)</label>
                        <textarea
                          value={details.specialNotes}
                          onChange={(e) => setDetails((d) => ({ ...d, specialNotes: e.target.value }))}
                          placeholder="Dietary requirements, accessibility needs, special occasions…"
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] text-gray-800 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price recap before payment */}
                  <div className="bg-[#f0faf4] border border-[#B7E4C7] rounded-xl p-5 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Total amount ({currency})</span>
                      <span className="text-2xl font-bold text-[#2D6A4F]">{symbol} {total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selected.length} experience{selected.length !== 1 ? 's' : ''} · {adults} adult{adults !== 1 ? 's' : ''}{children > 0 ? ` · ${children} child${children !== 1 ? 'ren' : ''}` : ''} · {formatDate(selectedDate)}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={goBack} className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-[#2D6A4F] hover:text-[#2D6A4F] font-semibold py-3 rounded-lg transition">
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 rounded-lg transition"
                    >
                      Continue to Payment <ChevronRight size={18} />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Sticky sidebar ──────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <BookingSummary
                plantationName={plantation.name}
                selectedExperiences={selected}
                date={selectedDate}
                adults={adults}
                children={children}
                currency={currency}
                isResident={isResident}
                total={total}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        redirectPath={location.pathname}
      />
    </div>
  );
}
