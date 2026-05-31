import { useState, useRef } from 'react';
import { MapPin, Info, DollarSign, CalendarCheck, Activity } from 'lucide-react';
import { plantationApi } from '../../services/api';


interface Plantation {
  id: string;
  name: string;
  address: string;
  description: string;
  detailedDescription: string;
  bestTime: string;
  main_image_url?: string;
  contact: {
    phone: string;
    email: string;
  };
  highlights: {
    altitude: string;
    area: string;
    visitors: string;
    established: string;
  };
  activities: string[];
}

interface PlantationDetailsManagementProps {
  plantation: Plantation;
}

export default function PlantationDetailsManagement({ plantation }: PlantationDetailsManagementProps) {
  const [formData, setFormData] = useState<Plantation>(plantation);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(plantation.main_image_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  }; 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [name]: value },
    }));
  };

  const handleHighlightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      highlights: { ...prev.highlights, [name]: value },
    }));
  };

 
  const handleAddActivity = () => {
    if (newActivity.trim() !== '') {
      setFormData((prev) => ({
        ...prev,
        activities: [...prev.activities, newActivity.trim()],
      }));
      setNewActivity(''); 
    }
  };

  
  const handleRemoveActivity = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('name',                 formData.name);
      payload.append('address',              formData.address);
      payload.append('description',          formData.description);
      payload.append('detailed_description', formData.detailedDescription);
      payload.append('best_time_to_visit',   formData.bestTime);
      payload.append('phone',                formData.contact.phone);
      payload.append('email',                formData.contact.email);
      payload.append('altitude',             formData.highlights.altitude);
      payload.append('area',                 formData.highlights.area);
      if (formData.highlights.established) {
        payload.append('established_year', formData.highlights.established);
      }
      if (mainImageFile) payload.append('mainImage', mainImageFile);

      await plantationApi.update(formData.id, payload);

      setMessage('Details updated successfully!');
      setIsEditing(false);
      setMainImageFile(null);
    } catch (err) {
      console.error('Failed to update plantation details:', err);
      setMessage('Failed to update details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1B4332]">Manage Plantation Details</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Edit Details
          </button>
        )}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-md mb-6 border ${
          message.startsWith('Failed') || message.startsWith('Error')
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'bg-green-100 border-green-400 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
            <Info size={24} /> General Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-700">
                Plantation Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-semibold mb-2 text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-semibold mb-2 text-gray-700">
                Short Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100 resize-y"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="detailedDescription" className="block text-sm font-semibold mb-2 text-gray-700">
                Detailed Description
              </label>
              <textarea
                id="detailedDescription"
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleChange}
                disabled={!isEditing}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100 resize-y"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Main Image */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
            <Info size={20} /> Main Image
          </h3>
          <div className="flex items-start gap-6">
            <div className="w-40 h-28 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
              {mainImagePreview ? (
                <img src={mainImagePreview} alt="Main" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2">No image</div>
              )}
            </div>
            {isEditing && (
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#52B788] hover:bg-[#40916c] text-white rounded-lg text-sm font-semibold transition"
                >
                  {mainImagePreview ? 'Change Image' : 'Upload Image'}
                </button>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG, WEBP — saved to cloud</p>
                {mainImageFile && (
                  <p className="text-xs text-green-600 mt-1">New image selected: {mainImageFile.name}</p>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
            <MapPin size={24} /> Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact.phone" className="block text-sm font-semibold mb-2 text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                id="contact.phone"
                name="phone"
                value={formData.contact.phone}
                onChange={handleContactChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="contact.email" className="block text-sm font-semibold mb-2 text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="contact.email"
                name="email"
                value={formData.contact.email}
                onChange={handleContactChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
            <DollarSign size={24} /> Estate Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="highlights.altitude" className="block text-sm font-semibold mb-2 text-gray-700">
                Altitude
              </label>
              <input
                type="text"
                id="highlights.altitude"
                name="altitude"
                value={formData.highlights.altitude}
                onChange={handleHighlightChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="highlights.area" className="block text-sm font-semibold mb-2 text-gray-700">
                Area (Hectares)
              </label>
              <input
                type="text"
                id="highlights.area"
                name="area"
                value={formData.highlights.area}
                onChange={handleHighlightChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="highlights.visitors" className="block text-sm font-semibold mb-2 text-gray-700">
                Annual Visitors
              </label>
              <input
                type="text"
                id="highlights.visitors"
                name="visitors"
                value={formData.highlights.visitors}
                onChange={handleHighlightChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="highlights.established" className="block text-sm font-semibold mb-2 text-gray-700">
                Established Year
              </label>
              <input
                type="text"
                id="highlights.established"
                name="established"
                value={formData.highlights.established}
                onChange={handleHighlightChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Available Activities */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
            <Activity size={24} /> Available Activities
          </h3>
          <div className="flex flex-wrap gap-3 mb-4">
            {formData.activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center bg-[#D6F0E0] text-[#1B4332] px-4 py-2 rounded-full font-medium"
              >
                <span>{activity}</span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(index)}
                    className="ml-2 text-gray-600 hover:text-red-600 focus:outline-none"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="Add new activity"
                className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
              />
              <button
                type="button"
                onClick={handleAddActivity}
                className="bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Best Time */}
        <div className="pb-6">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
            <CalendarCheck size={24} /> Best Time to Visit
          </h3>
          <div>
            <label htmlFor="bestTime" className="block text-sm font-semibold mb-2 text-gray-700">
              Best Time to Visit
            </label>
            <input
              type="text"
              id="bestTime"
              name="bestTime"
              value={formData.bestTime}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788] disabled:bg-gray-100"
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-4 justify-end pt-6">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData(plantation);
                setMainImageFile(null);
                setMainImagePreview(plantation.main_image_url || '');
                setMessage('');
                setNewActivity('');
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-2 px-6 rounded-lg transition disabled:bg-gray-400"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}