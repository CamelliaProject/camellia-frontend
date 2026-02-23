import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';

interface PaymentRecord {
  id: string;
  bookingReference: string;
  plantationId: string;
  amount: string;
  currency: string;
  status: 'paid' | 'refunded' | 'failed';
  date: string;
}

// Mock payments for demo purposes
const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'P-1001', bookingReference: 'CAM-556', plantationId: '1', amount: '25', currency: '$', status: 'paid', date: '2025-11-17' },
  { id: 'P-1002', bookingReference: 'CAM-557', plantationId: '1', amount: '33000', currency: 'Rs', status: 'paid', date: '2025-11-18' },
  { id: 'P-1003', bookingReference: 'CAM-456', plantationId: '1', amount: '35', currency: '$', status: 'refunded', date: '2024-10-15' },
  { id: 'P-1004', bookingReference: 'CAM-458', plantationId: '3', amount: '76', currency: '$', status: 'paid', date: '2024-08-21' },
];

interface PlantationPaymentsProps {
  plantationId: string;
}

export default function PlantationPayments({ plantationId }: PlantationPaymentsProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const EXCHANGE_RATE_USD_TO_LKR = 365; // Example fixed rate — replace with live rate if needed

  const parseAmount = (p: PaymentRecord) => {
    const n = Number(p.amount) || 0;
    if (p.currency === '$') return { usd: n, lkr: n * EXCHANGE_RATE_USD_TO_LKR };
    // assume LKR if not dollar
    return { usd: p.currency === 'Rs' ? n / EXCHANGE_RATE_USD_TO_LKR : 0, lkr: n };
  };

  const getTotals = (period: 'week' | 'month' | 'year') => {
    const now = new Date();
    const start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 7);
    if (period === 'month') start.setMonth(now.getMonth() - 1);
    if (period === 'year') start.setFullYear(now.getFullYear() - 1);

    const filtered = payments.filter((p) => {
      if (p.status !== 'paid') return false;
      const d = new Date(p.date);
      return d >= start && d <= now;
    });

    const totals = filtered.reduce(
      (acc, p) => {
        const a = parseAmount(p);
        acc.lkr += a.lkr;
        acc.usd += a.usd;
        return acc;
      },
      { lkr: 0, usd: 0 }
    );

    return totals;
  };

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const stored: PaymentRecord[] = JSON.parse(localStorage.getItem('payments') || '[]');
      const allPayments = [...MOCK_PAYMENTS, ...stored];
      setPayments(allPayments.filter((p) => p.plantationId === plantationId));
      setIsLoading(false);
    }, 600);
  }, [plantationId]);

  const totalCollectedLKR = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + parseAmount(p).lkr, 0);

  const totalCollectedUSD = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + parseAmount(p).usd, 0);

  const weekly = getTotals('week');
  const monthly = getTotals('month');
  const yearly = getTotals('year');

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Wallet size={20} className="text-[#2D6A4F]" />
        <h2 className="text-2xl font-bold text-[#1B4332]">Payments</h2>
      </div>

      {isLoading ? (
        <p className="text-gray-600">Loading payments...</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Weekly Revenue (LKR)</p>
              <p className="text-2xl font-bold text-[#2D6A4F]">{weekly.lkr.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Monthly Revenue (LKR)</p>
              <p className="text-2xl font-bold text-[#2D6A4F]">{monthly.lkr.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Yearly Revenue (LKR)</p>
              <p className="text-2xl font-bold text-[#2D6A4F]">{yearly.lkr.toLocaleString()}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">Total collected (paid):</p>
            <p className="text-3xl font-bold text-[#2D6A4F]">Rs {totalCollectedLKR.toLocaleString()} ({totalCollectedUSD.toFixed(2)} USD)</p>
          </div>

          {payments.length === 0 ? (
            <p className="text-gray-600">No payments found for this plantation.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="text-left text-sm text-gray-700 border-b">
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const parsed = parseAmount(p);
                    return (
                      <tr key={p.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-[#2D6A4F]">{p.id}</td>
                        <td className="py-3 px-4 text-gray-700">{p.bookingReference}</td>
                        <td className="py-3 px-4 font-bold">
                          {p.currency} {p.amount}
                          {p.currency === '$' && (
                            <div className="text-xs text-gray-500">Rs {parsed.lkr.toLocaleString()}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'refunded' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
