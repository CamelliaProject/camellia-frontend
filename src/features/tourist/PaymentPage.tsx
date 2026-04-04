
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { PLANTATION_DATA } from './PlantationDetail';
import { CheckCircle2, CreditCard, Calendar, Lock } from 'lucide-react'; 

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingSummary, touristDetails } = location.state || {};

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '', 
    cvv: '',
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null); 
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
      setCardDetails((prev) => ({ ...prev, [name]: formattedValue.slice(0, 19) })); 
    } else if (name === 'expiryDate') {
      const formattedValue = value.replace(/\D/g, '');
      let finalValue = formattedValue;
      if (formattedValue.length > 2) {
        finalValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2, 4)}`;
      }
      setCardDetails((prev) => ({ ...prev, [name]: finalValue.slice(0, 5) })); 
    } else if (name === 'cvv') {
      setCardDetails((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 3) })); 
    }
    else {
      setCardDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setError(null);

    // Basic validation
    if (
      !cardDetails.cardNumber ||
      !cardDetails.cardHolderName ||
      !cardDetails.expiryDate ||
      !cardDetails.cvv
    ) {
      setError('Please fill in all card details.');
      setPaymentProcessing(false);
      return;
    }

   
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      
      console.log("Processing payment for:", { bookingSummary, touristDetails, cardDetails });

      setPaymentSuccess(true);
      setPaymentProcessing(false);

    
      try {
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        const transactionId = `P-${Date.now()}`;
        const plantationEntry = Object.entries(PLANTATION_DATA).find(([, p]: any) => p.name === bookingSummary.plantationName);
        const plantationId = plantationEntry ? plantationEntry[0] : '';
        const newPayment = {
          id: transactionId,
          bookingReference: transactionId,
          plantationId,
          amount: String(bookingSummary.totalPrice),
          currency: bookingSummary.currency === 'LKR' ? 'Rs' : '$',
          status: 'paid',
          date: new Date().toISOString().split('T')[0],
        };
        payments.push(newPayment);
        localStorage.setItem('payments', JSON.stringify(payments));
       
        try {
          const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
          const bookingId = `B-${Date.now()}`;
          const newBooking = {
            id: bookingId,
            bookingReference: bookingId,
            plantationName: bookingSummary.plantationName,
            plantationId,
            date: bookingSummary.date || new Date().toISOString().split('T')[0],
            time: bookingSummary.time || '',
            guests: `${bookingSummary.adults || 0} Adults, ${bookingSummary.children || 0} Children`,
            experiences: bookingSummary.experiences || [],
            totalPaid: `${bookingSummary.currency === 'LKR' ? 'Rs' : '$'}${bookingSummary.totalPrice}`,
            status: 'upcoming',
            touristDetails: touristDetails,
            adults: bookingSummary.adults || 0,
            children: bookingSummary.children || 0,
          };
          bookings.push(newBooking);
          localStorage.setItem('bookings', JSON.stringify(bookings));
        } catch (err) {
          console.error('Failed to persist booking:', err);
        }

        
        navigate('/booking-confirmation', {
          state: {
            bookingSummary,
            touristDetails,
            transactionId,
          },
          replace: true 
        });
      } catch (err) {
        console.error('Failed to persist payment:', err);
        navigate('/booking-confirmation', {
          state: { bookingSummary, touristDetails, transactionId: 'CAM-546' },
          replace: true,
        });
      }

    } catch (err) {
      console.error("Payment failed:", err);
      setError('Payment failed. Please try again.');
      setPaymentProcessing(false);
    }
  };

  if (!bookingSummary || !touristDetails) {
    
    navigate('/plantations', { replace: true });
    return null;
  }

  
  const { plantationName, experiences, date, time, adults, children, totalPrice, currency } = bookingSummary;

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      <Navbar />
      <main className="py-16 px-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold font-serif mb-2 text-center">Complete Your Booking</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">Secure Payment</p>

          <div className="bg-white rounded-lg shadow-lg max-w-xl mx-auto border border-gray-200">
           
            <div className="p-8">
              <h2 className="text-2xl font-bold text-[#2D6A4F] mb-6">Payment Details</h2>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-semibold mb-2 text-gray-700">
                    Card Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 0987 4556"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                      maxLength={19}
                      inputMode="numeric"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cardHolderName" className="block text-sm font-semibold mb-2 text-gray-700">
                    Card Holder Name
                  </label>
                  <input
                    type="text"
                    id="cardHolderName"
                    name="cardHolderName"
                    value={cardDetails.cardHolderName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expiryDate" className="block text-sm font-semibold mb-2 text-gray-700">
                      Expiry Date (MM/YY)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                        maxLength={5}
                        inputMode="numeric"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="cvv" className="block text-sm font-semibold mb-2 text-gray-700">
                      CVV
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleChange}
                        placeholder="123"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                        maxLength={3}
                        inputMode="numeric"
                        required
                      />
                    </div>
                  </div>
                </div>

                
                <div className="bg-[#E8F5E9] border border-[#B7E4C7] text-[#2D6A4F] px-4 py-3 rounded-md text-sm">
                  <p className="font-semibold mb-1">Test Card Information :</p>
                  <p>Card: 4242 4242 4242 4242 | Expiry: Any future date | CVV: 3 digits</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-4 rounded-lg transition text-lg flex items-center justify-center gap-2"
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    <>Pay {currency === 'LKR' ? 'Rs' : '$'} {bookingSummary.totalPrice.toLocaleString()} </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
