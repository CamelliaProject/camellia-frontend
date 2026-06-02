import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export default function SubscriptionRenewalPage() {
  const [searchParams] = useSearchParams();
  const subId    = searchParams.get('sub') || '';
  const cancelled = searchParams.get('cancelled') === 'true';

  const [info, setInfo]     = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'redirecting' | 'error'>('loading');
  const [error, setError]   = useState('');
  const [formData, setFormData] = useState<Record<string, string> | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!subId) { setError('Invalid renewal link.'); setStatus('error'); return; }
    apiClient.post('/payments/subscription-renew/initiate', { subscription_id: subId })
      .then(res => { setInfo(res.data); setStatus('ready'); })
      .catch(err => { setError(err?.response?.data?.error || 'Failed to load renewal details.'); setStatus('error'); });
  }, [subId]);

  const pay = () => {
    if (!info) return;
    setFormData(info.params);
    setCheckoutUrl(info.checkout_url);
    setStatus('redirecting');
  };

  useEffect(() => {
    if (status === 'redirecting' && formData && formRef.current) formRef.current.submit();
  }, [status, formData]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (status === 'loading') return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center">
      <svg className="w-8 h-8 animate-spin text-[#2D6A4F]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4">
      {formData && (
        <form ref={formRef} method="POST" action={checkoutUrl} style={{ display: 'none' }}>
          {Object.entries(formData).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🌿</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1B4332] mb-2">Renew Subscription</h1>

        {status === 'error' ? (
          <p className="text-red-600 text-sm mt-4">{error}</p>
        ) : (
          <>
            {cancelled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
                Payment was cancelled. Try again below.
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-2">
              <Row label="Plantation" value={info?.plantation_name} />
              <Row label="Plan" value={info?.subscription_type === 'pro' ? 'Pro Pack' : 'Starter Pack'} />
              <Row label="Current Expiry" value={info?.end_date ? fmtDate(info.end_date) : '—'} />
              <Row label="Renewal Amount" value={`Rs ${Number(info?.amount || 0).toLocaleString()} / year`} />
            </div>

            {status === 'redirecting' ? (
              <div className="flex items-center justify-center gap-3 py-4 text-[#2D6A4F]">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span className="font-semibold">Redirecting to PayHere…</span>
              </div>
            ) : (
              <button
                onClick={pay}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold py-4 rounded-2xl transition text-lg"
              >
                Pay & Renew for 1 Year →
              </button>
            )}
            <p className="text-xs text-gray-400 mt-4">Secured by PayHere · Subscription extends by 1 year after payment</p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#1B4332]">{value || '—'}</span>
    </div>
  );
}
