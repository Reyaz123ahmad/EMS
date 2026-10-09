import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ShiftCard from '../../components/shifts/ShiftCard';
import ShiftAssignmentModal from '../../components/shifts/ShiftAssignmentModal';
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useAssignShift,
} from '../../hooks/useShifts';
import { useBreakRules } from '../../hooks/useBreakRules';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';

export default function ShiftListPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const { data: shiftsData, isLoading, refetch } = useShifts(companyId);
  const { data: breakRules = [], isLoading: breakRulesLoading } = useBreakRules({ isActive: true });

  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const assignShift = useAssignShift();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [assigningShift, setAssigningShift] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedBreakRuleIds, setSelectedBreakRuleIds] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriod: 15,
    halfDayHours: 4,
    fullDayHours: 8,
    breakDuration: 60,
    isNightShift: false,
    description: '',
  });

  const toggleBreakRule = (ruleId) => {
    setSelectedBreakRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleOpenCreate = () => {
    setEditingShift(null);
    setSelectedBreakRuleIds([]);
    setFormData({
      name: '',
      code: '',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriod: 15,
      halfDayHours: 4,
      fullDayHours: 8,
      breakDuration: 60,
      isNightShift: false,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift) => {
    setEditingShift(shift);
    const existingRuleIds = (shift.shiftBreakRules || [])
      .map((sbr) => sbr.breakRuleId || sbr.breakRule?.id)
      .filter(Boolean);
    setSelectedBreakRuleIds(existingRuleIds);

    setFormData({
      name: shift.name,
      code: shift.code,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriod: shift.gracePeriod || 15,
      halfDayHours: shift.halfDayHours || 4,
      fullDayHours: shift.fullDayHours || 8,
      breakDuration: shift.breakDuration || 60,
      isNightShift: shift.isNightShift || false,
      description: shift.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      breakRuleIds: selectedBreakRuleIds,
    };
    if (editingShift) {
      await updateShift.mutateAsync({ id: editingShift.id, data: payload });
    } else {
      await createShift.mutateAsync({ companyId, ...payload });
    }
    setIsModalOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteShift.mutateAsync(deleteId);
      setDeleteId(null);
      refetch();
    }
  };

  const handleOpenAssign = (shift) => {
    setAssigningShift(shift);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async (assignData) => {
    await assignShift.mutateAsync({
      companyId,
      ...assignData,
    });
    setIsAssignModalOpen(false);
  };

  const shifts = Array.isArray(shiftsData)
    ? shiftsData
    : Array.isArray(shiftsData?.shifts)
    ? shiftsData.shifts
    : Array.isArray(shiftsData?.data?.shifts)
    ? shiftsData.data.shifts
    : Array.isArray(shiftsData?.data)
    ? shiftsData.data
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Shift Master</h1>
          <p className="text-sm text-slate-400">Configure standard work hours, rotational shifts, and grace timings</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/shifts/assign')}>
            Assign Shifts
          </Button>
          <Button variant="primary" onClick={handleOpenCreate}>
            + Create Shift
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400">Loading work shifts...</div>
      ) : shifts.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          No work shifts created yet. Create a standard shift schedule above.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeleteId(id)}
              onAssign={handleOpenAssign}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Shift Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShift ? 'Edit Shift Schedule' : 'Create New Shift'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Shift Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Morning Shift, Evening Shift, Night Shift"
          />

          <Input
            label="Shift Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. GS, MS, NS"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Grace (Mins)"
              type="number"
              value={formData.gracePeriod}
              onChange={(e) => setFormData({ ...formData, gracePeriod: Number(e.target.value) })}
            />
            <Input
              label="Half-Day (Hrs)"
              type="number"
              value={formData.halfDayHours}
              onChange={(e) => setFormData({ ...formData, halfDayHours: Number(e.target.value) })}
            />
            <Input
              label="Full-Day (Hrs)"
              type="number"
              value={formData.fullDayHours}
              onChange={(e) => setFormData({ ...formData, fullDayHours: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNightShift}
                onChange={(e) => setFormData({ ...formData, isNightShift: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              Crosses Midnight (Night Shift)
            </label>
          </div>

          {/* Break Rules Selection */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              Applied Break Rules
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select which company break policies apply to this shift:
            </p>

            {breakRulesLoading ? (
              <div className="text-xs text-slate-500 py-2">Loading break rules...</div>
            ) : breakRules.length === 0 ? (
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-400">
                No break rules defined yet. Standard default limits (60m total) will apply.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {breakRules.map((rule) => {
                  const isChecked = selectedBreakRuleIds.includes(rule.id);
                  return (
                    <label
                      key={rule.id}
                      className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer text-xs ${
                        isChecked
                          ? 'bg-indigo-950/30 border-indigo-700/60 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBreakRule(rule.id)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                        />
                        <span className="font-medium">{rule.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {rule.durationMinutes}m ({rule.maxPerShift}x) • {rule.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createShift.isPending || updateShift.isPending}>
              {editingShift ? 'Save Changes' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      <ShiftAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        shift={assigningShift}
        onAssign={handleConfirmAssign}
        isSubmitting={assignShift.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Shift"
        message="Are you sure you want to delete this shift schedule?"
      />
    </div>
  );
}
