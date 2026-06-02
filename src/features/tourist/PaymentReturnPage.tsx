import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { paymentApi } from '../../services/api';

type Status = 'success' | 'pending' | 'cancelled' | 'failed' | 'unknown';

function resolveStatus(params: URLSearchParams): Status {
  if (params.get('cancelled') === 'true') return 'cancelled';
  const code = params.get('status_code');
  if (code === '2')  return 'success';
  if (code === '0')  return 'pending';
  if (code === '-1') return 'cancelled';
  if (code === '-2') return 'failed';
  // PayHere sandbox often omits status_code on the return URL.
  // If order_id is present and not cancelled, the payment completed.
  if (params.get('order_id')) return 'success';
  return 'unknown';
}

export default function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status] = useState<Status>(() => resolveStatus(searchParams));

  const orderId    = searchParams.get('order_id');
  const paymentId  = searchParams.get('payment_id');
  const message    = searchParams.get('message');

  // Retrieve stored booking info (set before redirecting to PayHere)
  const [stored] = useState<any>(() => {
    try {
      const raw = sessionStorage.getItem('payhere_booking');
      if (raw) {
        const parsed = JSON.parse(raw);
        sessionStorage.removeItem('payhere_booking');
        return parsed;
      }
    } catch { /* ignore */ }
    return null;
  });

  const transactionId = orderId || stored?.transactionId || '—';

  // On success: save payment_id to backend, then navigate to confirmation
  useEffect(() => {
    if (status !== 'success') return;

    // Save the PayHere payment_id so the backend can issue refunds if needed
    if (transactionId && transactionId !== '—' && paymentId) {
      paymentApi.payheresSavePayment(transactionId, paymentId).catch(() => {/* non-critical */});
    }

    if (stored) {
      const timer = setTimeout(() => {
        navigate('/booking-confirmation', {
          state: {
            bookingSummary: stored.bookingSummary,
            touristDetails: stored.touristDetails,
            transactionId,
          },
          replace: true,
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status, stored, navigate, transactionId, paymentId]);

  const CONFIG: Record<Status, {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    bg: string;
    border: string;
  }> = {
    success: {
      icon: <CheckCircle2 size={64} className="text-green-500 mx-auto" />,
      title: 'Payment Successful!',
      subtitle: 'Your booking is confirmed. Redirecting you to the confirmation page…',
      bg: 'bg-green-50', border: 'border-green-200',
    },
    pending: {
      icon: <Clock size={64} className="text-amber-400 mx-auto" />,
      title: 'Payment Pending',
      subtitle: 'Your payment is being processed. We will notify you once it is confirmed.',
      bg: 'bg-amber-50', border: 'border-amber-200',
    },
    cancelled: {
      icon: <XCircle size={64} className="text-gray-400 mx-auto" />,
      title: 'Payment Cancelled',
      subtitle: 'You cancelled the payment. Your booking has not been confirmed.',
      bg: 'bg-gray-50', border: 'border-gray-200',
    },
    failed: {
      icon: <AlertCircle size={64} className="text-red-500 mx-auto" />,
      title: 'Payment Failed',
      subtitle: message || 'Something went wrong with your payment. Please try again.',
      bg: 'bg-red-50', border: 'border-red-200',
    },
    unknown: {
      icon: <AlertCircle size={64} className="text-gray-400 mx-auto" />,
      title: 'Payment Status Unknown',
      subtitle: 'We could not determine the status of your payment. Please check your email or contact support.',
      bg: 'bg-gray-50', border: 'border-gray-200',
    },
  };

  const cfg = CONFIG[status];

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans text-[#1B4332]">
      <Navbar />

      <main className="py-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className={`${cfg.bg} border-2 ${cfg.border} rounded-2xl p-10 text-center`}>
            <div className="mb-5">{cfg.icon}</div>
            <h1 className="text-2xl font-bold mb-2">{cfg.title}</h1>
            <p className="text-gray-600 text-sm mb-6">{cfg.subtitle}</p>

            {transactionId && transactionId !== '—' && (
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-6 text-sm">
                <p className="text-gray-500 text-xs mb-0.5">Booking / Order Reference</p>
                <p className="font-bold text-[#1B4332] font-mono">{transactionId}</p>
                {paymentId && (
                  <>
                    <p className="text-gray-500 text-xs mt-2 mb-0.5">PayHere Payment ID</p>
                    <p className="font-mono text-gray-700 text-sm">{paymentId}</p>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {status === 'success' && (
                <button
                  onClick={() => stored
                    ? navigate('/booking-confirmation', {
                        state: {
                          bookingSummary: stored.bookingSummary,
                          touristDetails: stored.touristDetails,
                          transactionId,
                        },
                        replace: true,
                      })
                    : navigate('/dashboard')}
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-3 rounded-xl transition"
                >
                  View Booking Confirmation
                </button>
              )}

              {(status === 'cancelled' || status === 'failed') && (
                <button
                  onClick={() => navigate(-2)}
                  className="w-full bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 rounded-xl transition"
                >
                  Try Again
                </button>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 rounded-xl transition text-sm"
              >
                Go to My Dashboard
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Questions? Contact us at{' '}
            <a href="mailto:camelliaceylonplatform@gmail.com" className="text-[#2D6A4F] hover:underline">
              camelliaceylonplatform@gmail.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
