import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import SignInModal from '../../components/layout/SignInModal';
import { plantationApi, settingsApi, availabilityApi } from '../../services/api';
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
  Clock,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { isValidPhoneNumber, getCountryCallingCode } from 'libphonenumber-js/min';
import type { CountryCode } from 'libphonenumber-js/min';
import { COUNTRIES } from '../../constants/countries';
import { PASSPORT_PATTERNS, PASSPORT_FALLBACK } from '../../constants/passportPatterns';

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

interface TimeSlot {
  id: string;
  slot_time: string;
  capacity: number;
  booked: number;
}

interface AvailabilitySettings {
  unavailable_days: number[];
  closing_dates: { close_date: string }[];
}

function fmt12h(time: string) {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const DOW_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function formatDate(raw: string) {
  if (!raw) return '';
  return new Date(raw + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

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

function ExperienceCard({
  exp,
  isSelected,
  isResident,
  usdToLkr,
  onToggle,
}: {
  exp: Experience;
  isSelected: boolean;
  isResident: boolean;
  usdToLkr: number;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const adultPrice = isResident
    ? (exp.price_lkr_adult || exp.price_usd_adult * usdToLkr)
    : exp.price_usd_adult;
  const childPrice = isResident
    ? (exp.price_lkr_child || exp.price_usd_child * usdToLkr)
    : exp.price_usd_child;
  const symbol = isResident ? 'Rs' : '$';

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isSelected ? 'border-[#2D6A4F] shadow-md' : 'border-gray-200 hover:border-[#52B788]'}`}
    >
      <div
        className={`p-4 cursor-pointer ${isSelected ? 'bg-[#f0faf4]' : 'bg-white'}`}
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
              ${isSelected ? 'bg-[#2D6A4F] border-[#2D6A4F]' : 'border-gray-400 bg-white'}`}
          >
            {isSelected && <Check size={12} className="text-white" />}
          </div>

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
              {exp.announcement && (
                <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{exp.announcement}</span>
                </div>
              )}

              {exp.detailed_description && (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{exp.detailed_description}</p>
              )}

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

function BookingSummary({
  plantationName,
  selectedExperiences,
  date,
  adults,
  children,
  currency,
  isResident,
  usdToLkr,
  total,
  selectedTime,
}: {
  plantationName: string;
  selectedExperiences: Experience[];
  date: string;
  adults: number;
  children: number;
  currency: string;
  isResident: boolean;
  usdToLkr: number;
  total: number;
  selectedTime: string;
}) {
  const symbol = isResident ? 'Rs' : '$';
  return (
    <aside className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-24">
      <h3 className="font-bold text-[#1B4332] text-base mb-4">Booking Summary</h3>

      <div className="text-sm text-gray-500 mb-3">
        <span className="font-semibold text-gray-800">{plantationName}</span>
      </div>

      {selectedExperiences.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {selectedExperiences.map((exp) => {
            const ap = isResident ? (exp.price_lkr_adult || exp.price_usd_adult * usdToLkr) : exp.price_usd_adult;
            const cp = isResident ? (exp.price_lkr_child || exp.price_usd_child * usdToLkr) : exp.price_usd_child;
            const expTotal = ap * adults + cp * children;
            return (
              <li key={exp.id} className="text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-700 flex-1 mr-2 leading-tight">{exp.name}</span>
                  <span className="font-medium text-gray-900 whitespace-nowrap">
                    {symbol} {expTotal.toLocaleString()}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 italic mb-4">No experiences selected</p>
      )}

      {(adults > 0 || children > 0) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Users size={14} />
          <span>{adults} adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}</span>
        </div>
      )}

      {date && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Calendar size={14} />
          <span>{formatDate(date)}</span>
        </div>
      )}

      {selectedTime && (
        <div className="flex items-center gap-2 text-sm text-[#2D6A4F] mb-4">
          <Clock size={14} />
          <span className="font-medium">{fmt12h(selectedTime)}</span>
        </div>
      )}

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
  const [usdToLkr, setUsdToLkr] = useState(330);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isResident, setIsResident] = useState(true);

  const [selectedDate, setSelectedDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [availSettings, setAvailSettings] = useState<AvailabilitySettings | null>(null);

  const [plantationSlots, setPlantationSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');

  const [details, setDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    nicPassportNumber: '',
    country: '',
    city: '',
    specialNotes: '',
  });
  const [detailErrors, setDetailErrors] = useState<Partial<Record<
    'fullName' | 'email' | 'phone' | 'nicPassportNumber' | 'country' | 'city',
    string
  >>>({});
  const emailManuallyEditedRef = useRef(false);

  const currency: 'LKR' | 'USD' = isResident ? 'LKR' : 'USD';
  const symbol = isResident ? 'Rs' : '$';

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

  useEffect(() => {
    settingsApi.getExchangeRate()
      .then(res => { if (res.data?.usd_to_lkr) setUsdToLkr(res.data.usd_to_lkr); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!plantationId) return;
    availabilityApi.getSettings(plantationId)
      .then(res => setAvailSettings(res.data?.data ?? null))
      .catch(() => {});
  }, [plantationId]);

  useEffect(() => {
    if (user?.email && !emailManuallyEditedRef.current) {
      setDetails((d) => ({ ...d, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    const rb = (location.state as any)?.restoreBooking;
    if (!rb) return;
    setSelectedIds(rb.selectedIds ?? []);
    setIsResident(rb.isResident ?? true);
    setSelectedDate(rb.selectedDate ?? '');
    setAdults(rb.adults ?? 1);
    setChildren(rb.children ?? 0);
    if (rb.details) {
      setDetails(rb.details);
      if (rb.details.email) emailManuallyEditedRef.current = true;
    }
    setStep(rb.step ?? 'details');
    navigate(location.pathname, { replace: true, state: {} });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDate || !plantationId) {
      setPlantationSlots([]);
      setSelectedTime('');
      return;
    }
    setLoadingSlots(true);
    setSelectedTime('');
    availabilityApi.getSlotAvailability(plantationId, selectedDate)
      .then(res => { setPlantationSlots(res.data?.data ?? []); })
      .catch(() => { setPlantationSlots([]); })
      .finally(() => { setLoadingSlots(false); });
  }, [selectedDate, plantationId]);

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
      if (s.details?.email) emailManuallyEditedRef.current = true;
    } catch {
      sessionStorage.removeItem(key);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, plantationId]);

  const experiences: Experience[] = plantation?.experiences ?? [];
  const selected = experiences.filter((e) => selectedIds.includes(e.id));

  const computeTotal = (exps: Experience[] = selected) => {
    let t = 0;
    exps.forEach((exp) => {
      const ap = isResident ? (exp.price_lkr_adult || exp.price_usd_adult * usdToLkr) : exp.price_usd_adult;
      const cp = isResident ? (exp.price_lkr_child || exp.price_usd_child * usdToLkr) : exp.price_usd_child;
      t += ap * adults + cp * children;
    });
    return t;
  };

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  const goToDatetime = () => {
    setStep('datetime');
    scrollTop();
  };

  const isDateTooSoon = selectedDate === TODAY;

  const isUnavailableDay = (() => {
    if (!selectedDate || !availSettings) return false;
    const dow = new Date(selectedDate + 'T00:00:00').getDay();
    return availSettings.unavailable_days.includes(dow);
  })();

  const isClosingDate = (() => {
    if (!selectedDate || !availSettings) return false;
    return availSettings.closing_dates.some(cd => String(cd.close_date).slice(0, 10) === selectedDate);
  })();

  const dateBlockedReason = isUnavailableDay
    ? `The plantation is closed on ${DOW_NAMES[new Date(selectedDate + 'T00:00:00').getDay()]}s.`
    : isClosingDate
      ? 'The plantation is closed on this date.'
      : null;

  const totalGuests = adults + children;

  const hasAnySlots = plantationSlots.length > 0;
  const completelyFull = hasAnySlots && plantationSlots.every(s => s.capacity - s.booked < totalGuests);

  const handlePickTime = (time: string) => {
    setSelectedTime(prev => prev === time ? '' : time);
  };

  const allSlotsValid = (() => {
    if (!hasAnySlots) return true;
    if (completelyFull) return false;
    if (!selectedTime) return false;
    const slot = plantationSlots.find(s => s.slot_time === selectedTime);
    return !!slot && slot.capacity - slot.booked >= totalGuests;
  })();

  const goToDetails = () => {
    if (!selectedDate || isDateTooSoon || dateBlockedReason || !allSlotsValid || loadingSlots) return;
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

  const clearError = (field: keyof typeof detailErrors) =>
    setDetailErrors(e => ({ ...e, [field]: undefined }));

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-800 transition ${
      hasError
        ? 'border-red-400 focus:ring-red-300 bg-red-50'
        : 'border-gray-300 focus:ring-[#52B788]'
    }`;

  const selectClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-800 bg-white transition ${
      hasError
        ? 'border-red-400 focus:ring-red-300 bg-red-50'
        : 'border-gray-300 focus:ring-[#52B788]'
    }`;

  const phoneCountryName = isResident ? 'Sri Lanka' : details.country;
  const phoneCountryCode = COUNTRIES.find(c => c.name === phoneCountryName)?.code as CountryCode | undefined;
  const dialCode = (() => {
    try { return phoneCountryCode ? '+' + getCountryCallingCode(phoneCountryCode) : ''; }
    catch { return ''; }
  })();

  const passportFormat = isResident
    ? undefined
    : (phoneCountryCode ? (PASSPORT_PATTERNS[phoneCountryCode] ?? PASSPORT_FALLBACK) : undefined);

  const validateDetails = (): boolean => {
    const errs: typeof detailErrors = {};

    if (!details.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (details.fullName.trim().length < 2) {
      errs.fullName = 'Enter your full name (at least 2 characters).';
    }

    if (!details.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }

    if (!isResident && !details.country) {
      errs.country = 'Please select your country.';
      errs.phone = 'Select your country first so we can validate your phone number.';
    } else if (!details.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else {
      const fullPhone = dialCode ? dialCode + details.phone.trim() : details.phone.trim();
      try {
        if (!isValidPhoneNumber(fullPhone, phoneCountryCode)) {
          errs.phone = `Not a valid ${phoneCountryName} phone number — enter local digits only (e.g. 77 123 4567).`;
        }
      } catch {
        errs.phone = 'Enter a valid phone number.';
      }
    }

    if (!details.nicPassportNumber.trim()) {
      errs.nicPassportNumber = isResident ? 'NIC number is required.' : 'Passport number is required.';
    } else if (isResident) {
      if (!/^\d{9}[VvXx]$|^\d{12}$/.test(details.nicPassportNumber.trim())) {
        errs.nicPassportNumber = 'Enter a valid Sri Lankan NIC — old format: 123456789V, new: 200012345678.';
      }
    } else {
      const fmt = passportFormat ?? PASSPORT_FALLBACK;
      if (!fmt.pattern.test(details.nicPassportNumber.trim())) {
        const countryLabel = details.country ? `${details.country} ` : '';
        errs.nicPassportNumber = `Invalid ${countryLabel}passport format. Expected: ${fmt.hint}.`;
      }
    }

    if (!details.city.trim()) {
      errs.city = 'City is required.';
    } else if (details.city.trim().length < 2) {
      errs.city = 'Enter a valid city name (at least 2 characters).';
    } else if (!/^[\p{L}\s\-'.]+$/u.test(details.city.trim())) {
      errs.city = 'City name must contain only letters, spaces, hyphens, or apostrophes.';
    }

    setDetailErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDetails()) return;

    if (!isAuthenticated) {
      sessionStorage.setItem(
        `booking_resume_${plantationId}`,
        JSON.stringify({ step: 'details', selectedIds, isResident, selectedDate, adults, children, details })
      );
      setIsSignInOpen(true);
      return;
    }

    const total = computeTotal();
    const effectiveCountry = isResident ? 'Sri Lanka' : details.country;
    const effectivePhone = dialCode && details.phone.trim()
      ? dialCode + details.phone.trim()
      : details.phone;

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
          usdToLkrRate: usdToLkr,
          bookingTime: selectedTime || null,
        },
        touristDetails: {
          fullName: details.fullName,
          email: details.email,
          phone: effectivePhone,
          nicPassportNumber: details.nicPassportNumber,
          country: effectiveCountry,
          city: details.city,
          notes: details.specialNotes,
        },
      },
    });
  };

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

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans text-[#1B4332]">
      <Navbar />

      <main ref={topRef} className="py-10 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(`/plantation/${plantationId}`)}
            className="text-[#2D6A4F] text-sm font-medium hover:underline mb-6 flex items-center gap-1"
          >
            ← Back to {plantation.name}
          </button>

          <h1 className="text-3xl font-bold mb-2">{plantation.name}</h1>
          <p className="text-gray-500 mb-8">{plantation.address}</p>

          <StepBar current={step} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              {step === 'experiences' && (
                <div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm mb-0.5">Your residency</p>
                      <p className="text-xs text-gray-500">
                        Prices differ for residents and foreign tourists
                        {!isResident && (
                          <span className="ml-1 text-[#2D6A4F] font-medium">· Today: 1 USD = Rs {usdToLkr.toLocaleString()}</span>
                        )}
                      </p>
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
                          isResident={isResident}
                          usdToLkr={usdToLkr}
                          onToggle={() =>
                            setSelectedIds((prev) =>
                              prev.includes(exp.id) ? prev.filter((x) => x !== exp.id) : [...prev, exp.id]
                            )
                          }
                        />
                      ))}
                    </div>
                  )}

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

              {step === 'datetime' && (
                <div className="space-y-5">
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
                    {!isDateTooSoon && dateBlockedReason && (
                      <div className="mt-2 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                        <XCircle size={15} className="shrink-0" />
                        {dateBlockedReason} Please choose a different date.
                      </div>
                    )}
                  </div>

                  {selectedDate && !isDateTooSoon && !dateBlockedReason && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <p className="font-semibold text-gray-800 mb-0.5 flex items-center gap-2">
                        <Clock size={18} className="text-[#2D6A4F]" /> Choose Your Arrival Time
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Select an arrival time — all your chosen experiences start from this time.
                      </p>

                      {loadingSlots ? (
                        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                          <Loader2 size={16} className="animate-spin" /> Checking availability…
                        </div>
                      ) : !hasAnySlots ? (
                        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          No fixed time slots for this day — you're welcome to arrive at any time.
                        </div>
                      ) : completelyFull ? (
                        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                          <XCircle size={15} className="shrink-0 mt-0.5" />
                          All time slots are fully booked for {formatDate(selectedDate)}. Please choose a different date.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {plantationSlots.map((slot) => {
                            const avail = slot.capacity - slot.booked;
                            const isFull = avail < totalGuests;
                            const isSelected = selectedTime === slot.slot_time;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={isFull}
                                onClick={() => handlePickTime(slot.slot_time)}
                                className={`flex flex-col items-center min-w-[90px] px-5 py-3 rounded-xl border-2 text-sm transition-all
                                  ${isFull
                                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-55'
                                    : isSelected
                                      ? 'border-[#2D6A4F] bg-[#f0faf4] text-[#1B4332] shadow-md ring-2 ring-[#B7E4C7]'
                                      : 'border-gray-200 bg-white text-gray-700 hover:border-[#52B788] hover:shadow-sm'
                                  }`}
                              >
                                <span className="font-bold text-base">{fmt12h(slot.slot_time)}</span>
                                {isFull ? (
                                  <span className="text-xs mt-1 text-red-400 font-medium">Full</span>
                                ) : avail <= 3 ? (
                                  <span className="text-xs mt-1 text-amber-600 font-medium">{avail} spot{avail !== 1 ? 's' : ''} left</span>
                                ) : (
                                  <span className="text-xs mt-1 text-emerald-600">{avail} spots</span>
                                )}
                                {isSelected && <Check size={13} className="mt-1.5 text-[#2D6A4F]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                      <Users size={18} className="text-[#2D6A4F]" /> Number of guests
                    </p>
                    <p className="text-xs text-gray-500 mb-4">Prices are calculated per person</p>
                    <GuestCounter label="Adults" value={adults} min={1} onChange={setAdults} />
                    <GuestCounter label="Children" value={children} min={0} onChange={setChildren} />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={goBack} className="flex-1 border-2 border-gray-300 text-gray-700 hover:border-[#2D6A4F] hover:text-[#2D6A4F] font-semibold py-3 rounded-lg transition">
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!selectedDate || isDateTooSoon || !!dateBlockedReason || loadingSlots || !allSlotsValid}
                      onClick={goToDetails}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#52B788] hover:bg-[#40916c] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                    >
                      Next: Your Details <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {step === 'details' && (
                <form onSubmit={handleSubmit}>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
                    <h2 className="font-bold text-gray-900 text-lg mb-5">Your personal details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.fullName}
                          onChange={(e) => { setDetails(d => ({ ...d, fullName: e.target.value })); clearError('fullName'); }}
                          placeholder="John Doe"
                          maxLength={100}
                          className={inputClass(!!detailErrors.fullName)}
                        />
                        {detailErrors.fullName && <p className="mt-1 text-xs text-red-600">{detailErrors.fullName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={details.email}
                          onChange={(e) => { emailManuallyEditedRef.current = true; setDetails(d => ({ ...d, email: e.target.value })); clearError('email'); }}
                          placeholder="john@example.com"
                          maxLength={254}
                          className={inputClass(!!detailErrors.email)}
                        />
                        {detailErrors.email && <p className="mt-1 text-xs text-red-600">{detailErrors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Country <span className="text-red-500">*</span>
                        </label>
                        {isResident ? (
                          <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 flex items-center gap-2 cursor-not-allowed select-none">
                            <span>🇱🇰</span>
                            <span className="flex-1 font-medium">Sri Lanka</span>
                            <span className="text-xs text-gray-400">Locked · Resident</span>
                          </div>
                        ) : (
                          <select
                            value={details.country}
                            onChange={(e) => {
                              setDetails(d => ({ ...d, country: e.target.value, phone: '' }));
                              clearError('country');
                              clearError('phone');
                            }}
                            className={selectClass(!!detailErrors.country)}
                          >
                            <option value="">Select your country</option>
                            {COUNTRIES.filter(c => c.code !== 'LK').map(c => (
                              <option key={c.code} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        )}
                        {detailErrors.country && <p className="mt-1 text-xs text-red-600">{detailErrors.country}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex">
                          <div className={`flex items-center justify-center min-w-[68px] px-3 border border-r-0 rounded-l-lg text-sm font-mono font-semibold select-none ${
                            detailErrors.phone
                              ? 'border-red-400 bg-red-50 text-red-500'
                              : (isResident || details.country)
                                ? 'border-gray-300 bg-gray-100 text-gray-700'
                                : 'border-gray-300 bg-gray-50 text-gray-400'
                          }`}>
                            {dialCode || '+—'}
                          </div>
                          <input
                            type="tel"
                            value={details.phone}
                            onChange={(e) => { setDetails(d => ({ ...d, phone: e.target.value })); clearError('phone'); }}
                            placeholder={isResident || details.country ? '77 123 4567' : 'Select country first'}
                            disabled={!isResident && !details.country}
                            maxLength={15}
                            className={`flex-1 px-4 py-2.5 border rounded-r-lg focus:outline-none focus:ring-2 text-gray-800 transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                              detailErrors.phone
                                ? 'border-red-400 focus:ring-red-300 bg-red-50'
                                : 'border-gray-300 focus:ring-[#52B788]'
                            }`}
                          />
                        </div>
                        {detailErrors.phone && <p className="mt-1 text-xs text-red-600">{detailErrors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {isResident ? 'NIC Number' : 'Passport Number'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.nicPassportNumber}
                          onChange={(e) => { setDetails(d => ({ ...d, nicPassportNumber: e.target.value })); clearError('nicPassportNumber'); }}
                          placeholder={isResident ? '123456789V or 200012345678' : 'P1234567'}
                          maxLength={isResident ? 12 : (passportFormat?.maxLength ?? 20)}
                          className={inputClass(!!detailErrors.nicPassportNumber)}
                        />
                        {detailErrors.nicPassportNumber
                          ? <p className="mt-1 text-xs text-red-600">{detailErrors.nicPassportNumber}</p>
                          : isResident
                            ? <p className="mt-1 text-xs text-gray-400">Old format: 9 digits + V/X · New format: 12 digits</p>
                            : passportFormat && (
                              <p className="mt-1 text-xs text-gray-400">Format: {passportFormat.hint}</p>
                            )
                        }
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={details.city}
                          onChange={(e) => { setDetails(d => ({ ...d, city: e.target.value })); clearError('city'); }}
                          placeholder="Colombo"
                          maxLength={100}
                          className={inputClass(!!detailErrors.city)}
                        />
                        {detailErrors.city && <p className="mt-1 text-xs text-red-600">{detailErrors.city}</p>}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Special notes (optional)</label>
                        <textarea
                          value={details.specialNotes}
                          onChange={(e) => setDetails((d) => ({ ...d, specialNotes: e.target.value }))}
                          placeholder="Dietary requirements, accessibility needs, special occasions…"
                          rows={3}
                          maxLength={500}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] text-gray-800 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {isResident && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                      <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Sri Lankan resident pricing is verified at the gate — please bring the physical NIC matching the number above. If it doesn't match, you'll be asked to pay the foreign tourist rate on-site.
                      </p>
                    </div>
                  )}

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

            <div className="lg:col-span-1">
              <BookingSummary
                plantationName={plantation.name}
                selectedExperiences={selected}
                date={selectedDate}
                adults={adults}
                children={children}
                currency={currency}
                isResident={isResident}
                usdToLkr={usdToLkr}
                total={total}
                selectedTime={selectedTime}
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
