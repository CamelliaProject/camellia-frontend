import { useState, useRef } from 'react';
import { MapPin, Info, CalendarCheck, Activity, Phone, Mail, Mountain, Maximize2, Users, Calendar, ImageIcon, Pencil, X, Check } from 'lucide-react';
import { plantationApi } from '../../services/api';

interface Plantation {
  id: string;
  name: string;
  address: string;
  description: string;
  detailedDescription: string;
  bestTime: string;
  main_image_url?: string;
  contact: { phone: string; email: string };
  highlights: { altitude: string; area: string; visitors: string; established: string };
  activities: string[];
}

interface Props { plantation: Plantation; }


function ViewField({ label, value, span2 = false }: { label: string; value: string; span2?: boolean }) {
  return (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{value || <span className="text-gray-300 italic">—</span>}</p>
    </div>
  );
}


function Field({
  label, id, name, value, onChange, span2 = false, type = 'text',
}: {
  label: string; id: string; name: string; value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  span2?: boolean; type?: string;
}) {
  return (
    <div className={span2 ? 'md:col-span-2' : ''}>
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent bg-white"
      />
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="text-[#2D6A4F]">{icon}</span>
        <h3 className="text-sm font-semibold text-[#1B4332] uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function PlantationDetailsManagement({ plantation }: Props) {
  const [formData, setFormData] = useState<Plantation>(plantation);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(plantation.main_image_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, contact: { ...prev.contact, [name]: value } }));
  };

  const handleHighlightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, highlights: { ...prev.highlights, [name]: value } }));
  };

  const handleAddActivity = () => {
    if (newActivity.trim()) {
      setFormData(prev => ({ ...prev, activities: [...prev.activities, newActivity.trim()] }));
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (i: number) => {
    setFormData(prev => ({ ...prev, activities: prev.activities.filter((_, idx) => idx !== i) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(plantation);
    setMainImageFile(null);
    setMainImagePreview(plantation.main_image_url || '');
    setMessage('');
    setNewActivity('');
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
    } catch {
      setMessage('Failed to update details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1B4332]">{formData.name || 'Plantation Details'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{formData.address || 'No address set'}</p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Pencil size={14} /> Edit Details
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <X size={14} /> Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Check size={14} /> {isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* ── Status message ── */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          message.startsWith('Failed') || message.startsWith('Error')
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {message.startsWith('Failed') || message.startsWith('Error')
            ? <X size={15} />
            : <Check size={15} />}
          {message}
        </div>
      )}

      {/* ── General Information ── */}
      <Section icon={<Info size={16} />} title="General Information">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Plantation Name" id="name" name="name" value={formData.name} onChange={handleChange} />
            <Field label="Address" id="address" name="address" value={formData.address} onChange={handleChange} />
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Short Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent bg-white resize-y"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="detailedDescription" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Detailed Description
              </label>
              <textarea
                id="detailedDescription"
                name="detailedDescription"
                value={formData.detailedDescription}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent bg-white resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <ViewField label="Plantation Name" value={formData.name} />
            <ViewField label="Address" value={formData.address} />
            <ViewField label="Short Description" value={formData.description} span2 />
            <ViewField label="Detailed Description" value={formData.detailedDescription} span2 />
          </div>
        )}
      </Section>

      {/* ── Main Image ── */}
      <Section icon={<ImageIcon size={16} />} title="Main Image">
        <div className="flex items-start gap-6">
          <div className="w-44 h-32 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
            {mainImagePreview ? (
              <img src={mainImagePreview} alt="Main" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
            )}
          </div>
          {isEditing ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-[#52B788] text-sm font-medium text-gray-700 rounded-lg transition"
              >
                {mainImagePreview ? 'Change Image' : 'Upload Image'}
              </button>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP · saved to cloud</p>
              {mainImageFile && (
                <p className="text-xs text-[#2D6A4F] mt-1 font-medium">{mainImageFile.name}</p>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          ) : (
            <p className="text-xs text-gray-400 pt-1">This image appears as the plantation cover photo.</p>
          )}
        </div>
      </Section>

      {/* ── Contact Information ── */}
      <Section icon={<MapPin size={16} />} title="Contact Information">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact.phone" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                id="contact.phone"
                name="phone"
                value={formData.contact.phone}
                onChange={handleContactChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label htmlFor="contact.email" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="contact.email"
                name="email"
                value={formData.contact.email}
                onChange={handleContactChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] focus:border-transparent bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phone Number</p>
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <Phone size={13} className="text-[#52B788]" />
                {formData.contact.phone || <span className="text-gray-300 italic">—</span>}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email Address</p>
              <div className="flex items-center gap-2 text-sm text-gray-800">
                <Mail size={13} className="text-[#52B788]" />
                {formData.contact.email || <span className="text-gray-300 italic">—</span>}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ── Estate Highlights ── */}
      <Section icon={<Mountain size={16} />} title="Estate Highlights">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="highlights.altitude" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Altitude</label>
              <input type="text" id="highlights.altitude" name="altitude" value={formData.highlights.altitude} onChange={handleHighlightChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] bg-white" />
            </div>
            <div>
              <label htmlFor="highlights.area" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Area (Hectares)</label>
              <input type="text" id="highlights.area" name="area" value={formData.highlights.area} onChange={handleHighlightChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] bg-white" />
            </div>
            <div>
              <label htmlFor="highlights.visitors" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Annual Visitors</label>
              <input type="text" id="highlights.visitors" name="visitors" value={formData.highlights.visitors} onChange={handleHighlightChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] bg-white" />
            </div>
            <div>
              <label htmlFor="highlights.established" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Established Year</label>
              <input type="text" id="highlights.established" name="established" value={formData.highlights.established} onChange={handleHighlightChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] bg-white" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Mountain size={16} />, label: 'Altitude', value: formData.highlights.altitude },
              { icon: <Maximize2 size={16} />, label: 'Area', value: formData.highlights.area ? `${formData.highlights.area} ha` : '' },
              { icon: <Users size={16} />, label: 'Annual Visitors', value: formData.highlights.visitors },
              { icon: <Calendar size={16} />, label: 'Established', value: formData.highlights.established },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white rounded-lg p-4 border border-gray-100 text-center">
                <span className="inline-flex text-[#52B788] mb-2">{icon}</span>
                <p className="text-lg font-bold text-[#1B4332]">{value || '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Activities ── */}
      <Section icon={<Activity size={16} />} title="Available Activities">
        <div className="flex flex-wrap gap-2">
          {formData.activities.length === 0 && (
            <p className="text-sm text-gray-400 italic">No activities listed yet.</p>
          )}
          {formData.activities.map((activity, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-white border border-[#B7E4C7] text-[#1B4332] text-sm px-3 py-1.5 rounded-full"
            >
              {activity}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleRemoveActivity(i)}
                  className="text-gray-400 hover:text-red-500 transition ml-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
        {isEditing && (
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={newActivity}
              onChange={e => setNewActivity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
              placeholder="Type an activity and press Add"
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] bg-white"
            />
            <button
              type="button"
              onClick={handleAddActivity}
              className="px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-medium rounded-lg transition"
            >
              Add
            </button>
          </div>
        )}
      </Section>

      {/* ── Best Time to Visit ── */}
      <Section icon={<CalendarCheck size={16} />} title="Best Time to Visit">
        {isEditing ? (
          <input
            type="text"
            id="bestTime"
            name="bestTime"
            value={formData.bestTime}
            onChange={handleChange}
            placeholder="e.g. January – March, July – September"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#52B788] bg-white"
          />
        ) : (
          <p className="text-sm text-gray-800">{formData.bestTime || <span className="text-gray-300 italic">—</span>}</p>
        )}
      </Section>

    </form>
  );
}
