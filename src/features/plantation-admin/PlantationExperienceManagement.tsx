import { useState, useEffect, useRef } from 'react';
import { PlusCircle, Edit3, Trash2, X, DollarSign, ImagePlus, Loader2, Lock, AlertTriangle } from 'lucide-react';
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
  upcomingBookingCount: number;
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
    upcomingBookingCount: Number(raw.upcoming_booking_count ?? 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Locked field display — replaces an input when the field cannot be edited
// ─────────────────────────────────────────────────────────────────────────────
function LockedValue({ value }: { value: string | number }) {
  return (
    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed select-none pointer-events-none">
      {value}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Experience Modal
// ─────────────────────────────────────────────────────────────────────────────
interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (experience: Experience, imageFiles: File[], imagesToDelete: string[]) => void;
  initialExperience?: Experience;
}

function ExperienceModal({ isOpen, onClose, onSubmit, initialExperience }: ExperienceModalProps) {
  const isLocked = (initialExperience?.upcomingBookingCount ?? 0) > 0;

  const [formData, setFormData] = useState<Experience>({
    name: '',
    description: '',
    shortDescription: '',
    announcement: '',
    priceLKR: { adult: 0, child: 0 },
    priceUSD: { adult: 0, child: 0 },
    images: [],
    upcomingBookingCount: 0,
  });
  const [savedPreviews, setSavedPreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialExperience) {
      setFormData(initialExperience);
      setSavedPreviews(initialExperience.images || []);
    } else {
      setFormData({
        name: '', description: '', shortDescription: '', announcement: '',
        priceLKR: { adult: 0, child: 0 }, priceUSD: { adult: 0, child: 0 },
        images: [], upcomingBookingCount: 0,
      });
      setSavedPreviews([]);
    }
    setImagesToDelete([]);
    setImageFiles([]);
    setNewPreviews([]);
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
    files.forEach(file => {
      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => setNewPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveSaved = (url: string) => {
    setImagesToDelete(prev => [...prev, url]);
    setSavedPreviews(prev => prev.filter(u => u !== url));
  };

  const handleRemoveNew = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      { ...formData, id: initialExperience?.id, upcomingBookingCount: initialExperience?.upcomingBookingCount ?? 0 },
      imageFiles,
      imagesToDelete,
    );
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

          {/* Lock banner — shown whenever the experience has active bookings */}
          {isLocked && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
              <Lock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Name &amp; prices are locked</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This experience has <strong>{initialExperience!.upcomingBookingCount}</strong> active booking{initialExperience!.upcomingBookingCount !== 1 ? 's' : ''}.
                  The name and all prices cannot be changed while customers have active bookings.
                  You can still edit the description, images, and announcement.
                </p>
              </div>
            </div>
          )}

          {/* Experience Name */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-gray-700">
              Experience Name <span className="text-red-500">*</span>
              {isLocked && <Lock size={12} className="text-amber-500" />}
            </label>
            {isLocked ? (
              <LockedValue value={formData.name} />
            ) : (
              <input
                type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]"
              />
            )}
          </div>

          {/* Short description — always editable */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Short Description</label>
            <input type="text" name="shortDescription" value={formData.shortDescription || ''} onChange={handleChange}
              placeholder="Brief one-line description for the listing"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>

          {/* Full description — always editable */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Full Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange}
              placeholder="Detailed description tourists will see" rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>

          {/* Images — always editable */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-[#2D6A4F] mb-4 flex items-center gap-2"><ImagePlus size={20} /> Experience Images</h3>

            {savedPreviews.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 font-medium mb-2">Saved images — click 🗑 to remove</p>
                <div className="grid grid-cols-3 gap-3">
                  {savedPreviews.map(url => (
                    <div key={url} className="relative group">
                      <img src={url} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition" />
                      <button type="button" onClick={() => handleRemoveSaved(url)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        title="Delete this image">
                        <Trash2 size={13} />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-white/80 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">Saved</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newPreviews.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 font-medium mb-2">New images — will be uploaded on save</p>
                <div className="grid grid-cols-3 gap-3">
                  {newPreviews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img src={src} alt="" className="w-full h-24 object-cover rounded-lg border-2 border-blue-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition" />
                      <button type="button" onClick={() => handleRemoveNew(idx)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        title="Remove">
                        <X size={13} />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-blue-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">New</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input ref={imageInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
            <button type="button" onClick={() => imageInputRef.current?.click()}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg transition border-2 border-dashed border-blue-300">
              <ImagePlus size={18} className="inline mr-2" /> Add Images
            </button>

            {imagesToDelete.length > 0 && (
              <p className="text-xs text-red-500 mt-2">{imagesToDelete.length} image{imagesToDelete.length > 1 ? 's' : ''} will be deleted on save.</p>
            )}
          </div>

          {/* USD Prices */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
              <DollarSign size={20} /> Prices — Foreigners (USD)
              {isLocked && <Lock size={15} className="text-amber-500" />}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Adult Price (USD) <span className="text-red-500">*</span></label>
                {isLocked ? (
                  <LockedValue value={`$${formData.priceUSD.adult}`} />
                ) : (
                  <input type="number" name="adultPriceUSD" value={formData.priceUSD.adult} onChange={handleChange} min="0" step="0.01" required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Child Price (USD) <span className="text-red-500">*</span></label>
                {isLocked ? (
                  <LockedValue value={`$${formData.priceUSD.child}`} />
                ) : (
                  <input type="number" name="childPriceUSD" value={formData.priceUSD.child} onChange={handleChange} min="0" step="0.01" required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
                )}
              </div>
            </div>
          </div>

          {/* LKR Prices */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-[#2D6A4F] mb-4 flex items-center gap-2">
              <DollarSign size={20} /> Prices — Sri Lankans (LKR)
              {isLocked && <Lock size={15} className="text-amber-500" />}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Adult Price (LKR) <span className="text-red-500">*</span></label>
                {isLocked ? (
                  <LockedValue value={`Rs ${formData.priceLKR.adult}`} />
                ) : (
                  <input type="number" name="adultPriceLKR" value={formData.priceLKR.adult} onChange={handleChange} min="0" step="0.01" required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Child Price (LKR) <span className="text-red-500">*</span></label>
                {isLocked ? (
                  <LockedValue value={`Rs ${formData.priceLKR.child}`} />
                ) : (
                  <input type="number" name="childPriceLKR" value={formData.priceLKR.child} onChange={handleChange} min="0" step="0.01" required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
                )}
              </div>
            </div>
          </div>

          {/* Announcement — always editable */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Announcement <span className="text-gray-500">(optional)</span></label>
            <textarea name="announcement" value={formData.announcement || ''} onChange={handleChange}
              placeholder="E.g. 'Not available on Sundays' — shown in orange on tourist side" rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#52B788]" />
          </div>

          <div className="flex gap-4 justify-end pt-6">
            <button type="button" onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition">
              Cancel
            </button>
            <button type="submit"
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-2 px-6 rounded-lg transition">
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
  const [listLoading, setListLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [localExperiences, setLocalExperiences] = useState<Experience[]>([]);

  // Legacy browser-stored experiences (pre-DB migration)
  const [legacyExperiences, setLegacyExperiences] = useState<any[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      return stored[plantation.id]?.experiences || [];
    } catch { return []; }
  });
  const [isMigrating, setIsMigrating] = useState(false);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Fetch experiences directly so upcoming_booking_count is always fresh
  const loadExperiences = async () => {
    setListLoading(true);
    try {
      const res = await experienceApi.getByPlantation(plantation.id);
      setLocalExperiences((res.data?.data || []).map(mapDbToUi));
    } catch {
      showMessage('Failed to load experiences.', 'error');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { void loadExperiences(); }, [plantation.id]);

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
        await experienceApi.create(fd);
        succeeded++;
      } catch { /* skip duplicates */ }
    }
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      if (stored[plantation.id]) {
        delete stored[plantation.id].experiences;
        localStorage.setItem('plantations', JSON.stringify(stored));
      }
    } catch { /* ignore */ }
    setLegacyExperiences([]);
    showMessage(`Migrated ${succeeded} of ${legacyExperiences.length} experience(s) to database.`, 'success');
    onSaved?.();
    void loadExperiences();
    setIsMigrating(false);
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSaveExperience = async (experience: Experience, imageFiles: File[], imagesToDelete: string[]) => {
    setIsLoading(true);
    try {
      if (imagesToDelete.length > 0 && experience.id) {
        await Promise.all(imagesToDelete.map(url => experienceApi.deleteImage(experience.id!, url)));
      }

      const locked = experience.upcomingBookingCount > 0;

      const fd = new FormData();
      // Never send name or prices to the backend when locked — those are immutable while bookings exist
      if (!locked) {
        fd.append('name', experience.name);
        fd.append('price_usd_adult', String(experience.priceUSD.adult));
        fd.append('price_usd_child', String(experience.priceUSD.child));
        fd.append('price_lkr_adult', String(experience.priceLKR.adult));
        fd.append('price_lkr_child', String(experience.priceLKR.child));
      }
      fd.append('short_description', experience.shortDescription || '');
      fd.append('detailed_description', experience.description || '');
      fd.append('announcement', experience.announcement || '');
      fd.append('is_active', 'true');
      imageFiles.forEach(f => fd.append('images', f));

      if (experience.id) {
        await experienceApi.update(experience.id, fd);
        showMessage('Experience updated successfully!', 'success');
      } else {
        fd.append('plantation_id', plantation.id);
        await experienceApi.create(fd);
        showMessage('Experience added successfully!', 'success');
      }
      onSaved?.();
      void loadExperiences(); // re-fetch so booking counts stay accurate
    } catch (err: any) {
      showMessage(err?.response?.data?.error || 'Failed to save experience. Please try again.', 'error');
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteExperience = async (experience: Experience) => {
    if (!experience.id) return;
    if (!window.confirm(`Delete "${experience.name}"?`)) return;
    setIsLoading(true);
    try {
      await experienceApi.delete(experience.id);
      showMessage('Experience deleted.', 'success');
      onSaved?.();
      void loadExperiences();
    } catch (err: any) {
      showMessage(err?.response?.data?.error || 'Failed to delete experience.', 'error');
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
          disabled={isLoading || listLoading}
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

      {legacyExperiences.length > 0 && localExperiences.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Previous experiences found in browser storage</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {legacyExperiences.length} experience{legacyExperiences.length !== 1 ? 's were' : ' was'} saved locally before the database integration. Click <strong>Migrate</strong> to save them.
            </p>
          </div>
          <button onClick={handleMigrateLegacy} disabled={isMigrating}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-2 px-5 rounded-lg transition text-sm">
            {isMigrating ? 'Migrating…' : `Migrate ${legacyExperiences.length} Experience${legacyExperiences.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {listLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="animate-spin" size={20} /> Loading experiences…
        </div>
      ) : localExperiences.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg mb-2">No experiences added yet.</p>
          <p className="text-gray-500 text-sm">Click "Add New Experience" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localExperiences.map(exp => {
            const hasBookings = exp.upcomingBookingCount > 0;
            return (
              <div key={exp.id || exp.name}
                className={`bg-gray-50 p-5 rounded-lg border flex items-start justify-between gap-4 shadow-sm
                  ${hasBookings ? 'border-amber-200' : 'border-gray-200'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-[#2D6A4F] truncate">{exp.name}</h3>
                    {hasBookings && (
                      <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle size={11} />
                        {exp.upcomingBookingCount} active booking{exp.upcomingBookingCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {exp.shortDescription && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{exp.shortDescription}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      {hasBookings && <Lock size={12} className="inline text-amber-500 mr-1" />}
                      <span className="font-semibold">USD:</span> Adult ${exp.priceUSD.adult} | Child ${exp.priceUSD.child}
                    </span>
                    <span>
                      <span className="font-semibold">LKR:</span> Adult Rs {exp.priceLKR.adult} | Child Rs {exp.priceLKR.child}
                    </span>
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

                <div className="flex gap-2 flex-shrink-0 items-center">
                  {/* Edit button — always available */}
                  <button
                    onClick={() => { setCurrentExperience(exp); setIsModalOpen(true); }}
                    disabled={isLoading}
                    className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition disabled:opacity-50"
                    title="Edit experience"
                  >
                    <Edit3 size={18} />
                  </button>

                  {/* Delete — frozen (non-interactive span) when bookings exist */}
                  <div className="relative group">
                    {hasBookings ? (
                      /* pointer-events-none + no onClick = completely dead element */
                      <span
                        className="p-2 rounded-full bg-gray-100 text-gray-300 cursor-not-allowed pointer-events-none select-none inline-flex items-center justify-center"
                        aria-disabled="true"
                      >
                        <Lock size={18} />
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDeleteExperience(exp)}
                        disabled={isLoading}
                        className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                        title="Delete experience"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    {/* Tooltip appears on parent hover even though the span is frozen */}
                    {hasBookings && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-normal">
                        Cannot delete — {exp.upcomingBookingCount} active booking{exp.upcomingBookingCount !== 1 ? 's' : ''} exist. Complete or cancel them first.
                        <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
