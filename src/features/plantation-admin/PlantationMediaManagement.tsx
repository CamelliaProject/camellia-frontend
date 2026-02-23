import { useState, useRef } from 'react';
import { Upload, Trash2, Camera, GalleryHorizontal } from 'lucide-react';

// Assuming Plantation type from PlantationDetail.tsx, extended for editable media
interface Experience {
  name: string;
  category?: string;
  description?: string;
  shortDescription?: string;
  images?: string[];
  priceUSD?: { adult: number; child: number };
  priceLKR?: { adult: number; child: number };
  timeSlots?: Array<{ date: string; time: string; capacity: number; booked: number }>;
}

interface Plantation {
  id: string;
  name: string;
  mainImage: string;
  galleryImages: string[];
  experiences?: Experience[];
}

interface PlantationMediaManagementProps {
  plantation: Plantation;
}

export default function PlantationMediaManagement({ plantation }: PlantationMediaManagementProps) {
  const [mainImagePreview, setMainImagePreview] = useState<string>(plantation.mainImage);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(plantation.galleryImages);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [experienceImages, setExperienceImages] = useState<Record<string, string[]>>(
    plantation.experiences?.reduce((acc, exp) => {
      acc[exp.name] = exp.images || [];
      return acc;
    }, {} as Record<string, string[]>) || {}
  );

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const experienceImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
        // In a real app, you would also store the File object to upload later
      };
      reader.readAsDataURL(file);
      setMessage('');
    }
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewGalleryFiles((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
      e.target.value = ''; // Clear input for next selection
      setMessage('');
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number, isNewFile: boolean = false) => {
    if (isNewFile) {
      // Remove from new files list and its preview
      setNewGalleryFiles((prev) => prev.filter((_, idx) => idx !== (indexToRemove - (galleryPreviews.length - newGalleryFiles.length))));
      setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    } else {
      // Remove from existing gallery images
      setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
      // In a real app, you'd mark this image for deletion on the backend
    }
    setMessage('');
  };

  const handleExperienceImageChange = (e: React.ChangeEvent<HTMLInputElement>, experienceName: string) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setExperienceImages((prev) => ({
            ...prev,
            [experienceName]: [...(prev[experienceName] || []), reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
      setMessage('');
    }
  };

  const handleRemoveExperienceImage = (experienceName: string, indexToRemove: number) => {
    setExperienceImages((prev) => ({
      ...prev,
      [experienceName]: (prev[experienceName] || []).filter((_, idx) => idx !== indexToRemove),
    }));
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Simulate image uploads and updates
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Uploading main image:', mainImagePreview);
    console.log('Updating gallery:', galleryPreviews);
    console.log('New files to upload:', newGalleryFiles);

    // In a real application:
    // 1. Upload new mainImagePreview if it's different from initial plantation.mainImage
    // 2. Upload newGalleryFiles to your storage (e.g., S3, Cloudinary)
    // 3. Update plantation.galleryImages on your backend with new URLs and removed ones
    // 4. Handle potential errors during upload/update

    setMessage('Media updated successfully!');
    setIsLoading(false);
    // Refresh previews or reset state if needed
    // Persist media changes so tourist view reflects updates
    try {
      const stored = JSON.parse(localStorage.getItem('plantations') || '{}');
      const existing = stored[plantation.id] || {};
      existing.mainImage = mainImagePreview;
      existing.galleryImages = galleryPreviews;
      // Persist experience images
      if (existing.experiences) {
        existing.experiences = existing.experiences.map((exp: any) => ({
          ...exp,
          images: experienceImages[exp.name] || exp.images || [],
        }));
      }
      stored[plantation.id] = existing;
      localStorage.setItem('plantations', JSON.stringify(stored));
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = await import('../tourist/PlantationDetail') as any;
        if (mod && mod.PLANTATION_DATA && mod.PLANTATION_DATA[plantation.id]) {
          mod.PLANTATION_DATA[plantation.id].mainImage = mainImagePreview;
          mod.PLANTATION_DATA[plantation.id].galleryImages = galleryPreviews;
          // Update experience images
          if (mod.PLANTATION_DATA[plantation.id].experiences) {
            mod.PLANTATION_DATA[plantation.id].experiences = mod.PLANTATION_DATA[plantation.id].experiences.map((exp: any) => ({
              ...exp,
              images: experienceImages[exp.name] || exp.images || [],
            }));
          }
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to persist media changes:', err);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-[#1B4332] mb-6">Manage Media Gallery</h2>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Main Image */}
        <div className="border-b border-gray-200 pb-8">
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-6 flex items-center gap-2">
            <Camera size={24} /> Main Plantation Image
          </h3>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full md:w-2/3 lg:w-1/2 h-64 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
              {mainImagePreview ? (
                <img src={mainImagePreview} alt="Main Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">No Image Selected</span>
              )}
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                className="absolute bottom-4 right-4 bg-white text-[#2D6A4F] p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
                title="Change Main Image"
              >
                <Upload size={20} />
              </button>
              <input
                type="file"
                ref={mainImageInputRef}
                accept="image/*"
                onChange={handleMainImageChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-500">
              This image will be featured prominently on your plantation's page.
            </p>
          </div>
        </div>

        {/* Gallery Images */}
        <div>
          <h3 className="text-2xl font-bold text-[#2D6A4F] mb-6 flex items-center gap-2">
            <GalleryHorizontal size={24} /> Gallery Images
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {galleryPreviews.map((imageSrc, index) => (
              <div key={index} className="relative group w-full h-36 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <img src={imageSrc} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(index, index >= (plantation.galleryImages?.length || 0))} // Check if it's a newly added file
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {/* Upload Button for New Gallery Images */}
            <div className="flex items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <input
                type="file"
                ref={galleryImageInputRef}
                accept="image/*"
                multiple
                onChange={handleGalleryImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryImageInputRef.current?.click()}
                className="flex flex-col items-center text-gray-600 hover:text-[#2D6A4F]"
              >
                <Upload size={32} />
                <span className="mt-2 text-sm font-medium">Add More Photos</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Upload images to showcase your plantation's beauty and attractions.
          </p>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-2 px-6 rounded-lg transition disabled:bg-gray-400"
          >
            {isLoading ? 'Saving Media...' : 'Save Media Changes'}
          </button>
        </div>

        {/* Experience Gallery Images */}
        {plantation.experiences && plantation.experiences.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-2xl font-bold text-[#2D6A4F] mb-6 flex items-center gap-2">
              <GalleryHorizontal size={24} /> Experience Gallery Images
            </h3>
            <p className="text-sm text-gray-600 mb-6">Manage images for your experiences.</p>
            <div className="space-y-8">
              {plantation.experiences.map((experience) => (
                <div key={experience.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-bold text-[#2D6A4F] mb-4">{experience.name}</h4>
                  {(experienceImages[experience.name]?.length || 0) > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
                      {experienceImages[experience.name]?.map((imageSrc, index) => (
                        <div key={index} className="relative group w-full h-36 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                          <img src={imageSrc} alt={`${experience.name} ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExperienceImage(experience.name, index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove Image"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {/* Upload Button */}
                      <div className="flex items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition">
                        <input
                          ref={(el) => {
                            if (el) experienceImageInputRefs.current[experience.name] = el;
                          }}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleExperienceImageChange(e, experience.name)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => experienceImageInputRefs.current[experience.name]?.click()}
                          className="flex flex-col items-center text-gray-600 hover:text-[#2D6A4F] w-full h-full justify-center"
                        >
                          <Upload size={28} />
                          <span className="mt-2 text-sm font-medium">Add Images</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition mb-6">
                      <input
                        ref={(el) => {
                          if (el) experienceImageInputRefs.current[experience.name] = el;
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleExperienceImageChange(e, experience.name)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => experienceImageInputRefs.current[experience.name]?.click()}
                        className="flex flex-col items-center text-gray-600 hover:text-[#2D6A4F] w-full h-full justify-center"
                      >
                        <Upload size={32} />
                        <span className="mt-2 text-sm font-medium">Add Images for this Experience</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}