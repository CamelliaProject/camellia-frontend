

import { useState, useEffect } from 'react';
import type { Plantation } from '../../features/super-admin/SuperAdminDashboard'; // Import the interface


interface PlantationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantation: Plantation;
  onUpdate: (updatedPlantation: Plantation) => void;
  onGenerateNewCredentials: (plantation: Plantation) => void;
}

export default function PlantationDetailModal({
  isOpen,
  onClose,
  plantation,
  onUpdate,
  onGenerateNewCredentials,
}: PlantationDetailModalProps) {
  const [formData, setFormData] = useState<Plantation>(plantation);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setFormData(plantation); 
    setIsEditing(false); 
    setErrors({});
    setShowPassword(false);
  }, [plantation, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Plantation Name is required';
    if (!formData.owner.trim()) newErrors.owner = 'Owner Name is required';
    if (!formData.businessReg.trim()) newErrors.businessReg = 'Business Registration Number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Telephone Number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Please enter a valid telephone number';
    }
    if (!formData.email.trim()) newErrors.email = 'Email Address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.adminUsername.trim()) newErrors.adminUsername = 'Admin Username is required';
    
    if (!formData.passwordChanged) {
      if (!formData.adminPassword?.trim()) newErrors.adminPassword = 'Admin Password is required';
      else if (formData.adminPassword && formData.adminPassword.length < 6) {
        newErrors.adminPassword = 'Password must be at least 6 characters';
      }
    }
    return newErrors;
  };


  const handleSave = () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onUpdate(formData);
    setIsEditing(false);
    alert('Plantation details updated!');
  };

  const handleToggleDisable = () => {
    const confirmation = window.confirm(
      `Are you sure you want to ${formData.isDisabled ? 'enable' : 'disable'} ${formData.name}?`
    );
    if (confirmation) {
      const updatedPlantation = { ...formData, isDisabled: !formData.isDisabled };
      setFormData(updatedPlantation);
      onUpdate(updatedPlantation);
      alert(`${formData.name} has been ${updatedPlantation.isDisabled ? 'disabled' : 'enabled'}.`);
    }
  };

  const handleGenerateAndSetNewCredentials = () => {
    const confirmation = window.confirm('Are you sure you want to generate NEW credentials? This will overwrite existing ones.');
    if (confirmation) {
      onGenerateNewCredentials(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1B4332] mb-2">
            {isEditing ? 'Edit Plantation Details' : 'Plantation Details'}
          </h2>
          <p className="text-gray-600">#{plantation.id} - {plantation.name}</p>
        </div>

        <form className="space-y-4">
          {/* General Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Plantation Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Owner Name</label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.owner ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.owner && <p className="text-red-500 text-xs mt-1">{errors.owner}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Business Reg. No.</label>
              <input
                type="text"
                name="businessReg"
                value={formData.businessReg}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.businessReg ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.businessReg && <p className="text-red-500 text-xs mt-1">{errors.businessReg}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Registered Year</label>
              <input
                type="number"
                name="registeredYear"
                value={formData.registeredYear}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.registeredYear ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.registeredYear && <p className="text-red-500 text-xs mt-1">{errors.registeredYear}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              readOnly={!isEditing}
              className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Telephone</label>
              <input
                type="text"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.telephone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Admin Credentials */}
          <h3 className="text-xl font-bold mt-6 mb-2 text-[#1B4332]">Admin Credentials</h3>
          {formData.passwordChanged ? (
            // After password changed - show locked state
            <div className="p-4 bg-red-50 border border-red-300 rounded-md">
              <p className="text-sm text-red-800 font-semibold">⚠️ Credentials Locked</p>
              <p className="text-xs text-red-700 mt-2">
                The plantation administrator has changed their password. Credentials cannot be modified or viewed anymore.
              </p>
            </div>
          ) : (
            // Before password changed - show editable credentials
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    name="adminUsername"
                    value={formData.adminUsername}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.adminUsername ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.adminUsername && <p className="text-red-500 text-xs mt-1">{errors.adminUsername}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold mb-1">Password</label>
                  <div className="flex gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="adminPassword"
                      value={formData.adminPassword || ''}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={`flex-1 px-3 py-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'} ${errors.adminPassword ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-xs font-semibold"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                  {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>}
                </div>
              </div>
              {!isEditing && !formData.passwordChanged && (
                <button
                  type="button"
                  onClick={() => {
                    const credentials = `Username: ${formData.adminUsername}\nPassword: ${formData.adminPassword}`;
                    navigator.clipboard.writeText(credentials);
                    alert('Credentials copied to clipboard!');
                  }}
                  className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Copy Credentials
                </button>
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={handleGenerateAndSetNewCredentials}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Generate New Credentials
                </button>
              )}
            </>
          )}

          {/* Disable/Enable Toggle */}
          <div className="mt-6 flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <label htmlFor="isDisabled" className="flex items-center space-x-2 cursor-pointer">
              <span className="text-lg font-semibold text-[#1B4332]">
                {formData.isDisabled ? 'Plantation Disabled' : 'Plantation Active'}
              </span>
              <span className="text-sm text-gray-600">
                (Won't appear on public pages if disabled)
              </span>
            </label>
            <button
              type="button"
              onClick={handleToggleDisable}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                ${formData.isDisabled ? 'bg-red-600' : 'bg-green-600'}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${formData.isDisabled ? 'translate-x-5' : 'translate-x-0'}`}
              ></span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-[#2D6A4F] text-white rounded-md hover:bg-[#1B4332] transition"
              >
                Edit Details
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(plantation); // Revert changes
                    setErrors({});
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

