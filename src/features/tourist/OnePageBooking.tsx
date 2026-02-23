import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import TouristDetailsModal, { type TouristDetails } from './TouristDetailsModal';
import { PLANTATION_DATA } from './PlantationDetail';

const USD_TO_LKR = 330;

export default function OnePageBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plantation = id ? PLANTATION_DATA[id] : null;

  const [country] = useState<string>('');
  const [isResident, setIsResident] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  if (!plantation) {
    return (
      <div className="min-h-screen bg-white font-sans text-[#1B4332]">
        <Navbar />
        <main className="py-16 px-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Plantation not found</h1>
          <button
            onClick={() => navigate('/plantations')}
            className="bg-[#2D6A4F] text-white px-6 py-3 rounded-lg hover:bg-[#1B4332] transition"
          >
            Back to Plantations
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const isLocalSriLankan = isResident;
  const currency = isLocalSriLankan ? 'LKR' : 'USD';

  const toggleExperience = (name: string) => {
    setSelectedExperiences((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));
  };

  // a date is required for booking.

  const computePrice = () => {
    let total = 0;
    selectedExperiences.forEach((name) => {
      const exp = plantation.experiences.find((e: any) => e.name === name);
      if (!exp) return;
      const adult = exp.priceUSD.adult;
      const child = exp.priceUSD.child;
      const displayAdult = isLocalSriLankan ? adult * USD_TO_LKR : adult;
      const displayChild = isLocalSriLankan ? child * USD_TO_LKR : child;
      total += displayAdult * adults + displayChild * children;
    });
    return total;
  };

  const handleProceed = () => {
    if (!selectedExperiences.length || !selectedDate) return;
    setIsDetailsModalOpen(true);
  };

  const handleTouristDetailsSubmit = (details: TouristDetails) => {
    setIsDetailsModalOpen(false);
    const totalPrice = computePrice();
    navigate('/payment', {
      state: {
        bookingSummary: {
          plantationName: plantation.name,
          experiences: selectedExperiences,
          date: selectedDate,
          adults,
          children,
          totalPrice,
          currency,
        },
        touristDetails: { ...details, country },
      },
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#1B4332]">
      <Navbar />
      <main className="py-12 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Plantation & Experiences */}
          <div className="md:col-span-2">
            <button onClick={() => navigate(`/plantation/${id}`)} className="text-[#2D6A4F] underline mb-4">← Back to {plantation.name}</button>
            <h1 className="text-3xl font-bold mb-2">{plantation.name}</h1>
            <p className="text-gray-600 mb-6">{plantation.description}</p>

            <div className="space-y-4">
                <div className="p-4 bg-[#E8F5E9] rounded-lg border-2 border-[#B7E4C7]">
                  <div className="mb-3">
                    <label className="block text-sm font-semibold mb-2">Residency</label>
                    <div className="flex gap-4">
                      <label className={`p-2 rounded-lg border ${isResident ? 'bg-white border-[#2D6A4F]' : 'bg-white border-gray-200'}`}>
                        <input type="radio" name="resident" checked={isResident} onChange={() => setIsResident(true)} className="mr-2" /> Resident
                      </label>
                      <label className={`p-2 rounded-lg border ${!isResident ? 'bg-white border-[#2D6A4F]' : 'bg-white border-gray-200'}`}>
                        <input type="radio" name="resident" checked={!isResident} onChange={() => setIsResident(false)} className="mr-2" /> Non-Resident
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Select Date</label>
                      <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); }} className="w-full px-4 py-2 rounded-lg border" />
                    <p className="text-xs mt-2 text-gray-600">Pick one date for all selected experiences. First guest should choose the date.</p>
                  </div>
                </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Experiences & Prices</h2>
                <div className="grid grid-cols-1 gap-3">
                  {plantation.experiences.map((exp: any, idx: number) => {
                    const isSelected = selectedExperiences.includes(exp.name);
                    const displayAdult = isLocalSriLankan ? exp.priceUSD.adult * USD_TO_LKR : exp.priceUSD.adult;
                    const displayChild = isLocalSriLankan ? exp.priceUSD.child * USD_TO_LKR : exp.priceUSD.child;
                    const images = (exp.images && exp.images.length ? exp.images : (plantation.galleryImages || [])).slice(0, 3);
                    return (
                      <div key={idx} className={`p-4 rounded-lg border ${isSelected ? 'bg-[#B7E4C7] border-[#2D6A4F]' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={isSelected} onChange={() => toggleExperience(exp.name)} className="w-4 h-4" />
                              <div>
                                  <div className="font-semibold">{exp.name}</div>
                                  {/* Small paragraph: prefer `shortDescription`, otherwise use first sentence of `description` */}
                                  {((exp.shortDescription && exp.shortDescription.length > 0) || (exp.description && exp.description.length > 0)) && (
                                    <p className="text-sm text-gray-600 mt-1">{exp.shortDescription ? exp.shortDescription : `${exp.description.split('.').slice(0,1).join('.')}${exp.description.length > 120 ? '...' : ''}`}</p>
                                  )}
                                </div>
                            </label>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#2D6A4F]">{currency === 'LKR' ? 'Rs' : '$'} {displayAdult.toLocaleString()} / adult</div>
                            <div className="text-sm text-gray-600">{currency === 'LKR' ? 'Rs' : '$'} {displayChild.toLocaleString()} / child</div>
                          </div>
                        </div>

                        {/* Description */}
                        {exp.description && (
                          <p className="mt-3 text-sm text-gray-700">{exp.description}</p>
                        )}

                        {/* Images (up to 3) */}
                        {images.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {images.map((src: string, i: number) => (
                              <img key={i} src={src} alt={`${exp.name} ${i + 1}`} className="w-full h-20 object-cover rounded" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Right: Summary */}
          <aside className="sticky top-24 p-4 bg-white rounded-lg border col-span-1">
            <h3 className="font-bold text-lg mb-3">Booking Summary</h3>
            <div className="text-sm text-gray-600 mb-3">Plantation: <span className="font-semibold text-gray-800">{plantation.name}</span></div>
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-2">Guests</div>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 bg-gray-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-600">Adults</div>
                  <div className="text-2xl font-bold">{adults}</div>
                </div>
                <div className="flex-1 bg-gray-50 p-3 rounded text-center">
                  <div className="text-xs text-gray-600">Children</div>
                  <div className="text-2xl font-bold">{children}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setAdults(Math.max(1, adults - 1))} className="px-3 py-1 border rounded">−</button>
                  <div className="w-8 text-center font-bold">{adults}</div>
                  <button onClick={() => setAdults(adults + 1)} className="px-3 py-1 bg-[#52B788] text-white rounded">+</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setChildren(Math.max(0, children - 1))} className="px-3 py-1 border rounded">−</button>
                  <div className="w-8 text-center font-bold">{children}</div>
                  <button onClick={() => setChildren(children + 1)} className="px-3 py-1 bg-[#52B788] text-white rounded">+</button>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm text-gray-600">Date</div>
              <div className="font-semibold">{selectedDate ? selectedDate : 'Not selected'}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Selected Experiences</div>
              {selectedExperiences.length === 0 ? (
                <div className="text-gray-500">None</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {selectedExperiences.map((s) => (
                    <li key={s} className="flex justify-between"><span>{s}</span></li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-end mb-3">
                <div className="text-sm">Total</div>
                <div className="text-2xl font-bold text-[#2D6A4F]">{currency === 'LKR' ? 'Rs' : '$'} {computePrice().toLocaleString()}</div>
              </div>
              <button onClick={handleProceed} className="w-full bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 rounded">Continue to Payment</button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      <TouristDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} onSubmit={handleTouristDetailsSubmit} />
    </div>
  );
}
