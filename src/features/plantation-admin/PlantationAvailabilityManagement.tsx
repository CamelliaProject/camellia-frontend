import { useState, useEffect } from 'react';
import { Loader2, Trash2, PlusCircle, CalendarOff, Clock, Users } from 'lucide-react';
import { availabilityApi } from '../../services/api';

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_FULL   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ClosingDate { id: string; close_date: string; reason: string | null; }
interface TimeSlot    { id: string; day_of_week: number; slot_time: string; capacity: number; }

function fmtDate(d: string) {
  const s = String(d).slice(0, 10);
  const [y, mo, day] = s.split('-').map(Number);
  return new Date(y, mo - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmt12h(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function PlantationAvailabilityManagement({ plantationId }: { plantationId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Operating days (true = open)
  const [openDays, setOpenDays] = useState<boolean[]>(Array(7).fill(true));

  // Closing dates
  const [closingDates, setClosingDates] = useState<ClosingDate[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  // Time slots (all days combined)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(1); // default Monday
  const [newTime, setNewTime] = useState('');
  const [newCap, setNewCap] = useState(20);
  const [editCap, setEditCap] = useState<Record<string, number>>({});

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  // Load availability settings
  useEffect(() => {
    const load = async () => {
      try {
        const r = await availabilityApi.getSettings(plantationId);
        const d = r.data?.data;
        if (d) {
          const flags = Array(7).fill(true);
          (d.unavailable_days as number[]).forEach(dow => { flags[dow] = false; });
          setOpenDays(flags);
          setClosingDates(d.closing_dates ?? []);
        }
      } catch { flash('Failed to load availability settings.', false); }
      finally { setLoading(false); }
    };
    void load();
  }, [plantationId]);

  // Load time slots
  useEffect(() => {
    const load = async () => {
      setSlotsLoading(true);
      try {
        const r = await availabilityApi.getTimeSlots(plantationId);
        setTimeSlots(r.data?.data ?? []);
      } catch { flash('Failed to load time slots.', false); }
      finally { setSlotsLoading(false); }
    };
    void load();
  }, [plantationId]);

  const daySlots = timeSlots
    .filter(s => s.day_of_week === activeDay)
    .sort((a, b) => a.slot_time.localeCompare(b.slot_time));

  const slotCountByDay = (dow: number) => timeSlots.filter(s => s.day_of_week === dow).length;

  // ── Operating day toggle ─────────────────────────────────────────────────
  const handleDayToggle = async (dow: number) => {
    const next = [...openDays];
    next[dow] = !next[dow];
    setOpenDays(next);
    setSaving(true);
    try {
      const closedDows = next.map((open, i) => (!open ? i : -1)).filter(i => i >= 0);
      await availabilityApi.updateUnavailableDays(plantationId, closedDows);
      flash(`${DOW_FULL[dow]}s marked as ${next[dow] ? 'open' : 'closed'}.`, true);
    } catch {
      flash('Failed to update operating days.', false);
      setOpenDays(openDays);
    }
    finally { setSaving(false); }
  };

  // ── Closing dates ────────────────────────────────────────────────────────
  const handleAddClosingDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    setSaving(true);
    try {
      const r = await availabilityApi.addClosingDate(plantationId, newDate, newReason || undefined);
      setClosingDates(prev => [...prev, r.data.data].sort((a, b) => a.close_date.localeCompare(b.close_date)));
      setNewDate(''); setNewReason('');
      flash('Closing date added.', true);
    } catch (err: any) { flash(err?.response?.data?.error || 'Failed to add date.', false); }
    finally { setSaving(false); }
  };

  const handleRemoveClosingDate = async (cd: ClosingDate) => {
    if (!window.confirm(`Remove closing date ${fmtDate(cd.close_date)}?`)) return;
    setSaving(true);
    try {
      await availabilityApi.removeClosingDate(plantationId, cd.id);
      setClosingDates(prev => prev.filter(d => d.id !== cd.id));
      flash('Closing date removed.', true);
    } catch { flash('Failed to remove date.', false); }
    finally { setSaving(false); }
  };

  // ── Time slots ───────────────────────────────────────────────────────────
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) return;
    setSaving(true);
    try {
      const r = await availabilityApi.createTimeSlot(plantationId, { day_of_week: activeDay, slot_time: newTime, capacity: newCap });
      const added: TimeSlot = r.data?.data;
      setTimeSlots(prev => {
        const idx = prev.findIndex(s => s.id === added.id);
        return idx >= 0 ? prev.map((s, i) => i === idx ? added : s) : [...prev, added];
      });
      setNewTime('');
      setNewCap(20);
      flash('Time slot added.', true);
    } catch (err: any) { flash(err?.response?.data?.error || 'Failed to add slot.', false); }
    finally { setSaving(false); }
  };

  const handleCapBlur = async (slot: TimeSlot) => {
    const cap = editCap[slot.id];
    if (!cap || cap === slot.capacity) return;
    setSaving(true);
    try {
      const r = await availabilityApi.updateTimeSlot(plantationId, slot.id, { capacity: cap });
      setTimeSlots(prev => prev.map(s => s.id === slot.id ? r.data.data : s));
      setEditCap(prev => { const n = { ...prev }; delete n[slot.id]; return n; });
      flash('Capacity saved.', true);
    } catch (err: any) { flash(err?.response?.data?.error || 'Failed.', false); }
    finally { setSaving(false); }
  };

  const handleDeleteSlot = async (slot: TimeSlot) => {
    if (!window.confirm(`Remove ${fmt12h(slot.slot_time)} from every ${DOW_FULL[slot.day_of_week]}?`)) return;
    setSaving(true);
    try {
      await availabilityApi.deleteTimeSlot(plantationId, slot.id);
      setTimeSlots(prev => prev.filter(s => s.id !== slot.id));
      flash('Slot removed.', true);
    } catch (err: any) { flash(err?.response?.data?.error || 'Failed.', false); }
    finally { setSaving(false); }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 className="animate-spin" size={20} /> Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1B4332] mb-1">Available Date and Time</h2>
        <p className="text-sm text-gray-500">
          Set the days tourists can book, define arrival time slots, and mark specific closed dates.
        </p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Operating days ── */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-[#2D6A4F]" />
          <h3 className="text-lg font-bold text-[#1B4332]">Operating Days</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Toggle the days of the week when the plantation accepts bookings.
        </p>
        <div className="grid grid-cols-7 gap-2">
          {DOW_LABELS.map((label, dow) => {
            const isOpen = openDays[dow];
            return (
              <button
                key={dow}
                type="button"
                disabled={saving}
                onClick={() => handleDayToggle(dow)}
                className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 transition-all font-semibold text-sm
                  ${isOpen
                    ? 'bg-[#f0faf4] border-[#2D6A4F] text-[#1B4332]'
                    : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                  } disabled:opacity-60`}
              >
                <span className="text-xs">{label}</span>
                <span className="text-[10px] mt-1 font-normal">{isOpen ? 'Open' : 'Closed'}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Arrival time slots ── */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-[#2D6A4F]" />
          <h3 className="text-lg font-bold text-[#1B4332]">Arrival Time Slots</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Define available arrival times per day of week. These apply every week.
          Tourists pick one arrival time for their whole visit.
        </p>

        {/* Day tabs */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {DOW_LABELS.map((label, dow) => {
            const count = slotCountByDay(dow);
            return (
              <button
                key={dow}
                type="button"
                onClick={() => setActiveDay(dow)}
                className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition border-2
                  ${activeDay === dow
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#52B788]'
                  }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                    ${activeDay === dow ? 'bg-white/30 text-white' : 'bg-[#52B788] text-white'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Slots for active day */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">
            {DOW_FULL[activeDay]} — repeats every week
          </p>

          {slotsLoading ? (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" /> Loading…
            </p>
          ) : daySlots.length === 0 ? (
            <p className="text-sm text-gray-400 italic mb-3">No time slots for {DOW_FULL[activeDay]}s yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {daySlots.map(slot => (
                <div key={slot.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                  <span className="font-bold text-gray-800 w-24 text-sm">{fmt12h(slot.slot_time)}</span>
                  <div className="flex items-center gap-1.5 text-gray-500 flex-1">
                    <Users size={13} />
                    <input
                      type="number"
                      min={1}
                      value={editCap[slot.id] ?? slot.capacity}
                      onChange={e => setEditCap(p => ({ ...p, [slot.id]: parseInt(e.target.value) || slot.capacity }))}
                      onBlur={() => handleCapBlur(slot)}
                      title="Max guests — click away to save"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#52B788]"
                    />
                    <span className="text-xs text-gray-400">max guests</span>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleDeleteSlot(slot)}
                    className="p-1.5 text-red-400 hover:text-red-600 disabled:opacity-30 transition"
                    title="Remove slot"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add slot form */}
          <form onSubmit={handleAddSlot} className="flex flex-wrap gap-3 items-end border-t border-dashed border-gray-300 pt-4 mt-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time <span className="text-red-500">*</span></label>
              <input
                type="time"
                required
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max guests</label>
              <input
                type="number"
                min={1}
                value={newCap}
                onChange={e => setNewCap(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !newTime}
              className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              Add to {DOW_LABELS[activeDay]}s
            </button>
          </form>
        </div>
      </section>

      {/* ── Specific closing dates ── */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <CalendarOff size={18} className="text-[#2D6A4F]" />
          <h3 className="text-lg font-bold text-[#1B4332]">Closing Dates</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Mark specific dates when the plantation is fully closed — public holidays, maintenance, private events.
        </p>

        {closingDates.length === 0 ? (
          <p className="text-sm text-gray-400 italic mb-5">No specific closing dates added yet.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {closingDates.map(cd => (
              <div key={cd.id} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-red-800">{fmtDate(cd.close_date)}</p>
                  {cd.reason && <p className="text-xs text-red-600 mt-0.5">{cd.reason}</p>}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleRemoveClosingDate(cd)}
                  className="p-1.5 text-red-400 hover:text-red-600 disabled:opacity-40 transition"
                  title="Remove closing date"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddClosingDate} className="flex flex-wrap gap-3 items-end bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              min={today}
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. National Holiday, Maintenance…"
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#52B788]"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newDate}
            className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
            Add Closing Date
          </button>
        </form>
      </section>
    </div>
  );
}
