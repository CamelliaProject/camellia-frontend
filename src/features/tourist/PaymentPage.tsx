import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { paymentApi } from '../../services/api';
import { Calendar, Users, Tag, ShieldCheck, Loader2, AlertCircle, Clock } from 'lucide-react';

function fmt12h(t: string | null | undefined) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(raw: string) {
  if (!raw) return '—';
  const [y, mo, d] = raw.slice(0, 10).split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingSummary, touristDetails } = location.state || {};

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const formRef                 = useRef<HTMLFormElement>(null);
  const [formFields, setFormFields] = useState<Record<string, string> | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  if (!bookingSummary || !touristDetails) {
    navigate('/plantations', { replace: true });
    return null;
  }

  const { plantationId, plantationName, experiences, date, adults, children, totalPrice, currency, usdToLkrRate, bookingTime } = bookingSummary;
  const symbol = currency === 'LKR' ? 'Rs' : '$';

  const handlePayHere = async () => {
    setError(null);
    setLoading(true);
    try {
      const lkrEquivalent = currency === 'LKR'
        ? totalPrice
        : Math.round(totalPrice * (usdToLkrRate ?? 330));

      const payload = {
        plantation_id:    plantationId,
        booking_date:     date,
        num_adults:       adults || 1,
        num_children:     children || 0,
        total_price_usd:  currency === 'USD' ? totalPrice : null,
        total_price_lkr:  lkrEquivalent,
        usd_to_lkr_rate:  currency === 'USD' ? (usdToLkrRate ?? null) : null,
        tourist_full_name:     touristDetails.fullName,
        tourist_email:         touristDetails.email,
        tourist_phone:         touristDetails.phone         || null,
        tourist_country:       touristDetails.country       || null,
        tourist_city:          touristDetails.city          || null,
        tourist_nic_passport:  touristDetails.nicPassportNumber || null,
        special_notes:         touristDetails.notes         || null,
        experience_ids:   Array.isArray(experiences)
          ? experiences.map((e: any) => e.id).filter(Boolean)
          : [],
        booking_time:     bookingTime || null,
        currency,
        amount:     totalPrice,
        first_name: touristDetails.fullName.split(' ')[0],
        last_name:  touristDetails.fullName.split(' ').slice(1).join(' ') || '-',
        address:    touristDetails.city || '',
        city:       touristDetails.city || '',
      };

      const res = await paymentApi.payhereInitiate(payload);
      const { booking_reference, params, checkout_url } = res.data;

      sessionStorage.setItem('payhere_booking', JSON.stringify({
        bookingSummary: { ...bookingSummary, transactionId: booking_reference },
        touristDetails,
        transactionId: booking_reference,
      }));

      setCheckoutUrl(checkout_url);
      setFormFields(params);

      setTimeout(() => formRef.current?.submit(), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to initiate payment. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans text-[#1B4332]">
      <Navbar />

      <main className="py-16 px-4 sm:px-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-1 text-center">Complete Your Booking</h1>
          <p className="text-gray-500 text-center mb-8">Review your details and pay securely via PayHere</p>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-[#1B4332] text-lg mb-4">{plantationName}</h2>

            <div className="space-y-3 text-sm">
              {date && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar size={16} className="text-[#52B788] shrink-0" />
                  <span>{formatDate(date)}</span>
                </div>
              )}
              {bookingTime && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock size={16} className="text-[#52B788] shrink-0" />
                  <span>Visit time: {fmt12h(bookingTime)}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-700">
                <Users size={16} className="text-[#52B788] shrink-0" />
                <span>
                  {adults} adult{adults !== 1 ? 's' : ''}
                  {children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}
                </span>
              </div>
              {Array.isArray(experiences) && experiences.length > 0 && (
                <div className="flex items-start gap-3 text-gray-700">
                  <Tag size={16} className="text-[#52B788] shrink-0 mt-0.5" />
                  <span>{experiences.map((e: any) => e.name || e).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Total ({currency})</span>
              <span className="text-2xl font-bold text-[#2D6A4F]">{symbol} {totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6 text-sm text-gray-700 space-y-1">
            <p><span className="font-medium text-gray-900">Name:</span> {touristDetails.fullName}</p>
            <p><span className="font-medium text-gray-900">Email:</span> {touristDetails.email}</p>
            {touristDetails.phone && (
              <p><span className="font-medium text-gray-900">Phone:</span> {touristDetails.phone}</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handlePayHere}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition text-lg"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Preparing payment…
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                Pay {symbol} {totalPrice.toLocaleString()} with PayHere
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            You will be redirected to PayHere's secure payment page.
            {currency !== 'LKR' && ' Payment is processed in the selected currency.'}
          </p>

          <button
            onClick={() => navigate(`/plantation/${plantationId}/booking`, {
              state: {
                restoreBooking: {
                  step: 'details',
                  selectedIds: Array.isArray(experiences)
                    ? experiences.map((e: any) => e.id).filter(Boolean)
                    : [],
                  isResident: currency === 'LKR',
                  selectedDate: date,
                  adults,
                  children,
                  details: {
                    fullName: touristDetails.fullName || '',
                    email: touristDetails.email || '',
                    phone: touristDetails.phone || '',
                    nicPassportNumber: touristDetails.nicPassportNumber || '',
                    country: touristDetails.country || '',
                    city: touristDetails.city || '',
                    specialNotes: touristDetails.notes || '',
                  },
                },
              },
            })}
            disabled={loading}
            className="w-full mt-3 text-sm text-gray-500 hover:text-[#2D6A4F] transition"
          >
            ← Go back
          </button>
        </div>
      </main>

      <Footer />

      {formFields && (
        <form
          ref={formRef}
          method="POST"
          action={checkoutUrl}
          style={{ display: 'none' }}
        >
          {Object.entries(formFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
}
