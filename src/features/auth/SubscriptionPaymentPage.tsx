import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export default function SubscriptionPaymentPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const cancelled = searchParams.get('cancelled') === 'true';

  const [status, setStatus] = useState<'idle' | 'loading' | 'redirecting' | 'error'>('idle');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const initiatePayment = async () => {
    if (!token) { setError('Invalid payment link.'); setStatus('error'); return; }
    setStatus('loading');
    setError('');
    try {
      const res = await apiClient.post('/payments/subscription/initiate', { token });
      const { params, checkout_url } = res.data;
      setFormData(params);
      setCheckoutUrl(checkout_url);
      setStatus('redirecting');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to initiate payment. The link may be expired or already used.');
      setStatus('error');
    }
  };


  useEffect(() => {
    if (status === 'redirecting' && formData && formRef.current) {
      formRef.current.submit();
    }
  }, [status, formData]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h2>
          <p className="text-gray-500 text-sm">This payment link is missing required information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4">
      {/* Hidden PayHere form */}
      {formData && (
        <form ref={formRef} method="POST" action={checkoutUrl} style={{ display: 'none' }}>
          {Object.entries(formData).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🌿</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1B4332] mb-2">Subscription Payment</h1>
        <p className="text-gray-500 text-sm mb-8">
          Complete your subscription payment to activate your plantation listing and receive your login credentials.
        </p>

        {cancelled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
            Payment was cancelled. You can try again below.
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {status === 'redirecting' ? (
          <div className="flex items-center justify-center gap-3 py-4 text-[#2D6A4F]">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="font-semibold">Redirecting to PayHere…</span>
          </div>
        ) : (
          <button
            onClick={initiatePayment}
            disabled={status === 'loading'}
            className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition text-lg flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Preparing payment…
              </>
            ) : 'Pay Subscription Fee →'}
          </button>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Secured by PayHere · Your listing activates immediately after payment
        </p>
      </div>
    </div>
  );
}
