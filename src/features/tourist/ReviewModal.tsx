
import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: { plantationName: string; rating: number; reviewText: string; image?: string }) => void;
  experiencedPlantations: string[]; 
  initialSelectedPlantation?: string; 
}

export default function ReviewModal({ isOpen, onClose, onSubmit, experiencedPlantations, initialSelectedPlantation = '' }: ReviewModalProps) {
  const [selectedPlantation, setSelectedPlantation] = useState(initialSelectedPlantation);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlantation === '' || rating === 0 || reviewText.trim() === '') {
      alert('Please select a plantation, provide a rating, and your experience.');
      return;
    }

    const imageUrl = imagePreviewUrl || undefined;

    onSubmit({ plantationName: selectedPlantation, rating, reviewText, image: imageUrl });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#2D6A4F]">Write a Review</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Plantation Selection */}
          <div className="mb-6">
            <label htmlFor="plantationSelect" className="block text-lg font-semibold mb-3 text-gray-700">
              Select Plantation <span className="text-red-500">*</span>
            </label>
            <select
              id="plantationSelect"
              value={selectedPlantation}
              onChange={(e) => setSelectedPlantation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-base"
              required
              disabled={!!initialSelectedPlantation} // Disable if a plantation is pre-selected
            >
              <option value="" disabled>Choose a plantation you visited</option>
              {experiencedPlantations.map((pName) => (
                <option key={pName} value={pName}>{pName}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-3 text-gray-700">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`text-5xl transition-colors ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label htmlFor="reviewText" className="block text-lg font-semibold mb-3 text-gray-700">
              Your Experience <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Save your thoughts about the experience."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none text-base"
              required
            />
          </div>

          {/* Photo Upload (Optional) */}
          <div className="mb-8">
            <label className="block text-lg font-semibold mb-3 text-gray-700">
              Upload Photos (Optional)
            </label>
            <label
              htmlFor="imageUpload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
            >
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
              ) : (
                <>
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <p className="text-gray-600">Upload Image</p>
                </>
              )}
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {imageFile && (
              <p className="text-sm text-gray-500 mt-2">Selected: {imageFile.name}</p>
            )}
          </div>

          {/* Note */}
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md text-sm mb-8">
            Note: Reviews cannot be edited or deleted once submitted. Please review your feedback carefully.
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#f0f0f0] font-semibold py-3 px-6 rounded-lg transition text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#52B788] hover:bg-[#40916c] text-white font-semibold py-3 px-6 rounded-lg transition text-lg"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
