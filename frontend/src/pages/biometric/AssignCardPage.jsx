import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import api from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { toast } from 'sonner';

export default function AssignCardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState('RFID');
  const [expiresAt, setExpiresAt] = useState('');
  const [assignedResult, setAssignedResult] = useState(null);

  // Fetch employees list
  const { data: empData, isLoading: empsLoading } = useQuery({
    queryKey: ['employees-for-card-assignment'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 100 } });
      return res.data?.data?.employees || [];
    }
  });

  const employees = empData || [];
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const assignMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/biometric-cards/assign', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setAssignedResult(data?.data || data);
      toast.success('Card assigned successfully to employee!');
      queryClient.invalidateQueries({ queryKey: ['biometric-cards'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to assign card');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || !cardNumber.trim()) {
      toast.error('Please select an employee and enter card number');
      return;
    }

    assignMutation.mutate({
      employeeId: selectedEmployeeId,
      cardNumber: cardNumber.trim(),
      cardType,
      expiresAt: expiresAt || undefined
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/biometric-cards')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cards
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Assignment Form */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Assign Card to Employee
            </h1>
            <p className="text-xs text-slate-400">
              Bind a physical RFID, NFC, Smartcard, or custom badge directly to an employee profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Select Employee */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Employee <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose an employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Physical Card Number / UID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="e.g. RFID-889021 or CARD-001"
                required
                className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Card Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Card Media Type</label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="RFID">RFID Proximity Card</option>
                <option value="NFC">NFC Smart Tag</option>
                <option value="QR">QR Code Digital Card</option>
                <option value="BARCODE">Optical Barcode</option>
              </select>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              disabled={assignMutation.isPending || !selectedEmployeeId || !cardNumber}
              className="w-full py-3"
            >
              {assignMutation.isPending ? <Spinner size="sm" /> : 'Confirm & Assign Card'}
            </Button>
          </form>
        </div>

        {/* Right Details / Status */}
        <div className="md:col-span-5 space-y-6">
          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Assignment Summary</h3>

            {selectedEmployee ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Selected Employee:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </span>
                  <p className="text-slate-400 font-mono mt-0.5">{selectedEmployee.employeeCode}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Department & Designation:</span>
                  <span className="font-semibold text-indigo-300">
                    {selectedEmployee.department?.name || 'General'} • {selectedEmployee.designation?.name || 'Staff'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">Select an employee to preview assignment</p>
            )}

            {assignedResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-center animate-fadeIn">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">Card Assigned Successfully!</p>
                <p className="text-xs font-mono text-emerald-200/80">Card ID: {assignedResult.cardNumber || cardNumber}</p>
                <Button size="sm" variant="secondary" onClick={() => navigate('/biometric-cards')} className="mt-2 w-full">
                  View in Directory
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
