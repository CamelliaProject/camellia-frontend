import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export default function SubscriptionRenewalReturnPage() {
  const [searchParams] = useSearchParams();
  const subId     = searchParams.get('sub') || '';
  const paymentId = searchParams.get('payment_id') || searchParams.get('order_id') || '';

  const [status, setStatus]  = useState<'loading' | 'success' | 'error'>('loading');
  const [newEnd, setNewEnd]  = useState('');
  const [error, setError]    = useState('');

  useEffect(() => {
    if (!subId) { setStatus('error'); setError('Invalid return link.'); return; }
    apiClient.post('/payments/subscription-renew/confirm', { subscription_id: subId, payment_id: paymentId })
      .then(res => { setNewEnd(res.data.new_end_date || ''); setStatus('success'); })
      .catch(err => { setError(err?.response?.data?.error || 'Confirmation failed.'); setStatus('error'); });
  }, []);

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  if (status === 'loading') return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center">
      <svg className="w-8 h-8 animate-spin text-[#2D6A4F]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  if (status === 'success') return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1B4332] mb-3">Renewal Successful!</h2>
        <p className="text-gray-600 mb-2">Your subscription has been extended.</p>
        {newEnd && <p className="text-[#1B4332] font-bold mb-6">New expiry: {fmtDate(newEnd)}</p>}
        <Link to="/plantationadmin" className="inline-block bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold py-3 px-8 rounded-2xl transition">
          Go to Dashboard →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <p className="text-4xl mb-4">❌</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Renewal Failed</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <Link to="/" className="text-[#2D6A4F] font-semibold underline text-sm">Back to Home</Link>
      </div>
    </div>
  );
}
