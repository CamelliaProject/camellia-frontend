import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

interface SetupFormData {
  name: string;
  address: string;
  description: string;
  detailedDescription: string;
  bestTime: string;
  phone: string;
  email: string;
  altitude: string;
  area: string;
  established: string;
  
}

interface PlantationSetupProps {
  plantationId: string;
  onSetupComplete: (plantation: any) => void;
}

export default function PlantationSetup({ plantationId, onSetupComplete }: PlantationSetupProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SetupFormData>({
    name: '',
    address: '',
    description: '',
    detailedDescription: '',
    bestTime: '',
    phone: '',
    email: '',
    altitude: '',
    area: '',
    established: '',
    
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Plantation name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.description.trim()) newErrors.description = 'Short description is required';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.detailedDescription.trim())
      newErrors.detailedDescription = 'Detailed description is required';
    if (!formData.bestTime.trim()) newErrors.bestTime = 'Best time to visit is required';
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.altitude.trim()) newErrors.altitude = 'Altitude is required';
    if (!formData.area.trim()) newErrors.area = 'Area size is required';
    if (!formData.established.trim()) newErrors.established = 'Establishment year is required';
    return newErrors;
  };

  const handleNextStep = () => {
    let validationErrors: Record<string, string> = {};
    if (step === 1) validationErrors = validateStep1();
    else if (step === 2) validationErrors = validateStep2();
    else if (step === 3) validationErrors = validateStep3();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      setErrors({});
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateStep3();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create complete plantation object
    const completePlantation = {
      id: plantationId,
      name: formData.name,
      address: formData.address,
      description: formData.description,
      detailedDescription: formData.detailedDescription,
      bestTime: formData.bestTime,
      
      contact: {
        phone: formData.phone,
        email: formData.email,
      },
      highlights: {
        altitude: formData.altitude,
        area: formData.area,
        established: formData.established,
        visitors: '0',
      },
      rating: 0,
      reviews: 0,
      features: [],
      activities: [],
      experiences: [],
      price: '',
      duration: '',
    };

    // Save to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      stored[plantationId] = completePlantation;
      localStorage.setItem('plantations', JSON.stringify(stored));
    } catch (err) {
      console.error('Failed to save plantation details:', err);
    }

    setIsLoading(false);
    onSetupComplete(completePlantation);
    navigate('/plantation-admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f7] to-[#e8f5f3] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertCircle className="text-[#2D6A4F]" size={32} />
            <h1 className="text-4xl font-bold text-[#1B4332]">Complete Your Plantation Profile</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Let's set up your plantation details so tourists can discover and book experiences.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    step >= num
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                <span className="text-xs font-semibold mt-2 text-gray-700">
                  {num === 1 ? 'Basic Info' : num === 2 ? 'Details' : 'Contact & Stats'}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D6A4F] transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1B4332] mb-4">Basic Information</h2>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Plantation Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Pedro Tea Estate"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., Nuwara Eliya, Sri Lanka"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.address
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Short Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief overview of your plantation (1-2 sentences)"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Detailed Description */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1B4332] mb-4">Detailed Information</h2>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Detailed Description *
                </label>
                <textarea
                  name="detailedDescription"
                  value={formData.detailedDescription}
                  onChange={handleChange}
                  placeholder="Comprehensive description of your plantation, history, and unique features"
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.detailedDescription
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.detailedDescription && (
                  <p className="text-red-500 text-sm mt-1">{errors.detailedDescription}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Best Time to Visit *
                </label>
                <input
                  type="text"
                  name="bestTime"
                  value={formData.bestTime}
                  onChange={handleChange}
                  placeholder="e.g., December to March"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.bestTime
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.bestTime && <p className="text-red-500 text-sm mt-1">{errors.bestTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Main Image URL
                </label>
                <input
                  type="url"
                  name="mainImage"
                  
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Contact & Statistics */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#1B4332] mb-4">Contact & Statistics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+94 (0) 52 222 2345"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@plantation.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                    Altitude (e.g., 2,200m) *
                  </label>
                  <input
                    type="text"
                    name="altitude"
                    value={formData.altitude}
                    onChange={handleChange}
                    placeholder="2,200m above sea level"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.altitude
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errors.altitude && <p className="text-red-500 text-sm mt-1">{errors.altitude}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                    Area (e.g., 500 hectares) *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="500 hectares"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.area
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                    Established Year (e.g., 1872) *
                  </label>
                  <input
                    type="text"
                    name="established"
                    value={formData.established}
                    onChange={handleChange}
                    placeholder="1872"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.established
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                  {errors.established && (
                    <p className="text-red-500 text-sm mt-1">{errors.established}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePreviousStep}
              disabled={step === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                step === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg font-semibold transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-3 bg-[#40916C] hover:bg-[#2D6A4F] disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
