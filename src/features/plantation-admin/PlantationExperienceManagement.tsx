import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Edit3, Trash2, X, DollarSign, ImagePlus } from 'lucide-react';
import { experienceApi } from '../../services/api';

interface PriceDetails {
  adult: number;
  child: number;
}

interface Experience {
  id?: string;
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
  experiences: any[];
}

interface PlantationExperienceManagementProps {
  plantation: Plantation;
  onSaved?: () => void;
}

// Map raw DB row (snake_case) to UI shape (camelCase nested)
function mapDbToUi(raw: any): Experience {
  return {
    id: raw.id,
    name: raw.name || '',
    shortDescription: raw.short_description || raw.shortDescription || '',
    description: raw.detailed_description || raw.description || '',
    announcement: raw.announcement || '',
    priceUSD: {
      adult: Number(raw.price_usd_adult ?? raw.priceUSD?.adult ?? 0),
      child: Number(raw.price_usd_child ?? raw.priceUSD?.child ?? 0),
    },
    priceLKR: {
      adult: Number(raw.price_lkr_adult ?? raw.priceLKR?.adult ?? 0),
      child: Number(raw.price_lkr_child ?? raw.priceLKR?.child ?? 0),
    },
    images: Array.isArray(raw.images) ? raw.images
           : raw.image_url ? [raw.image_url]
           : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Experience Modal
// ─────────────────────────────────────────────────────────────────────────────
interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (experience: Experience, imageFiles: File[]) => void;
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialExperience) {
      setFormData(initialExperience);
      setImagePreviews(initialExperience.images || []);
    } else {
      setFormData({ name: '', description: '', shortDescription: '', announcement: '', priceLKR: { adult: 0, child: 0 }, priceUSD: { adult: 0, child: 0 }, images: [] });
      setImagePreviews([]);
    }
    setImageFiles([]);
  }, [initialExperience, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'adultPriceUSD': setFormData(p => ({ ...p, priceUSD: { ...p.priceUSD, adult: parseFloat(value) || 0 } })); break;
      case 'childPriceUSD': setFormData(p => ({ ...p, priceUSD: { ...p.priceUSD, child: parseFloat(value) || 0 } })); break;
      case 'adultPriceLKR': setFormData(p => ({ ...p, priceLKR: { ...p.priceLKR, adult: parseFloat(value) || 0 } })); break;
      case 'childPriceLKR': setFormData(p => ({ ...p, priceLKR: { ...p.priceLKR, child: parseFloat(value) || 0 } })); break;
      default: setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (idx: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    // Only remove from imageFiles if index is in new files range
    const existingCount = (initialExperience?.images || []).length;
    if (idx >= existingCount) {
      setImageFiles(prev => prev.filter((_, i) => i !== idx - existingCount));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: initialExperience?.id }, imageFiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">{initialExperience ? 'Edit Experience' : 'Add New Experience'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Experience Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>

          {/* Short description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Short Description</label>
            <input type="text" name="shortDescription" value={formData.shortDescription || ''} onChange={handleChange}
              placeholder="Brief one-line description for the listing"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>

          {/* Full description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Full Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange}
              placeholder="Detailed description tourists will see" rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>

          {/* Images */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-[#2D6A4F] mb-4 flex items-center gap-2"><ImagePlus size={20} /> Experience Images</h3>
            <input ref={imageInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
            <button type="button" onClick={() => imageInputRef.current?.click()}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg transition border-2 border-dashed border-blue-300 mb-3">
              <ImagePlus size={18} className="inline mr-2" /> Add Images
            </button>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {imagePreviews.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                    <button type="button" onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* USD prices */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2"><DollarSign size={20} /> Prices — Foreigners (USD)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Adult Price (USD) <span className="text-red-500">*</span></label>
                <input type="number" name="adultPriceUSD" value={formData.priceUSD.adult} onChange={handleChange} min="0" step="0.01" required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Child Price (USD) <span className="text-red-500">*</span></label>
                <input type="number" name="childPriceUSD" value={formData.priceUSD.child} onChange={handleChange} min="0" step="0.01" required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
              </div>
            </div>
          </div>

          {/* LKR prices */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2"><DollarSign size={20} /> Prices — Sri Lankans (LKR)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Adult Price (LKR) <span className="text-red-500">*</span></label>
                <input type="number" name="adultPriceLKR" value={formData.priceLKR.adult} onChange={handleChange} min="0" step="0.01" required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Child Price (LKR) <span className="text-red-500">*</span></label>
                <input type="number" name="childPriceLKR" value={formData.priceLKR.child} onChange={handleChange} min="0" step="0.01" required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
              </div>
            </div>
          </div>

          {/* Announcement */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Announcement <span className="text-gray-500">(optional)</span></label>
            <textarea name="announcement" value={formData.announcement || ''} onChange={handleChange}
              placeholder="E.g. 'Not available on Sundays' — shown in orange on tourist side" rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>

          <div className="flex gap-4 justify-end pt-6">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition">Cancel</button>
            <button type="submit" className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-2 px-6 rounded-lg transition">
              {initialExperience ? 'Save Changes' : 'Add Experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function PlantationExperienceManagement({ plantation, onSaved }: PlantationExperienceManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<Experience | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Initialise from DB data, mapping snake_case → UI shape
  const [localExperiences, setLocalExperiences] = useState<Experience[]>(() =>
    (plantation.experiences || []).map(mapDbToUi)
  );

  // Sync if parent prop changes (e.g. plantation reloaded)
  useEffect(() => {
    setLocalExperiences((plantation.experiences || []).map(mapDbToUi));
  }, [plantation.id]);

  // Detect experiences that exist only in localStorage (pre-fix data)
  const [legacyExperiences, setLegacyExperiences] = useState<any[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      return stored[plantation.id]?.experiences || [];
    } catch { return []; }
  });
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigrateLegacy = async () => {
    setIsMigrating(true);
    let succeeded = 0;
    for (const exp of legacyExperiences) {
      try {
        const fd = new FormData();
        fd.append('plantation_id', plantation.id);
        fd.append('name', exp.name || '');
        fd.append('short_description', exp.shortDescription || '');
        fd.append('detailed_description', exp.description || '');
        fd.append('announcement', exp.announcement || '');
        fd.append('price_usd_adult', String(exp.priceUSD?.adult ?? 0));
        fd.append('price_usd_child', String(exp.priceUSD?.child ?? 0));
        fd.append('price_lkr_adult', String(exp.priceLKR?.adult ?? 0));
        fd.append('price_lkr_child', String(exp.priceLKR?.child ?? 0));
        fd.append('is_active', 'true');
        const res = await experienceApi.create(fd);
        setLocalExperiences(prev => [...prev, mapDbToUi(res.data?.data || {})]);
        succeeded++;
      } catch { /* skip duplicates / invalid entries */ }
    }
    // Clear legacy data regardless
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      if (stored[plantation.id]) { delete stored[plantation.id].experiences; localStorage.setItem('plantations', JSON.stringify(stored)); }
    } catch { /* ignore */ }
    setLegacyExperiences([]);
    showMessage(`Migrated ${succeeded} of ${legacyExperiences.length} experience(s) to database.`, 'success');
    onSaved?.();
    setIsMigrating(false);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // ── Save (create or update) ─────────────────────────────────────────────
  const handleSaveExperience = async (experience: Experience, imageFiles: File[]) => {
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', experience.name);
      fd.append('short_description', experience.shortDescription || '');
      fd.append('detailed_description', experience.description || '');
      fd.append('announcement', experience.announcement || '');
      fd.append('price_usd_adult', String(experience.priceUSD.adult));
      fd.append('price_usd_child', String(experience.priceUSD.child));
      fd.append('price_lkr_adult', String(experience.priceLKR.adult));
      fd.append('price_lkr_child', String(experience.priceLKR.child));
      fd.append('is_active', 'true');

      // Append all selected images — backend accepts upload.array('images', 10)
      imageFiles.forEach(f => fd.append('images', f));

      if (experience.id) {
        const res = await experienceApi.update(experience.id, fd);
        const updated = mapDbToUi(res.data?.data || experience);
        updated.id = experience.id;
        setLocalExperiences(prev => prev.map(e => e.id === experience.id ? updated : e));
        showMessage('Experience updated successfully!', 'success');
        onSaved?.();
      } else {
        fd.append('plantation_id', plantation.id);
        const res = await experienceApi.create(fd);
        const created = mapDbToUi(res.data?.data || {});
        setLocalExperiences(prev => [...prev, created]);
        showMessage('Experience added successfully!', 'success');
        onSaved?.();
      }
    } catch (err) {
      console.error('Failed to save experience:', err);
      showMessage('Failed to save experience. Please try again.', 'error');
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDeleteExperience = async (experience: Experience) => {
    if (!experience.id) return;
    if (!window.confirm(`Delete "${experience.name}"?`)) return;

    setIsLoading(true);
    try {
      await experienceApi.delete(experience.id);
      setLocalExperiences(prev => prev.filter(e => e.id !== experience.id));
      showMessage('Experience deleted.', 'success');
      onSaved?.();
    } catch (err) {
      console.error('Failed to delete experience:', err);
      showMessage('Failed to delete experience.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1B4332]">Manage Experiences</h2>
        <button
          onClick={() => { setCurrentExperience(undefined); setIsModalOpen(true); }}
          disabled={isLoading}
          className="bg-[#52B788] hover:bg-[#40916c] disabled:bg-gray-300 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
        >
          <PlusCircle size={20} /> Add New Experience
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-md mb-6 border ${message.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Migration banner: shown when old browser-only data exists but DB is empty */}
      {legacyExperiences.length > 0 && localExperiences.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Previous experiences found in browser storage</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {legacyExperiences.length} experience{legacyExperiences.length !== 1 ? 's were' : ' was'} saved locally before the database integration was set up. Click <strong>Migrate</strong> to save them to the database so tourists can see them.
            </p>
          </div>
          <button
            onClick={handleMigrateLegacy}
            disabled={isMigrating}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-2 px-5 rounded-lg transition text-sm"
          >
            {isMigrating ? 'Migrating…' : `Migrate ${legacyExperiences.length} Experience${legacyExperiences.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {localExperiences.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg mb-2">No experiences added yet.</p>
          <p className="text-gray-500 text-sm">Click "Add New Experience" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localExperiences.map((exp) => (
            <div key={exp.id || exp.name} className="bg-gray-50 p-5 rounded-lg border border-gray-200 flex items-start justify-between gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-[#2D6A4F] truncate">{exp.name}</h3>
                {exp.shortDescription && <p className="text-sm text-gray-500 mt-0.5 truncate">{exp.shortDescription}</p>}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span><span className="font-semibold">USD:</span> Adult ${exp.priceUSD.adult} | Child ${exp.priceUSD.child}</span>
                  <span><span className="font-semibold">LKR:</span> Adult Rs {exp.priceLKR.adult} | Child Rs {exp.priceLKR.child}</span>
                </div>
                {exp.announcement && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">{exp.announcement}</p>
                )}
                {exp.images && exp.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {exp.images.slice(0, 3).map((src, i) => (
                      <img key={i} src={src} alt="" className="w-12 h-12 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setCurrentExperience(exp); setIsModalOpen(true); }}
                  disabled={isLoading}
                  className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition disabled:opacity-50"
                  title="Edit"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteExperience(exp)}
                  disabled={isLoading}
                  className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 size={18} />
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
