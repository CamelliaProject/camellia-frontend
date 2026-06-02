import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { validateEmail, validatePhone } from '../../utils/validators';

// ── Constants ───────────────────────────────────────────────────────────────

const STEPS = ['Plantation Info', 'Business Info', 'Documents', 'Subscription'];

const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter Pack',
    price: 'LKR 24,000',
    period: '/year',
    note: 'LKR 2,000 / month',
    bookings: 'Up to 1,000 bookings per year',
    features: [
      'Up to 1,000 bookings per year',
      'Standard listing on platform',
      'Basic analytics dashboard',
      'Email support (24–48 h response)',
    ],
    highlight: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro Pack',
    price: 'LKR 60,000',
    period: '/year',
    note: 'LKR 5,000 / month',
    bookings: 'Unlimited bookings per year',
    features: [
      'Unlimited bookings per year',
      'Featured & priority placement',
      'Advanced analytics & reports',
      'Priority support (same-day response)',
      'Access to promotional campaigns',
    ],
    highlight: true,
  },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function PlantationRequestPage() {
  const [showForm, setShowForm]       = useState(false);
  const [step, setStep]               = useState(0);
  const [submitted, setSubmitted]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors]           = useState<Record<string, string>>({});

  // Step 1 – Plantation Info
  const [plantationName, setPlantationName] = useState('');
  const [ownerName, setOwnerName]           = useState('');
  const [address, setAddress]               = useState('');
  const [description, setDescription]       = useState('');
  const [plantationImage, setPlantationImage]         = useState<File | null>(null);
  const [plantationImagePreview, setPlantationImagePreview] = useState('');

  // Step 2 – Business Info
  const [businessReg, setBusinessReg] = useState('');
  const [email, setEmail]             = useState('');
  const [telephone, setTelephone]     = useState('');

  // Step 3 – Documents
  const [proofDocument, setProofDocument]   = useState<File | null>(null);
  const [proofDocumentName, setProofDocumentName] = useState('');

  // Step 4 – Subscription
  const [subscriptionType, setSubscriptionType] = useState<'starter' | 'pro'>('pro');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef   = useRef<HTMLInputElement>(null);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate() {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!plantationName.trim()) e.plantationName = 'Plantation name is required.';
      if (!ownerName.trim())      e.ownerName      = 'Owner name is required.';
      if (!address.trim())        e.address        = 'Address is required.';
      if (!description.trim())    e.description    = 'Description is required.';
    }
    if (step === 1) {
      if (!businessReg.trim()) e.businessReg = 'Business registration number is required.';
      if (!email.trim())       e.email       = 'Email address is required.';
      else if (!validateEmail(email)) e.email = 'Enter a valid email address.';
      if (!telephone.trim())   e.telephone   = 'Telephone number is required.';
      else if (!validatePhone(telephone)) e.telephone = 'Enter a valid telephone number.';
    }
    if (step === 2) {
      if (!proofDocument) e.proofDocument = 'Proof document is required.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function clearError(field: string) {
    setErrors(prev => { const copy = { ...prev }; delete copy[field]; return copy; });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function handleNext() {
    if (validate()) setStep(s => s + 1);
  }
  function handleBack() {
    setErrors({});
    setStep(s => s - 1);
  }

  // ── File Handlers ─────────────────────────────────────────────────────────

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPlantationImage(file);
    setPlantationImagePreview(URL.createObjectURL(file));
    clearError('plantationImage');
  }

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofDocument(file);
    setProofDocumentName(file.name);
    clearError('proofDocument');
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setServerError('');
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name',             plantationName.trim());
      fd.append('ownerName',        ownerName.trim());
      fd.append('address',          address.trim());
      fd.append('description',      description.trim());
      fd.append('businessReg',      businessReg.trim());
      fd.append('email',            email.trim());
      fd.append('telephone',        telephone.trim());
      fd.append('subscriptionType', subscriptionType);
      if (plantationImage) fd.append('plantationImage', plantationImage);
      if (proofDocument)   fd.append('proofDocument',   proofDocument);

      await apiClient.post('/plantation-requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success Screen ────────────────────────────────────────────────────────

  // ── Pricing page (shown before the form) ─────────────────────────────────
  if (!showForm) {
    return (
      <div className="min-h-screen bg-[#F5F7F5]">
        <div className="bg-[#1B4332] px-6 py-4 flex items-center justify-between">
          <span className="text-white text-xl font-bold font-serif">Camellia</span>
          <Link to="/" className="text-green-200 text-sm hover:text-white transition">← Back to Home</Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-14">
          <div className="text-center mb-12">
            <span className="inline-block bg-[#D8F3DC] text-[#1B4332] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
              Plantation Subscription Plans
            </span>
            <h1 className="text-4xl font-bold text-[#1B4332] mb-4">Join the Camellia Platform</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Choose a plan that fits your plantation. No commission — just a simple annual subscription fee.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl shadow-lg border-2 p-8 flex flex-col ${
                  plan.highlight ? 'border-[#1B4332]' : 'border-gray-100'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1B4332] text-white text-xs font-bold px-5 py-1.5 rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#1B4332] mb-1">{plan.name}</h2>
                  <p className="text-sm text-gray-500">{plan.bookings}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#1B4332]">{plan.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{plan.period}</span>
                  <p className="text-sm text-gray-400 mt-1">{plan.note}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#52B788] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => { setSubscriptionType(plan.id); setShowForm(true); }}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${
                    plan.highlight
                      ? 'bg-[#1B4332] hover:bg-[#2D6A4F] text-white'
                      : 'border-2 border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white'
                  }`}
                >
                  Get Started with {plan.name} →
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-6 text-center">
            <p className="text-sm text-gray-500">
              No hidden fees · No commission on bookings · Cancel anytime ·
              <span className="text-[#1B4332] font-semibold"> Payment collected after approval</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-3">Registration Submitted!</h2>
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 mb-6 text-left">
            <p className="text-green-800 text-sm leading-relaxed">
              Your plantation registration is under review. Please wait up to 24 hours for approval.
              If not contacted within 24 hours, please contact support.
            </p>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            A confirmation email has been sent to <strong>{email}</strong>.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-[#1B4332] text-white rounded-2xl font-semibold hover:bg-[#2D6A4F] transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F5F7F5]">
      {/* Top bar */}
      <div className="bg-[#1B4332] px-6 py-4 flex items-center justify-between">
        <span className="text-white text-xl font-bold font-serif">Camellia</span>
        <Link to="/" className="text-green-200 text-sm hover:text-white transition">
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B4332]">Register Your Plantation</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Join the Camellia platform and showcase your tea estate to the world.
          </p>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center mb-10">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    i < step
                      ? 'bg-[#1B4332] text-white'
                      : i === step
                      ? 'bg-[#1B4332] text-white ring-4 ring-[#1B4332]/20'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-[#1B4332]' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded ${i < step ? 'bg-[#1B4332]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">

          {/* ── Step 0: Plantation Info ─────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <SectionTitle icon="🌿" title="Plantation Information" />

              <Field label="Plantation Name" required error={errors.plantationName}>
                <input
                  type="text"
                  value={plantationName}
                  onChange={e => { setPlantationName(e.target.value); clearError('plantationName'); }}
                  placeholder="e.g. Pedro Tea Estate"
                  className={input(errors.plantationName)}
                />
              </Field>

              <Field label="Plantation Owner Name" required error={errors.ownerName}>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => { setOwnerName(e.target.value); clearError('ownerName'); }}
                  placeholder="e.g. Rajesh Perera"
                  className={input(errors.ownerName)}
                />
              </Field>

              <Field label="Plantation Address" required error={errors.address}>
                <input
                  type="text"
                  value={address}
                  onChange={e => { setAddress(e.target.value); clearError('address'); }}
                  placeholder="e.g. Pedro Tea Estate, Nuwara Eliya"
                  className={input(errors.address)}
                />
              </Field>

              <Field label="Plantation Description" required error={errors.description}>
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); clearError('description'); }}
                  placeholder="Tell visitors about your plantation — its history, tea varieties, and what makes it special..."
                  rows={4}
                  className={input(errors.description)}
                />
              </Field>

              {/* Plantation image upload */}
              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Plantation Photo <span className="text-gray-400 font-normal">(optional — JPG, PNG)</span>
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {plantationImagePreview ? (
                  <div className="relative">
                    <img
                      src={plantationImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => { setPlantationImage(null); setPlantationImagePreview(''); }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-500 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-[#2D6A4F] transition group"
                  >
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-sm text-gray-500 group-hover:text-[#1B4332]">Click to upload plantation photo</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP · Max 10 MB</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Business Info ───────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <SectionTitle icon="🏢" title="Business Information" />

              <Field label="Business Registration Number" required error={errors.businessReg}>
                <input
                  type="text"
                  value={businessReg}
                  onChange={e => { setBusinessReg(e.target.value); clearError('businessReg'); }}
                  placeholder="e.g. PV 00123456"
                  className={input(errors.businessReg)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  As registered with the Registrar of Companies, Sri Lanka
                </p>
              </Field>

              <Field label="Contact Email Address" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError('email'); }}
                  placeholder="e.g. info@pedroestate.lk"
                  className={input(errors.email)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Your login credentials will be sent to this email after approval
                </p>
              </Field>

              <Field label="Telephone Number" required error={errors.telephone}>
                <input
                  type="tel"
                  value={telephone}
                  onChange={e => { setTelephone(e.target.value); clearError('telephone'); }}
                  placeholder="e.g. +94 52 222 3456"
                  className={input(errors.telephone)}
                />
              </Field>
            </div>
          )}

          {/* ── Step 2: Documents ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle icon="📄" title="Verification Documents" />

              <p className="text-sm text-gray-500">
                Upload your business registration certificate to verify your plantation.
                We accept the original registration document issued by the Registrar of Companies, Sri Lanka.
              </p>

              <div>
                <label className="block text-sm font-semibold text-[#1B4332] mb-2">
                  Business Registration Document <span className="text-red-500">*</span>
                </label>
                <input
                  ref={docInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleDocChange}
                  className="hidden"
                />
                {proofDocumentName ? (
                  <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800 truncate">{proofDocumentName}</p>
                      <p className="text-xs text-green-600">Uploaded successfully</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setProofDocument(null); setProofDocumentName(''); }}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-2xl p-8 text-center hover:border-[#2D6A4F] transition group ${
                      errors.proofDocument ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="text-4xl mb-3">📎</div>
                    <p className="text-sm font-medium text-gray-600 group-hover:text-[#1B4332]">
                      Click to upload your business registration document
                    </p>
                    <p className="text-xs text-gray-400 mt-2">PDF, JPG or PNG · Max 10 MB</p>
                  </button>
                )}
                {errors.proofDocument && (
                  <p className="text-red-500 text-xs mt-1">{errors.proofDocument}</p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Accepted documents:</strong> Certificate of Incorporation, Business Registration Certificate,
                  or any official company registration document issued by the Registrar of Companies, Sri Lanka.
                  If your plantation operates under an individual proprietorship, a personal ID + business licence is acceptable.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Subscription ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle icon="⭐" title="Choose Your Subscription" />
              <p className="text-sm text-gray-500">
                Select a plan that fits your plantation. You can upgrade at any time after approval.
              </p>

              <div className="grid gap-4">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSubscriptionType(plan.id)}
                    className={`w-full text-left rounded-2xl border-2 p-6 transition-all relative ${
                      subscriptionType === plan.id
                        ? 'border-[#1B4332] bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 right-6 bg-[#1B4332] text-white text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          subscriptionType === plan.id ? 'border-[#1B4332] bg-[#1B4332]' : 'border-gray-300'
                        }`}>
                          {subscriptionType === plan.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#1B4332] text-base">{plan.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{plan.bookings}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-[#1B4332]">{plan.price}</p>
                        <p className="text-xs text-gray-400">{plan.period} · {plan.note}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <ul className="space-y-2">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>

              {/* Summary before submit */}
              <div className="bg-gray-50 rounded-2xl p-5 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registration Summary</p>
                <div className="space-y-1.5 text-sm">
                  <SummaryRow label="Plantation" value={plantationName} />
                  <SummaryRow label="Owner" value={ownerName} />
                  <SummaryRow label="Email" value={email} />
                  <SummaryRow label="Plan" value={PLANS.find(p => p.id === subscriptionType)?.name ?? ''} />
                </div>
              </div>

              {serverError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-600 text-sm">{serverError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 rounded-2xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                ← Back
              </button>
            ) : (
              <Link
                to="/"
                className="px-6 py-2.5 rounded-2xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-2.5 rounded-2xl bg-[#1B4332] text-white font-semibold hover:bg-[#2D6A4F] transition"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-2xl bg-[#1B4332] text-white font-semibold hover:bg-[#2D6A4F] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting…
                  </>
                ) : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <h2 className="text-xl font-bold text-[#1B4332]">{title}</h2>
    </div>
  );
}

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1B4332] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-[#1B4332] text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function input(error?: string) {
  return `w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-gray-800 transition resize-none ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;
}
