import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Camera, GalleryHorizontal } from 'lucide-react';
import { plantationApi } from '../../services/api';

interface Plantation {
  id: string;
  name: string;
  main_image_url?: string;
  mainImage?: string;
  galleryImages?: string[];
  gallery?: string[];
}

interface PlantationMediaManagementProps {
  plantation: Plantation;
  onSaved?: () => void;
}

export default function PlantationMediaManagement({ plantation, onSaved }: PlantationMediaManagementProps) {
 
  const initialGallery: string[] = plantation.galleryImages || plantation.gallery || [];
  const initialMainImage: string = plantation.main_image_url || plantation.mainImage || '';

  const [mainImagePreview, setMainImagePreview] = useState<string>(initialMainImage);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);

  
  const [originalGallery, setOriginalGallery] = useState<string[]>(initialGallery);
  
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(initialGallery);
  
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);

 
  useEffect(() => {
    const gallery = plantation.galleryImages || plantation.gallery || [];
    const main = plantation.main_image_url || plantation.mainImage || '';
    setOriginalGallery(gallery);
    setGalleryPreviews(gallery);
    setMainImagePreview(main);
    setMainImageFile(null);
    setNewGalleryFiles([]);
  }, [plantation.id]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  
  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewGalleryFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      setGalleryPreviews(prev => [...prev, URL.createObjectURL(file)]);
    });
    e.target.value = '';
  };

  const handleRemoveGalleryImage = (index: number) => {
    const url = galleryPreviews[index];
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));

    
    if (url.startsWith('blob:')) {
      const newFileIndex = galleryPreviews
        .slice(0, index)
        .filter(u => u.startsWith('blob:')).length;
      setNewGalleryFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
    
      if (mainImageFile) {
        const fd = new FormData();
        fd.append('mainImage', mainImageFile);
        await plantationApi.update(plantation.id, fd);
      }

      
      const removedUrls = originalGallery.filter(url => !galleryPreviews.includes(url));
      for (const url of removedUrls) {
        await plantationApi.deleteGalleryImage(plantation.id, url);
      }

     
      if (newGalleryFiles.length > 0) {
        const fd = new FormData();
        newGalleryFiles.forEach(file => fd.append('images', file));
        const res = await plantationApi.addGalleryImages(plantation.id, fd);
        const uploadedUrls: string[] = res.data?.data || [];

        
        setGalleryPreviews(prev => {
          let uploadIdx = 0;
          return prev.map(url => {
            if (url.startsWith('blob:') && uploadIdx < uploadedUrls.length) {
              return uploadedUrls[uploadIdx++];
            }
            return url;
          });
        });
      }

      
      setOriginalGallery(galleryPreviews.filter(u => !u.startsWith('blob:')));
      setNewGalleryFiles([]);
      setMainImageFile(null);

      showMessage('Media saved successfully!', 'success');
      onSaved?.();
    } catch (err) {
      console.error('Failed to save media:', err);
      showMessage('Failed to save media. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-[#1B4332] mb-6">Manage Media Gallery</h2>

      {message && (
        <div className={`px-4 py-3 rounded-md mb-6 border ${message.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ── Main Image ── */}
        <div className="border-b border-gray-200 pb-8">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-6 flex items-center gap-2">
            <Camera size={24} /> Main Plantation Image
          </h3>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full md:w-2/3 lg:w-1/2 h-64 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
              {mainImagePreview ? (
                <img src={mainImagePreview} alt="Main" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">No image selected</span>
              )}
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="absolute bottom-4 right-4 bg-white text-[#2D6A4F] p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
                title="Change Main Image"
              >
                <Upload size={20} />
              </button>
              <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
            </div>
            {mainImageFile && (
              <p className="text-sm text-green-600">New image selected: <strong>{mainImageFile.name}</strong> — will be saved on submit.</p>
            )}
            <p className="text-sm text-gray-500">This image appears prominently on the plantation listing and detail page.</p>
          </div>
        </div>

        {/* ── Gallery Images ── */}
        <div>
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-6 flex items-center gap-2">
            <GalleryHorizontal size={24} /> Gallery Images
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
            {galleryPreviews.map((src, index) => (
              <div key={index} className="relative group w-full h-36 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <img src={src} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                {src.startsWith('blob:') && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">New</div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* Add more button */}
            <div className="flex items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
              <input ref={galleryImageInputRef} type="file" accept="image/*" multiple onChange={handleGalleryImageChange} className="hidden" />
              <button
                type="button"
                onClick={() => galleryImageInputRef.current?.click()}
                className="flex flex-col items-center text-gray-600 hover:text-[#2D6A4F]"
              >
                <Upload size={32} />
                <span className="mt-2 text-sm font-medium">Add Photos</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {newGalleryFiles.length > 0
              ? `${newGalleryFiles.length} new image${newGalleryFiles.length > 1 ? 's' : ''} queued for upload.`
              : 'Upload photos to showcase your plantation.'}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-400 text-white font-semibold py-2 px-8 rounded-lg transition flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving…
              </>
            ) : 'Save Media'}
          </button>
        </div>
      </form>
    </div>
  );
}
