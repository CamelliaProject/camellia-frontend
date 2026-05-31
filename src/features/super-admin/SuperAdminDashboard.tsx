import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import apiClient from '../../services/apiClient';
import {
  Eye, Mail, CheckCircle, BarChart2, LogOut, LayoutDashboard, Clock,
} from 'lucide-react';
import PlantationDetailModal from './PlantationDetailModal';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Plantation {
  image: string;
  description: ReactNode;
  id: string;
  name: string;
  owner: string;
  businessReg: string;
  adminUsername: string;
  passwordChanged: boolean;
  address: string;
  telephone: string;
  email: string;
  isDisabled: boolean;
  isPublished: boolean;
  registeredYear: number;
}

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
}

interface ApprovalResult {
  plantationName: string;
  email: string;
  username: string;
  password: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const navigate  = useNavigate();
  const { user, logOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'plantations' | 'requests' | 'contactRequests'>('plantations');

  // Plantations
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedPlantation, setSelectedPlantation] = useState<Plantation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pending requests
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Contact requests (local only for now)
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);

  // Approval credentials modal
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);

  // Rejection modal
  const [rejectingId, setRejectingId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Approve in-progress set (to disable button while calling API)
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  // ── Data fetchers ─────────────────────────────────────────────────────────

  const fetchPlantations = async () => {
    try {
      const res = await adminApi.getAllPlantations();
      const fetched: Plantation[] = (res.data?.data || []).map((item: any) => ({
        id:              String(item.id || ''),
        name:            item.name || 'Unnamed Plantation',
        owner:           item.owner || 'Unknown',
        businessReg:     item.business_reg || item.businessReg || '',
        adminUsername:   item.admin_username || '',
        passwordChanged: Boolean(item.password_changed),
        address:         item.address || '',
        telephone:       item.telephone || item.phone || '',
        email:           item.email || '',
        isDisabled:      Boolean(item.is_disabled),
        isPublished:     Boolean(item.is_published),
        registeredYear:  item.registered_year || new Date(item.created_at).getFullYear(),
        image:           item.main_image_url || item.image || '',
        description:     item.description || '',
      }));
      setPlantations(fetched);
    } catch {
      setPlantations([]);
    }
  };

  const fetchPendingRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await adminApi.getPendingRequests();
      setPendingRequests(res.data.requests || []);
    } catch (err: any) {
      console.error('[Dashboard] fetchPendingRequests failed:', err?.response?.status, err?.response?.data || err?.message);
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'superadmin') {
      navigate('/');
      return;
    }
    void fetchPlantations();
    void fetchPendingRequests();
  }, [user, navigate]);

  // ── Plantation management ─────────────────────────────────────────────────

  const handleViewDetails = (p: Plantation) => {
    setSelectedPlantation(p);
    setIsModalOpen(true);
  };

  const handleUpdatePlantation = (updated: Plantation) => {
    setPlantations(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPlantation(updated);
  };


  // ── Approve / Reject ──────────────────────────────────────────────────────

  const handleApprove = async (requestId: string) => {
    setApprovingIds(prev => new Set(prev).add(requestId));
    try {
      const res = await adminApi.approvePlantationRequest(requestId);
      const { plantation, adminUser } = res.data.data;
      setApprovalResult({
        plantationName: plantation.name,
        email:          plantation.email,
        username:       adminUser.username,
        password:       adminUser.plainPassword,
      });
      void fetchPendingRequests();
      void fetchPlantations();
    } catch (err: any) {
      alert(`Approval failed: ${err?.response?.data?.error || err.message}`);
    } finally {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(requestId); return s; });
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    setRejectLoading(true);
    try {
      await adminApi.rejectPlantationRequest(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      void fetchPendingRequests();
    } catch (err: any) {
      alert(`Rejection failed: ${err?.response?.data?.error || err.message}`);
    } finally {
      setRejectLoading(false);
    }
  };

  // ── Chart ─────────────────────────────────────────────────────────────────

  const chartData = (() => {
    const years = plantations.map(p => p.registeredYear);
    const cur   = new Date().getFullYear();
    const min   = Math.min(...years, cur - 2);
    const max   = Math.max(...years, cur);
    return Array.from({ length: max - min + 1 }, (_, i) => {
      const y = min + i;
      return { year: y, count: years.filter(yr => yr === y).length };
    });
  })();

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Access denied.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans text-[#1B4332]">

      {/* Sidebar */}
      <aside className="w-64 bg-[#1B4332] text-white flex flex-col min-h-screen sticky top-0 shadow-xl z-20">
        <div className="p-6 border-b border-[#2D6A4F]">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-green-300" />
            <h1 className="text-xl font-bold font-serif">Super Admin</h1>
          </div>
          <p className="text-green-300 text-xs mt-1 pl-10">Camellia Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { key: 'plantations',    icon: <BarChart2 size={18} />, label: 'Plantations',        badge: null },
            { key: 'requests',       icon: <Clock size={18} />,     label: 'Pending Requests',   badge: pendingRequests.length || null },
            { key: 'contactRequests',icon: <Mail size={18} />,      label: 'Contact Requests',   badge: null },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#2D6A4F] text-white shadow-md border-l-4 border-green-300'
                  : 'text-gray-300 hover:bg-[#2D6A4F]/50 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">{tab.icon}{tab.label}</span>
              {tab.badge ? (
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#2D6A4F]">
          <div className="px-4 py-2 mb-2">
            <p className="text-green-200 text-xs">Signed in as</p>
            <p className="text-white text-sm font-semibold truncate">{user.username || user.name}</p>
          </div>
          <button
            onClick={() => logOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
          >
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <header className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#1B4332] font-serif">
                {activeTab === 'plantations'    && 'Plantations Overview'}
                {activeTab === 'requests'        && 'Pending Plantation Requests'}
                {activeTab === 'contactRequests' && 'Contact Requests'}
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">Camellia Platform Management</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-800">System Active</span>
            </div>
          </header>

          {/* ── Plantations tab ───────────────────────────────────────────── */}
          {activeTab === 'plantations' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Plantations', value: plantations.length },
                  { label: 'Active',             value: plantations.filter(p => p.isPublished && !p.isDisabled).length },
                  { label: 'Pending Setup',      value: plantations.filter(p => !p.isPublished).length },
                  { label: 'Pending Requests',   value: pendingRequests.length },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
                    <p className="text-3xl font-bold text-[#1B4332]">{s.value}</p>
                    <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold mb-5">Plantations Registered Per Year</h3>
                <div className="flex items-end gap-4 h-40">
                  {chartData.map(d => (
                    <div key={d.year} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-bold text-[#1B4332]">{d.count > 0 ? d.count : ''}</span>
                      <div
                        className="w-full bg-[#2D6A4F] rounded-t-md transition-all"
                        style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count ? 4 : 0 }}
                      />
                      <span className="text-xs text-gray-400">{d.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plantations table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Plantation', 'Owner', 'Admin Username', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {plantations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-gray-400">No plantations yet</td>
                      </tr>
                    )}
                    {plantations.map(p => (
                      <tr key={p.id} className={p.isDisabled ? 'bg-gray-50 text-gray-400' : ''}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                                {p.name[0]}
                              </div>
                            )}
                            <span className="font-medium text-sm">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{p.owner}</td>
                        <td className="px-5 py-4 text-sm font-mono text-gray-600">
                          <span>{p.adminUsername || '—'}</span>
                          {p.passwordChanged && (
                            <span className="ml-2 text-xs text-green-600 font-sans font-medium">✓ Password set</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {p.isDisabled ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Disabled</span>
                          ) : p.isPublished ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Pending Setup</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleViewDetails(p)}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                          >
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Requests tab ──────────────────────────────────────────────── */}
          {activeTab === 'requests' && (
            <div>
              {requestsLoading && (
                <div className="flex justify-center py-16">
                  <svg className="w-8 h-8 animate-spin text-[#2D6A4F]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}

              {!requestsLoading && pendingRequests.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-20 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No pending requests</p>
                  <p className="text-gray-400 text-sm mt-1">New plantation registrations will appear here</p>
                </div>
              )}

              <div className="space-y-5">
                {pendingRequests.map((req: any) => (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Card top — image + heading */}
                    <div className="flex gap-5 p-6 pb-4">
                      {/* Plantation image */}
                      <div className="shrink-0">
                        {req.plantation_image_url ? (
                          <img
                            src={req.plantation_image_url}
                            alt={req.name}
                            className="w-24 h-24 rounded-xl object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                            <span className="text-3xl">🌿</span>
                          </div>
                        )}
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="text-lg font-bold text-[#1B4332]">{req.name}</h3>
                            <p className="text-sm text-gray-500">Owner: {req.owner_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              req.subscription_type === 'pro'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {req.subscription_type === 'pro' ? '⭐ Pro Pack' : 'Starter Pack'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(req.created_at).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {req.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{req.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-6 pb-4">
                      <Detail label="Business Reg" value={req.business_registration} />
                      <Detail label="Email"         value={req.email} />
                      <Detail label="Telephone"     value={req.telephone} />
                      <Detail label="Address"       value={req.address} span={2} />
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Proof Document</p>
                        {req.proof_document_url ? (
                          <a
                            href={req.proof_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#1B4332] font-medium underline underline-offset-2 hover:text-[#2D6A4F] flex items-center gap-1"
                          >
                            View Document
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">No document</span>
                        )}
                      </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={() => { setRejectingId(req.id); setRejectReason(''); }}
                        className="px-5 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={approvingIds.has(req.id)}
                        className="px-5 py-2 rounded-lg bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {approvingIds.has(req.id) ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Approving…
                          </>
                        ) : 'Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Contact Requests tab ──────────────────────────────────────── */}
          {activeTab === 'contactRequests' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Email', 'Subject', 'Message', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contactRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-gray-400">No contact requests</td>
                    </tr>
                  )}
                  {contactRequests.map(r => (
                    <tr key={r.id}>
                      <td className="px-5 py-4 text-sm font-medium">{r.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{r.email}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{r.subject}</td>
                      <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">{r.message}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => setContactRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'resolved' } : x))}
                            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

      {/* ── Plantation detail modal ──────────────────────────────────────── */}
      {selectedPlantation && (
        <PlantationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plantation={selectedPlantation}
          onUpdate={handleUpdatePlantation}
        />
      )}

      {/* ── Approval credentials modal ───────────────────────────────────── */}
      {approvalResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1B4332]">Plantation Approved!</h3>
              <p className="text-gray-500 text-sm mt-1">
                <strong>{approvalResult.plantationName}</strong> is now live on the platform.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 mb-5 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Generated Credentials</p>
              <CredentialRow label="Username" value={approvalResult.username} />
              <CredentialRow label="Password" value={approvalResult.password} secret />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
              <Mail size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Credentials have been emailed to <strong>{approvalResult.email}</strong>
              </p>
            </div>

            <button
              onClick={() => setApprovalResult(null)}
              className="w-full py-3 rounded-2xl bg-[#1B4332] text-white font-semibold hover:bg-[#2D6A4F] transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Rejection reason modal ───────────────────────────────────────── */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-[#1B4332] mb-2">Reject Registration</h3>
            <p className="text-gray-500 text-sm mb-5">
              Provide a reason — it will be included in the rejection email to the applicant.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. The uploaded document is not a valid business registration certificate. Please resubmit with the correct document."
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="flex-1 py-2.5 rounded-2xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectLoading}
                className="flex-1 py-2.5 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
              >
                {rejectLoading ? 'Rejecting…' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Detail({ label, value, span }: { label: string; value: string; span?: number }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-700 truncate">{value || '—'}</p>
    </div>
  );
}

function CredentialRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow]     = useState(!secret);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-mono font-bold text-[#1B4332] truncate">
          {show ? value : '•'.repeat(value.length)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {secret && (
          <button onClick={() => setShow(s => !s)} className="text-gray-400 hover:text-gray-600 p-1">
            {show ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
        <button
          onClick={copy}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
            copied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
