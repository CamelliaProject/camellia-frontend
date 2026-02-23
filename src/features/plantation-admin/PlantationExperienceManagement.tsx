import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Edit3, Trash2, X, DollarSign, ImagePlus } from 'lucide-react';

// Types
interface PriceDetails {
  adult: number;
  child: number;
}

interface Experience {
  name: string;
  description?: string;
  shortDescription?: string;
  announcement?: string;
  priceLKR: PriceDetails;
  priceUSD: PriceDetails;
  images?: string[];
}

interface Plantation {
  id: string;
  name: string;
  experiences: Experience[];
}

interface PlantationExperienceManagementProps {
  plantation: Plantation;
}

// Modal for adding/editing an experience
interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (experience: Experience) => void;
  initialExperience?: Experience;
}

function ExperienceModal({ isOpen, onClose, onSubmit, initialExperience }: ExperienceModalProps) {
  const [formData, setFormData] = useState<Experience>({
    name: '',
    description: '',
    shortDescription: '',
    announcement: '',
    priceLKR: { adult: 0, child: 0 },
    priceUSD: { adult: 0, child: 0 },
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sync modal with initialExperience
  useEffect(() => {
    if (initialExperience) {
      setFormData({
        name: initialExperience.name || '',
        description: initialExperience.description || '',
        shortDescription: initialExperience.shortDescription || '',
        announcement: initialExperience.announcement || '',
        priceLKR: initialExperience.priceLKR || { adult: 0, child: 0 },
        priceUSD: initialExperience.priceUSD || { adult: 0, child: 0 },
        images: initialExperience.images || [],
      });
      setImagePreviews(initialExperience.images || []);
    } else {
      // Reset for new experience
      setFormData({
        name: '',
        description: '',
        shortDescription: '',
        announcement: '',
        priceLKR: { adult: 0, child: 0 },
        priceUSD: { adult: 0, child: 0 },
        images: [],
      });
      setImagePreviews([]);
    }
  }, [initialExperience]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'adultPriceUSD':
        setFormData(prev => ({ ...prev, priceUSD: { ...prev.priceUSD, adult: parseFloat(value) || 0 } }));
        break;
      case 'childPriceUSD':
        setFormData(prev => ({ ...prev, priceUSD: { ...prev.priceUSD, child: parseFloat(value) || 0 } }));
        break;
      case 'adultPriceLKR':
        setFormData(prev => ({ ...prev, priceLKR: { ...prev.priceLKR, adult: parseFloat(value) || 0 } }));
        break;
      case 'childPriceLKR':
        setFormData(prev => ({ ...prev, priceLKR: { ...prev.priceLKR, child: parseFloat(value) || 0 } }));
        break;
      default:
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setImagePreviews(prev => [...prev, imageData]);
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), imageData] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">{initialExperience ? 'Edit Experience' : 'Add New Experience'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Experience Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
              required
            />
          </div>

          {/* Description Fields */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Short Description</label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription || ''}
              onChange={handleChange}
              placeholder="Brief description for listing"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Full Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the experience"
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
            />
          </div>

          {/* Experience Images */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-[#2D6A4F] mb-4 flex items-center gap-2"><ImagePlus size={20} /> Experience Gallery Images</h3>
            <div className="mb-4">
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition border-2 border-dashed border-blue-300"
              >
                <ImagePlus size={18} className="inline mr-2" /> Add Images to Experience
              </button>
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt={`Experience ${idx}`} className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2"><DollarSign size={20} /> Prices for Foreigners (USD)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Adult Price (USD) <span className="text-red-500">*</span></label>
                <input type="number" name="adultPriceUSD" value={formData.priceUSD.adult} onChange={handleChange} min="0" step="0.01" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" required/>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Child Price (USD) <span className="text-red-500">*</span></label>
                <input type="number" name="childPriceUSD" value={formData.priceUSD.child} onChange={handleChange} min="0" step="0.01" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" required/>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2"><DollarSign size={20} /> Prices for Sri Lankans (LKR)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Adult Price (LKR) <span className="text-red-500">*</span></label>
                <input type="number" name="adultPriceLKR" value={formData.priceLKR.adult} onChange={handleChange} min="0" step="0.01" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" required/>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Child Price (LKR) <span className="text-red-500">*</span></label>
                <input type="number" name="childPriceLKR" value={formData.priceLKR.child} onChange={handleChange} min="0" step="0.01" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" required/>
              </div>
            </div>
          </div>

          {/* Announcement */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Announcement <span className="text-gray-500">(optional)</span></label>
            <textarea
              name="announcement"
              value={formData.announcement || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, announcement: e.target.value }))}
              placeholder="E.g., 'Not available on Sundays' or 'Limited availability during monsoon season'"
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
            />
            <p className="text-xs text-gray-500 mt-1">This will be displayed in red color under the experience on the tourist side.</p>
          </div>

          <div className="flex gap-4 justify-end pt-6">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition">Cancel</button>
            <button type="submit" className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-2 px-6 rounded-lg transition">{initialExperience ? 'Save Changes' : 'Add Experience'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main component
export default function PlantationExperienceManagement({ plantation }: PlantationExperienceManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<Experience | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [localExperiences, setLocalExperiences] = useState<Experience[]>(() => {
    // Get the latest experience images from localStorage if available
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      const storedExperiences = stored[plantation.id]?.experiences;
      if (storedExperiences) {
        return storedExperiences.map((exp: any) => ({
          ...exp,
          priceLKR: exp.priceLKR || { adult: 0, child: 0 },
          priceUSD: exp.priceUSD || { adult: 0, child: 0 },
        }));
      }
    } catch (e) {
      // Fall back to plantation data if localStorage fails
    }
    return plantation.experiences.map(exp => ({
      ...exp,
      priceLKR: exp.priceLKR || { adult: 0, child: 0 },
      priceUSD: exp.priceUSD || { adult: 0, child: 0 },
    }));
  });

  // Sync experience images from localStorage whenever component mounts or plantation changes
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      const storedExperiences = stored[plantation.id]?.experiences;
      if (storedExperiences) {
        setLocalExperiences(storedExperiences.map((exp: any) => ({
          ...exp,
          priceLKR: exp.priceLKR || { adult: 0, child: 0 },
          priceUSD: exp.priceUSD || { adult: 0, child: 0 },
        })));
      }
    } catch (e) {
      // Silent fail, keep current state
    }
  }, [plantation.id]);

  const handleAddExperience = () => {
    setCurrentExperience(undefined);
    setIsModalOpen(true);
  };

  const handleEditExperience = (experience: Experience) => {
    setCurrentExperience(experience);
    setIsModalOpen(true);
  };

  const handleSaveExperience = async (experience: Experience) => {
    setIsLoading(true);
    setMessage('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    let newExperiences: Experience[] = [];
    if (currentExperience) {
      newExperiences = localExperiences.map(exp => (exp.name === currentExperience.name ? experience : exp));
      setLocalExperiences(newExperiences);
      setMessage('Experience updated successfully!');
    } else {
      newExperiences = [...localExperiences, experience];
      setLocalExperiences(newExperiences);
      setMessage('Experience added successfully!');
    }
    setIsLoading(false);
    setIsModalOpen(false);
    // Persist experiences to localStorage under plantation id
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      const existing = stored[plantation.id] || {};
      existing.experiences = newExperiences;
      stored[plantation.id] = { ...existing, experiences: existing.experiences };
      localStorage.setItem('plantations', JSON.stringify(stored));
      // Update in-memory PLANTATION_DATA if available
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = await import('../tourist/PlantationDetail') as any;
        if (mod && mod.PLANTATION_DATA && mod.PLANTATION_DATA[plantation.id]) {
          mod.PLANTATION_DATA[plantation.id].experiences = existing.experiences;
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to persist experiences:', err);
    }
  };

  const handleDeleteExperience = async (experienceName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${experienceName}"?`)) return;
    setIsLoading(true);
    setMessage('');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newExperiences = (localExperiences || []).filter(exp => exp.name !== experienceName);
    setLocalExperiences(newExperiences);
    setMessage('Experience deleted successfully!');
    setIsLoading(false);
    // Persist deletion
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      const existing = stored[plantation.id] || {};
      existing.experiences = newExperiences;
      stored[plantation.id] = { ...existing, experiences: existing.experiences };
      localStorage.setItem('plantations', JSON.stringify(stored));
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = await import('../tourist/PlantationDetail') as any;
        if (mod && mod.PLANTATION_DATA && mod.PLANTATION_DATA[plantation.id]) {
          mod.PLANTATION_DATA[plantation.id].experiences = existing.experiences;
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to persist experience deletion:', err);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1B4332]">Manage Experiences</h2>
        <button onClick={handleAddExperience} className="bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2">
          <PlusCircle size={20} /> Add New Experience
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6">{message}</div>
      )}

      {localExperiences.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg mb-4">No experiences added yet.</p>
          <p className="text-gray-500">Click "Add New Experience" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localExperiences.map((experience, index) => (
            <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-200 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-[#2D6A4F]">{experience.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">USD:</span> Adult ${experience.priceUSD.adult} | Child ${experience.priceUSD.child}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">LKR:</span> Adult Rs {experience.priceLKR.adult} | Child Rs {experience.priceLKR.child}
                </p>
                {experience.announcement && (
                  <p className="text-sm text-red-600 mt-2 italic">{experience.announcement}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEditExperience(experience)} className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition" title="Edit Experience" disabled={isLoading}>
                  <Edit3 size={20} />
                </button>
                <button onClick={() => handleDeleteExperience(experience.name)} className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition" title="Delete Experience" disabled={isLoading}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExperienceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveExperience}
        initialExperience={currentExperience}
      />
    </div>
  );
}
