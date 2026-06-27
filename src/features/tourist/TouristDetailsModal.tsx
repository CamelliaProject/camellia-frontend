import { X } from 'lucide-react';
import { useState } from 'react';

export interface TouristDetails {
  fullName: string;
  email: string;
  phone: string;
  nicPassportNumber: string;
  country: string;
  city: string;
}

interface TouristDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: TouristDetails) => void;
}

export default function TouristDetailsModal({ isOpen, onClose, onSubmit }: TouristDetailsModalProps) {
  const [formData, setFormData] = useState<TouristDetails>({
    fullName: '',
    email: '',
    phone: '',
    nicPassportNumber: '',
    country: '',
    city: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      nicPassportNumber: '',
      country: '',
      city: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">Enter Tourist Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold mb-2 text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@gmail.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold mb-2 text-gray-700">
                Phone<span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                required
              />
            </div>
            <div>
              <label htmlFor="nicPassportNumber" className="block text-sm font-semibold mb-2 text-gray-700">
                NIC/Passport Number.<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nicPassportNumber"
                name="nicPassportNumber"
                value={formData.nicPassportNumber}
                onChange={handleChange}
                placeholder="P1234567890"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                required
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-semibold mb-2 text-gray-700">
                Country<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="United States"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                required
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-semibold mb-2 text-gray-700">
                City<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#f0f0f0] font-semibold py-3 px-6 rounded-lg transition text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 px-6 rounded-lg transition text-lg"
            >
              Continue to Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
