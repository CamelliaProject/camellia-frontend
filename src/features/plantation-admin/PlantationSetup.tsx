import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { plantationApi } from '../../services/api';

interface PlantationSetupProps {
  plantationId: string;
  existingData?: any;
  onSetupComplete: (plantation: any) => void;
}

export default function PlantationSetup({ plantationId, existingData, onSetupComplete }: PlantationSetupProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name:                existingData?.name        || '',
    address:             existingData?.address     || '',
    description:         existingData?.description || '',
    detailedDescription: '',
    bestTime:            '',
    phone:               existingData?.phone       || '',
    email:               existingData?.email       || '',
    altitude:            '',
    area:                '',
    established:         existingData?.established_year ? String(existingData.established_year) : '',
  });
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(existingData?.main_image_url || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim())        errs.name        = 'Plantation name is required';
    if (!formData.address.trim())     errs.address     = 'Address is required';
    if (!formData.description.trim()) errs.description = 'Short description is required';
    return errs;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!formData.detailedDescription.trim()) errs.detailedDescription = 'Detailed description is required';
    if (!formData.bestTime.trim())            errs.bestTime            = 'Best time to visit is required';
    return errs;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errs.phone = 'Please enter a valid phone number';
    }
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email';
    }
    if (!formData.altitude.trim())   errs.altitude   = 'Altitude is required';
    if (!formData.area.trim())       errs.area       = 'Area size is required';
    if (!formData.established.trim()) errs.established = 'Establishment year is required';
    return errs;
  };

  const handleNext = () => {
    const errs = step === 1 ? validateStep1() : step === 2 ? validateStep2() : {};
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStep(s => s + 1);
    setErrors({});
  };

  const handleBack = () => { setStep(s => s - 1); setErrors({}); };

  const handleSubmit = async () => {
    const errs = validateStep3();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append('name',                 formData.name);
      payload.append('address',              formData.address);
      payload.append('description',          formData.description);
      payload.append('detailed_description', formData.detailedDescription);
      payload.append('best_time_to_visit',   formData.bestTime);
      payload.append('phone',                formData.phone);
      payload.append('email',                formData.email);
      payload.append('altitude',             formData.altitude);
      payload.append('area',                 formData.area);
      if (formData.established) payload.append('established_year', formData.established);
      if (mainImageFile) payload.append('mainImage', mainImageFile);

      const res = await plantationApi.update(plantationId, payload);
      await plantationApi.publish(plantationId);
      onSetupComplete(res.data?.data || { id: plantationId, ...formData });
      navigate('/plantation-admin/dashboard');
    } catch (err) {
      console.error('Failed to save plantation details:', err);
      setErrors({ submit: 'Failed to save details. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:ring-green-500'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f7] to-[#e8f5f3] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertCircle className="text-[#2D6A4F]" size={32} />
            <h1 className="text-3xl font-bold text-[#1B4332]">Complete Your Plantation Profile</h1>
          </div>
          <p className="text-gray-600">
            Set up your plantation details so tourists can discover and book experiences.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {(['Basic Info', 'Details & Image', 'Contact & Stats'] as const).map((label, i) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  step >= i + 1 ? 'bg-[#2D6A4F] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <span className="text-xs font-medium mt-2 text-gray-600 text-center">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D6A4F] transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1B4332]">Basic Information</h2>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Plantation Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g., Pedro Tea Estate" className={inputClass('name')} />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange}
                  placeholder="e.g., Nuwara Eliya, Sri Lanka" className={inputClass('address')} />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Short Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  placeholder="Brief overview of your plantation (1-2 sentences)" rows={3}
                  className={inputClass('description')} />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Details & Main Image */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1B4332]">Detailed Information</h2>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Detailed Description *</label>
                <textarea name="detailedDescription" value={formData.detailedDescription} onChange={handleChange}
                  placeholder="Comprehensive description of your plantation, its history and unique features"
                  rows={5} className={inputClass('detailedDescription')} />
                {errors.detailedDescription && <p className="text-red-500 text-sm mt-1">{errors.detailedDescription}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Best Time to Visit *</label>
                <input type="text" name="bestTime" value={formData.bestTime} onChange={handleChange}
                  placeholder="e.g., December to March" className={inputClass('bestTime')} />
                {errors.bestTime && <p className="text-red-500 text-sm mt-1">{errors.bestTime}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">Main Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#2D6A4F] transition"
                >
                  {mainImagePreview ? (
                    <img src={mainImagePreview} alt="Preview" className="h-40 object-cover rounded-lg mb-3" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <p className="text-sm text-gray-500">
                    {mainImagePreview ? 'Click to change image' : 'Click to upload main image'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — saved to cloud</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={handleImageChange} />
              </div>
            </div>
          )}

          {/* Step 3: Contact & Stats */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1B4332]">Contact & Statistics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="+94 (0) 52 222 2345" className={inputClass('phone')} />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="info@plantation.com" className={inputClass('email')} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">Altitude *</label>
                  <input type="text" name="altitude" value={formData.altitude} onChange={handleChange}
                    placeholder="2,200m" className={inputClass('altitude')} />
                  {errors.altitude && <p className="text-red-500 text-sm mt-1">{errors.altitude}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">Area *</label>
                  <input type="text" name="area" value={formData.area} onChange={handleChange}
                    placeholder="500 hectares" className={inputClass('area')} />
                  {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1B4332] mb-2">Established Year *</label>
                  <input type="text" name="established" value={formData.established} onChange={handleChange}
                    placeholder="1872" className={inputClass('established')} />
                  {errors.established && <p className="text-red-500 text-sm mt-1">{errors.established}</p>}
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {errors.submit}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
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
              <button onClick={handleNext}
                className="px-6 py-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg font-semibold transition">
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isLoading}
                className="px-6 py-3 bg-[#40916C] hover:bg-[#2D6A4F] disabled:bg-gray-400 text-white rounded-lg font-semibold transition">
                {isLoading ? 'Saving…' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
