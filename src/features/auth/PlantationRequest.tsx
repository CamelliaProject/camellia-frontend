import { useState } from 'react';
import api from '../../services/api';

export default function PlantationRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    businessReg: '',
    address: '',
    telephone: '',
    email: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.ownerName.trim() || !formData.businessReg.trim() || !formData.address.trim() || !formData.telephone.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/plantation-requests', {
        name: formData.name,
        ownerName: formData.ownerName,
        businessReg: formData.businessReg,
        address: formData.address,
        telephone: formData.telephone,
        email: formData.email,
        description: formData.description,
      });
      setSuccess('Your plantation registration request has been submitted. Super admin will review it soon.');
      setFormData({
        name: '',
        ownerName: '',
        businessReg: '',
        address: '',
        telephone: '',
        email: '',
        description: '',
      });
    } catch (err) {
      setError('Unable to submit registration request. Please try again later.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-3xl font-bold text-[#1B4332] mb-4">Plantation Registration Request</h1>
        <p className="text-gray-600 mb-8">
          Submit your plantation details and wait for super admin approval. Once approved, an admin account will be created for your plantation.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#1B4332] mb-2">Plantation Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1B4332] mb-2">Owner Name</label>
              <input
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#1B4332] mb-2">Business Registration</label>
              <input
                name="businessReg"
                value={formData.businessReg}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1B4332] mb-2">Telephone</label>
              <input
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#1B4332] mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1B4332] mb-2">Address</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B4332] mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#2D6A4F] px-4 py-3 text-white font-semibold hover:bg-[#1B4332] transition disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? 'Sending request...' : 'Submit Registration Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
