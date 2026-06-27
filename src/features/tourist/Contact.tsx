import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { contactApi } from '../../services/api';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { validateEmail } from '../../utils/validators';

const SUBJECTS = [
  'Booking Enquiry',
  'Plantation Registration',
  'Payment Issue',
  'Technical Support',
  'Partnership Opportunity',
  'Other',
];

export default function Contact() {
  const [form, setForm]         = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [serverError, setServerError] = useState('');

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = 'Your name is required.';
    if (!form.email.trim())   e.email   = 'Your email is required.';
    else if (!validateEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.subject)        e.subject = 'Please select a subject.';
    if (!form.message.trim()) e.message = 'Please write your message.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      await contactApi.submit(form);
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = (err?: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788] transition ${
      err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
    }`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7F5] font-sans">
        <Navbar />
        <div className="flex items-center justify-center py-32 px-4">
          <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B4332] mb-3">Message Sent!</h2>
            <p className="text-gray-500 mb-2">Thank you for reaching out, <strong>{form.name}</strong>.</p>
            <p className="text-gray-500 text-sm mb-8">
              Our team will review your message and get back to you at <strong>{form.email}</strong> as soon as possible.
            </p>
            <button
              onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setSubmitted(false); }}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-semibold py-3 px-8 rounded-xl transition"
            >
              Send Another Message
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F5] font-sans text-[#1B4332]">
      <Navbar />

      <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white py-16 px-6 text-center">
        <p className="text-green-300 text-sm font-semibold uppercase tracking-widest mb-3">Get in Touch</p>
        <h1 className="text-4xl font-bold font-serif mb-4">Contact Camellia Platform Team</h1>
        <p className="text-green-100 text-lg max-w-xl mx-auto">
          Have a question, need support, or want to partner with us? We're here to help.
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-10">

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">How can we help?</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Whether you're a visitor planning a tea experience, a plantation owner looking to join the platform,
                or you have a general enquiry — our team is ready to assist.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <Mail size={18} />, label: 'Email', value: 'camelliaceylonplatform@gmail.com' },
                { icon: <Phone size={18} />, label: 'Phone', value: '+94 (0) 11 234 5678' },
                { icon: <MapPin size={18} />, label: 'Address', value: 'Camellia Platform, Colombo, Sri Lanka' },
                { icon: <Clock size={18} />, label: 'Support Hours', value: 'Mon – Fri, 9 AM – 6 PM (IST)' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="w-10 h-10 bg-[#D8F3DC] rounded-xl flex items-center justify-center text-[#2D6A4F] shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                    <p className="text-sm font-semibold text-[#1B4332]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1B4332] text-white rounded-2xl p-6">
              <p className="font-bold mb-2">Want to list your plantation?</p>
              <p className="text-green-200 text-sm mb-4">
                Join hundreds of tea plantation owners showcasing their estates on Camellia.
              </p>
              <a
                href="/plantation-request"
                className="inline-block bg-white text-[#1B4332] font-semibold text-sm py-2.5 px-5 rounded-xl hover:bg-green-50 transition"
              >
                Register Your Plantation →
              </a>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold mb-6">Send Us a Message</h2>

              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="e.g. Kasun Perera"
                      className={inp(errors.name)}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="you@example.com"
                      className={inp(errors.email)}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Subject <span className="text-red-500">*</span></label>
                  <select
                    value={form.subject}
                    onChange={e => set('subject', e.target.value)}
                    className={inp(errors.subject)}
                  >
                    <option value="">Select a subject…</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Message <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    placeholder="Tell us how we can help you…"
                    rows={5}
                    className={inp(errors.message) + ' resize-none'}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition text-sm"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <><Send size={15} /> Send Message</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
