import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi, contactApi } from '../../services/api';
import {
  Eye, Mail, CheckCircle, BarChart2, LogOut, LayoutDashboard, Clock, Menu, X,
} from 'lucide-react';
import PlantationDetailModal from './PlantationDetailModal';

export interface Plantation {
  image: string;
  description: ReactNode;
  id: string;
  name: string;
  owner: string;
  businessReg: string;
  adminUsername: string;
  adminPassword: string;
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
}

export default function SuperAdminDashboard() {
  const navigate  = useNavigate();
  const { user, logOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'plantations' | 'requests' | 'subscriptions' | 'contactRequests'>('plantations');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [selectedPlantation, setSelectedPlantation] = useState<Plantation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [contactRequests, setContactRequests]     = useState<ContactRequest[]>([]);
  const [resolvingId, setResolvingId]             = useState<string | null>(null);
  const [resolveNote, setResolveNote]             = useState('');
  const [resolveLoading, setResolveLoading]       = useState(false);

  const [subscriptions, setSubscriptions]   = useState<any[]>([]);
  const [earnings, setEarnings]             = useState<any>(null);

  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);

  const [rejectingId, setRejectingId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

  const dedupById = <T extends { id: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();
    return arr.filter(x => seen.has(x.id) ? false : (seen.add(x.id), true));
  };

  const fetchPlantations = async () => {
    try {
      const res = await adminApi.getAllPlantations();
      const fetched: Plantation[] = (res.data?.data || []).map((item: any) => ({
        id:              String(item.id || ''),
        name:            item.name || 'Unnamed Plantation',
        owner:           item.owner_name || item.owner || '',
        businessReg:     item.business_registration || item.business_reg || '',
        adminUsername:   item.admin_username || '',
        adminPassword:   item.admin_password || '',
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
      setPlantations(dedupById(fetched));
    } catch {
      setPlantations([]);
    }
  };

  const fetchPendingRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await adminApi.getPendingRequests();
      setPendingRequests(dedupById(res.data.requests || []));
    } catch (err: any) {
      console.error('[Dashboard] fetchPendingRequests failed:', err?.response?.status, err?.response?.data || err?.message);
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const [subRes, earnRes] = await Promise.all([
        adminApi.getSubscriptions(),
        adminApi.getSubscriptionEarnings(),
      ]);
      setSubscriptions(dedupById(subRes.data?.data || []));
      setEarnings(earnRes.data || null);
    } catch { setSubscriptions([]); }
  };

  useEffect(() => {
    if (!user || user.role !== 'superadmin') {
      navigate('/');
      return;
    }
    void fetchPlantations();
    void fetchPendingRequests();
    void fetchSubscriptions();
    void fetchContactRequests();
  }, [user, navigate]);

  const fetchContactRequests = async () => {
    try {
      const res = await contactApi.getAll();
      setContactRequests(dedupById(res.data?.data || []));
    } catch { setContactRequests([]); }
  };

  const handleResolve = async () => {
    if (!resolvingId) return;
    setResolveLoading(true);
    try {
      await contactApi.resolve(resolvingId, resolveNote);
      setContactRequests(prev => prev.map(r => r.id === resolvingId ? { ...r, status: 'resolved' } : r));
      setResolvingId(null);
      setResolveNote('');
    } catch (err: any) {
      alert(`Failed: ${err?.response?.data?.error || err.message}`);
    } finally {
      setResolveLoading(false);
    }
  };

  const handleViewDetails = (p: Plantation) => {
    setSelectedPlantation(p);
    setIsModalOpen(true);
  };

  const handleUpdatePlantation = (updated: Plantation) => {
    setPlantations(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPlantation(updated);
  };

  const handleApprove = async (requestId: string) => {
    setApprovingIds(prev => new Set(prev).add(requestId));
    try {
      const res = await adminApi.approvePlantationRequest(requestId);
      const { plantation } = res.data.data;
      setApprovalResult({
        plantationName: plantation.name,
        email:          plantation.email,
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

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Access denied.</p>
      </div>
    );
  }

  const NAV_TABS = [
    { key: 'plantations',     icon: <BarChart2 size={18} />, label: 'Plantations',      badge: null as number | null },
    { key: 'requests',        icon: <Clock size={18} />,     label: 'Pending Requests', badge: pendingRequests.length || null },
    { key: 'subscriptions',   icon: <BarChart2 size={18} />, label: 'Subscriptions',    badge: null as number | null },
    { key: 'contactRequests', icon: <Mail size={18} />,      label: 'Contact Requests', badge: contactRequests.filter(r => r.status === 'pending').length || null },
  ];

  const SidebarNav = ({ onSelect }: { onSelect?: () => void }) => (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); onSelect?.(); }}
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
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 font-sans text-[#1B4332]">

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between bg-[#1B4332] text-white px-4 py-3 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-green-300" />
          <span className="font-bold font-serif text-base">Super Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(v => !v)} className="p-2 rounded-lg hover:bg-[#2D6A4F] transition">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div className="w-64 bg-[#1B4332] text-white flex flex-col pt-16 shadow-2xl">
            <SidebarNav onSelect={() => setMobileMenuOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#1B4332] text-white min-h-screen sticky top-0 shadow-xl z-20">
        <div className="p-6 border-b border-[#2D6A4F]">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-green-300" />
            <h1 className="text-xl font-bold font-serif">Super Admin</h1>
          </div>
          <p className="text-green-300 text-xs mt-1 pl-10">Camellia Platform</p>
        </div>
        <SidebarNav />
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-6">

          <header className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#1B4332] font-serif">
                {activeTab === 'plantations'    && 'Plantations Overview'}
                {activeTab === 'requests'        && 'Pending Plantation Requests'}
                {activeTab === 'subscriptions'   && 'Subscriptions & Earnings'}
                {activeTab === 'contactRequests' && 'Contact Requests'}
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">Camellia Platform Management</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-green-800">System Active</span>
            </div>
          </header>

          {activeTab === 'plantations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(p)}
                              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                              <Eye size={14} /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    <div className="flex gap-5 p-6 pb-4">
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

          {activeTab === 'subscriptions' && (() => {
            const totalEarnings = earnings?.overall?.total_earnings ? Number(earnings.overall.total_earnings) : 0;
            const totalSubs     = earnings?.overall?.total_subscriptions ? Number(earnings.overall.total_subscriptions) : 0;
            const fmtD = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
            const statusBadge = (sub: any) => {
              const today = new Date(); today.setHours(0,0,0,0);
              const end   = new Date(sub.end_date); end.setHours(0,0,0,0);
              const days  = Math.round((end.getTime() - today.getTime()) / 86400000);
              if (sub.status === 'expired' || days < 0) return { label: 'Expired', cls: 'bg-red-100 text-red-700' };
              if (days <= 7)  return { label: `Expires in ${days}d`, cls: 'bg-red-100 text-red-700' };
              if (days <= 30) return { label: `Expires in ${days}d`, cls: 'bg-amber-100 text-amber-700' };
              return { label: 'Active', cls: 'bg-green-100 text-green-700' };
            };
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white rounded-xl p-5">
                    <p className="text-green-200 text-xs font-semibold uppercase tracking-wide mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold">Rs {totalEarnings.toLocaleString()}</p>
                    <p className="text-green-300 text-xs mt-1">{totalSubs} subscription{totalSubs !== 1 ? 's' : ''}</p>
                  </div>
                  {(earnings?.byType || []).map((t: any) => (
                    <div key={t.subscription_type} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
                        {t.subscription_type === 'pro' ? 'Pro Pack' : 'Starter Pack'}
                      </p>
                      <p className="text-2xl font-bold text-[#1B4332]">Rs {Number(t.total).toLocaleString()}</p>
                      <p className="text-gray-400 text-xs mt-1">{t.count} subscription{t.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Plantation', 'Plan', 'Amount', 'Start Date', 'Due Date', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {subscriptions.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No subscriptions yet</td></tr>
                      )}
                      {subscriptions.map((sub: any) => {
                        const badge = statusBadge(sub);
                        return (
                          <tr key={sub.id}>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-sm text-[#1B4332]">{sub.plantation_name}</p>
                              <p className="text-xs text-gray-400">{sub.owner_name}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sub.subscription_type === 'pro' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {sub.subscription_type === 'pro' ? '⭐ Pro' : 'Starter'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-[#1B4332]">Rs {Number(sub.amount).toLocaleString()}</td>
                            <td className="px-4 py-4 text-sm text-gray-600">{fmtD(sub.start_date)}</td>
                            <td className="px-4 py-4 text-sm font-semibold text-gray-700">{fmtD(sub.end_date)}</td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {activeTab === 'contactRequests' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total', value: contactRequests.length, cls: 'bg-blue-50 text-blue-800' },
                  { label: 'Pending', value: contactRequests.filter(r => r.status === 'pending').length, cls: 'bg-amber-50 text-amber-800' },
                  { label: 'Resolved', value: contactRequests.filter(r => r.status === 'resolved').length, cls: 'bg-green-50 text-green-800' },
                ].map(s => (
                  <div key={s.label} className={`${s.cls} rounded-xl p-4 text-center`}>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs font-semibold mt-0.5 opacity-70">{s.label}</p>
                  </div>
                ))}
              </div>

              {contactRequests.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-20 text-center text-gray-400">
                  <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No contact requests yet</p>
                </div>
              )}

              {contactRequests.map(r => (
                <div key={r.id} className={`bg-white rounded-xl border shadow-sm p-5 ${r.status === 'resolved' ? 'border-gray-100 opacity-70' : 'border-amber-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#D8F3DC] flex items-center justify-center text-[#2D6A4F] font-bold shrink-0">
                        {(r.name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#1B4332]">{r.name}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {r.status === 'resolved' ? '✓ Resolved' : 'Pending'}
                          </span>
                          {(r as any).subject && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{(r as any).subject}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{r.email} · {new Date((r as any).created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.message}</p>
                        {(r as any).resolved_message && (
                          <div className="mt-3 bg-green-50 border-l-4 border-green-400 rounded-r-xl px-3 py-2">
                            <p className="text-xs text-green-700 font-semibold mb-0.5">Response sent</p>
                            <p className="text-xs text-green-600">{(r as any).resolved_message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {r.status === 'pending' && (
                      <button
                        onClick={() => { setResolvingId(r.id); setResolveNote(''); }}
                        className="shrink-0 text-sm px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F] transition font-semibold"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {selectedPlantation && (
        <PlantationDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plantation={selectedPlantation}
          onUpdate={handleUpdatePlantation}
        />
      )}

      {approvalResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1B4332]">Request Approved!</h3>
              <p className="text-gray-500 text-sm mt-1">
                <strong>{approvalResult.plantationName}</strong> will go live after subscription payment.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
              <Mail size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                A <strong>subscription payment link</strong> has been emailed to <strong>{approvalResult.email}</strong>.
                Login credentials will be sent automatically after payment is completed.
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

      {resolvingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-[#1B4332] mb-2">Resolve Contact Request</h3>
            <p className="text-gray-500 text-sm mb-5">Optionally add a note about how this was resolved.</p>
            <textarea
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              rows={3}
              placeholder="e.g. Replied via email with booking instructions…"
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788] resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setResolvingId(null)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolveLoading}
                className="flex-1 py-2.5 rounded-2xl bg-[#1B4332] text-white font-semibold hover:bg-[#2D6A4F] transition disabled:opacity-60"
              >
                {resolveLoading ? 'Saving…' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

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

function Detail({ label, value, span }: { label: string; value: string; span?: number }) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-700 truncate">{value || '—'}</p>
    </div>
  );
}
