
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { CheckCircle2 } from 'lucide-react';

export default function BookingConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingSummary, touristDetails, transactionId } = location.state || {};

  if (!bookingSummary || !touristDetails || !transactionId) {
    // Redirect if booking data is missing
    navigate('/plantations', { replace: true });
    return null;
  }

  const { plantationName, experiences, date, time, adults, children, totalPrice, currency } = bookingSummary;

  // Format date to "Monday, November 17, 2025" for display
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const guestsText = `${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}`;

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      <Navbar />
      <main className="py-16 px-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle2 size={80} className="text-[#52B788] mx-auto mb-6" />
            <h1 className="text-4xl font-bold font-serif mb-4">Booking Confirmed!</h1>
            <p className="text-lg text-gray-600">Your payment has been processed successfully</p>
          </div>

          <div className="bg-[#E8F5E9] border-2 border-[#B7E4C7] rounded-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-[#2D6A4F] mb-6">Booking Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p className="font-semibold">Booking Reference</p>
                <p className="text-lg">{transactionId}</p>
              </div>
              <div>
                <p className="font-semibold">Plantation</p>
                <p className="text-lg">{plantationName}</p>
              </div>
              <div>
                <p className="font-semibold">Date</p>
                <p className="text-lg">{formattedDate}</p>
              </div>
              <div>
                <p className="font-semibold">Time</p>
                <p className="text-lg">{time}</p>
              </div>
              <div>
                <p className="font-semibold">Guests</p>
                <p className="text-lg">{guestsText}</p>
              </div>
              <div>
                <p className="font-semibold">Experiences</p>
                <p className="text-lg">
                  {Array.isArray(experiences)
                    ? experiences.map((exp: any) => (typeof exp === 'string' ? exp : exp.name)).join(', ')
                    : ''}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="font-semibold">Total Paid</p>
                <p className="text-2xl font-bold text-[#2D6A4F]">{currency === 'LKR' ? 'Rs' : '$'} {totalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Plantation Contact Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-center">
            <p className="text-sm font-semibold mb-2 text-gray-700">Plantation Contact Information</p>
            <p className="text-gray-600 mb-2">For any questions or changes, Please contact plantation directly.</p>
            <p className="text-[#2D6A4F] font-medium">Email: info@pedroet.lk</p> {/* Replace with actual plantation email */}
          </div>

          <p className="text-center text-gray-600 mb-8">A confirmation email has been sent to {touristDetails.email}</p>

          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 px-8 rounded-lg transition text-lg"
            >
              Go to My Dashboard
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
