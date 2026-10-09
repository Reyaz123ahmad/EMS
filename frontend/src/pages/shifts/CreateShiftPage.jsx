import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCreateShift } from '../../hooks/useShifts';
import { useBreakRules } from '../../hooks/useBreakRules';
import { useAuthStore } from '../../store/authStore';
import { Clock, ArrowLeft, CheckCircle2, Coffee } from 'lucide-react';
import { toast } from 'sonner';

function calculateHours(start, end, isNight = false) {
  if (!start || !end) return 9;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(eh)) return 9;
  let startMin = sh * 60 + (sm || 0);
  let endMin = eh * 60 + (em || 0);
  if (isNight || endMin <= startMin) endMin += 24 * 60;
  const hrs = (endMin - startMin) / 60;
  return Number.isInteger(hrs) ? hrs : Number(hrs.toFixed(1));
}

export default function CreateShiftPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const createShift = useCreateShift();

  const { data: breakRules = [], isLoading: breakRulesLoading } = useBreakRules({ isActive: true });
  const [selectedBreakRuleIds, setSelectedBreakRuleIds] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    workingHours: 9,
    isNightShift: false,
    isActive: true
  });

  const toggleBreakRule = (ruleId) => {
    setSelectedBreakRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleTimeChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const isNight = Boolean(updated.isNightShift || (updated.endTime && updated.startTime && updated.endTime <= updated.startTime));
    const computed = calculateHours(updated.startTime, updated.endTime, isNight);
    setFormData({
      ...updated,
      isNightShift: isNight,
      workingHours: computed
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a shift name');
      return;
    }

    const isNight = Boolean(formData.isNightShift || (formData.endTime && formData.startTime && formData.endTime <= formData.startTime));
    const computedWorkingHours = Number(formData.workingHours) || calculateHours(formData.startTime, formData.endTime, isNight);

    try {
      await createShift.mutateAsync({
        companyId,
        name: formData.name.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        graceMinutes: Number(formData.graceMinutes) || 15,
        workingHours: computedWorkingHours,
        isNightShift: isNight,
        isActive: Boolean(formData.isActive),
        breakRuleIds: selectedBreakRuleIds
      });
      toast.success('Shift created successfully!');
      navigate('/shifts');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create shift');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/shifts')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shifts
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-400" />
          Create New Shift Policy
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Define standard working hours, grace margins, and night shift flags for your workforce.
        </p>
      </div>

      <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Shift Name *
            </label>
            <Input
              placeholder="e.g. Morning Shift, Evening Support"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Time *
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Time *
              </label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Grace Period (Minutes)
              </label>
              <Input
                type="number"
                min="0"
                max="120"
                value={formData.graceMinutes}
                onChange={(e) => setFormData({ ...formData, graceMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Required Working Hours
              </label>
              <Input
                type="number"
                min="1"
                max="24"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNightShift}
                onChange={(e) => setFormData({ ...formData, isNightShift: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
              />
              Night Shift (Crosses Midnight)
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
              />
              Active Status
            </label>
          </div>

          {/* Break Rules Multi-Select */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              Applied Break Rules
            </label>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Select which company break policies apply to employees on this shift.
            </p>

            {breakRulesLoading ? (
              <div className="text-xs text-slate-500 py-2">Loading break rules...</div>
            ) : breakRules.length === 0 ? (
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-xs text-slate-400">
                No break rules defined yet. Standard default break limits (60m / 3 breaks) will apply.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {breakRules.map((rule) => {
                  const isChecked = selectedBreakRuleIds.includes(rule.id);
                  return (
                    <label
                      key={rule.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition cursor-pointer text-xs ${
                        isChecked
                          ? 'bg-indigo-950/30 border-indigo-700/60 text-white'
                          : 'bg-slate-950/30 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleBreakRule(rule.id)}
                        className="w-4 h-4 mt-0.5 rounded text-indigo-600 bg-slate-950 border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{rule.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {rule.durationMinutes}m • {rule.maxPerShift}x/shift • {rule.isPaid ? 'Paid' : 'Unpaid'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/shifts')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createShift.isPending}
            >
              Create Shift
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
