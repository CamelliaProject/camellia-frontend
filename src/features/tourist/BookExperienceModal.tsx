import { useState } from 'react';
import { X } from 'lucide-react';

interface Experience {
  name: string;
  priceUSD: number;
}

interface BookExperienceModalProps {
  plantationName: string;
  experiences: Experience[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (booking: { experiences: string[]; date: string; totalUSD: number; totalLKR: number }) => void;
}

const USD_TO_LKR = 330;

export default function BookExperienceModal({
  plantationName,
  experiences,
  isOpen,
  onClose,
  onSubmit,
}: BookExperienceModalProps) {
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleToggleExperience = (experienceName: string) => {
    setSelectedExperiences((prev) =>
      prev.includes(experienceName)
        ? prev.filter((exp) => exp !== experienceName)
        : [...prev, experienceName]
    );
  };

  const handleSubmit = () => {
    if (selectedExperiences.length > 0 && selectedDate) {
      const totalUSD = experiences
        .filter((exp) => selectedExperiences.includes(exp.name))
        .reduce((sum, exp) => sum + exp.priceUSD, 0);

      const totalLKR = totalUSD * USD_TO_LKR;

      onSubmit({ experiences: selectedExperiences, date: selectedDate, totalUSD, totalLKR });

      setSelectedExperiences([]);
      setSelectedDate('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalUSD = experiences
    .filter((exp) => selectedExperiences.includes(exp.name))
    .reduce((sum, exp) => sum + exp.priceUSD, 0);

  const totalLKR = totalUSD * USD_TO_LKR;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">Book Experience</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-lg font-semibold mb-4 text-gray-700">
            Select experiences at {plantationName}
          </p>

          {/* Experiences List */}
          <div className="space-y-3 mb-6">
            {experiences.map((experience) => (
              <div
                key={experience.name}
                className="bg-[#E8F5E9] border-2 border-[#B7E4C7] rounded-lg p-4 hover:bg-[#D4EDDA] transition cursor-pointer"
                onClick={() => handleToggleExperience(experience.name)}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedExperiences.includes(experience.name)}
                    onChange={() => handleToggleExperience(experience.name)}
                    className="w-5 h-5 mt-1 accent-[#2D6A4F] cursor-pointer"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">{experience.name}</h3>
                    <div className="flex gap-6 mt-2">
                      <div>
                        <p className="text-sm text-gray-600">Price (USD)</p>
                        <p className="text-lg font-bold text-[#2D6A4F]">${experience.priceUSD}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Price (LKR)</p>
                        <p className="text-lg font-bold text-[#2D6A4F]">Rs {(experience.priceUSD * USD_TO_LKR).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Date picker */}
          {selectedExperiences.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Choose a date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          )}

          {/* Total */}
          {selectedExperiences.length > 0 && (
            <div className="bg-gradient-to-r from-[#2D6A4F] to-[#52B788] text-white p-6 rounded-lg mb-4">
              <h3 className="font-semibold text-lg mb-4">
                Total ({selectedExperiences.length} experience{selectedExperiences.length !== 1 ? 's' : ''})
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm opacity-90">USD</p>
                  <p className="text-3xl font-bold">${totalUSD}</p>
                  <p className="text-xs opacity-75 mt-1">For Foreign Tourists</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">LKR</p>
                  <p className="text-3xl font-bold">Rs {totalLKR.toLocaleString()}</p>
                  <p className="text-xs opacity-75 mt-1">For Local Tourists</p>
                </div>
              </div>
            </div>
          )}

          {selectedExperiences.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Select at least one experience to proceed</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#f0f0f0] font-semibold py-3 px-6 rounded-lg transition text-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedExperiences.length === 0 || !selectedDate}
            className="flex-1 bg-[#52B788] hover:bg-[#40916c] disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition text-lg"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
