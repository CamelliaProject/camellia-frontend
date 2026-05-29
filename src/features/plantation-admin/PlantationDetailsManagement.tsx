import { useState } from 'react';
import { MapPin, Info, DollarSign, CalendarCheck, Activity } from 'lucide-react'; 
import { plantationApi } from '../../services/api';


interface Plantation {
  id: string;
  name: string;
  address: string;
  description: string;
  detailedDescription: string;
  bestTime: string;
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
      await plantationApi.update(formData.id, {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        detailed_description: formData.detailedDescription,
        best_time_to_visit: formData.bestTime,
        phone: formData.contact.phone,
        email: formData.contact.email,
        altitude: formData.highlights.altitude,
        area: formData.highlights.area,
        established_year: formData.highlights.established ? parseInt(formData.highlights.established, 10) : null,
      });

      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      stored[formData.id] = formData;
      localStorage.setItem('plantations', JSON.stringify(stored));
      
      try {
        const mod = await import('../tourist/PlantationDetail');
        
        const modAny = mod as any;
        if (modAny && modAny.PLANTATION_DATA && modAny.PLANTATION_DATA[formData.id]) {
          modAny.PLANTATION_DATA[formData.id] = { ...modAny.PLANTATION_DATA[formData.id], ...formData };
        }
      } catch (e) {
      
      }

      setMessage('Details updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to persist plantation details:', err);
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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6">
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
                setFormData(plantation); // Reset to original data
                setMessage('');
                setNewActivity(''); // Clear new activity input on cancel
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