import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  ArrowLeft,
  QrCode,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import CardPreview from '../../components/biometric/CardPreview';
import { useGenerateCard } from '../../hooks/useBiometricCards';

export default function GenerateCardPage() {
  const navigate = useNavigate();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [cardType, setCardType] = useState('QR');
  const [expiresAt, setExpiresAt] = useState('');
  const [generatedCard, setGeneratedCard] = useState(null);

  // Fetch employees list
  const { data: empData, isLoading: empsLoading } = useQuery({
    queryKey: ['employees-for-card'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 100 } });
      return res.data?.data?.employees || [];
    }
  });

  const employees = empData || [];
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const generateMutation = useGenerateCard();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    try {
      const result = await generateMutation.mutateAsync({
        employeeId: selectedEmployeeId,
        cardType,
        expiresAt: expiresAt || undefined
      });

      setGeneratedCard(result.data);
    } catch (err) {
      // Error handled by hook toast
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/biometric/cards')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Card Directory
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Generator Form */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Generate Identity & Biometric Card
            </h1>
            <p className="text-xs text-slate-400">
              Create an official employee card with cryptographically signed QR code & printable PDF badge.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Employee <span className="text-rose-400">*</span>
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
                    {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.department?.name || 'Staff'}
                  </option>
                ))}
              </select>
            </div>

            {/* Card Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Card Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'QR', label: 'QR Code Badge', icon: QrCode },
                  { key: 'RFID', label: 'RFID Card', icon: CreditCard },
                  { key: 'NFC', label: 'NFC Card', icon: Layers },
                  { key: 'MAGNETIC', label: 'Magnetic Strip', icon: CreditCard }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCardType(item.key)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                      cardType === item.key
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expiration Date (Optional - defaults to 1 year)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedEmployeeId || generateMutation.isPending}
              className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating QR & PDF Badge...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" /> Generate Card & Badge
                </>
              )}
            </button>
          </form>

          {/* Success Box */}
          {generatedCard && (
            <div className="p-4 bg-emerald-950/50 border border-emerald-800 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Card Generated Successfully!</span>
              </div>
              <p className="text-xs text-emerald-200">
                Card Number <span className="font-mono font-bold text-white">{generatedCard.cardNumber}</span> is ready for physical printing or mobile QR scanning.
              </p>
              {generatedCard.pdfUrl && (
                <a
                  href={generatedCard.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                >
                  <Download className="w-4 h-4" /> Download Print-Ready PDF
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Interactive Card Preview */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Live Badge Preview
          </h3>

          <CardPreview
            employee={selectedEmployee || { firstName: 'Employee', lastName: 'Name', employeeCode: 'EMP-XXX' }}
            card={generatedCard || { cardNumber: 'EMP0001', cardType }}
            qrCodeUrl={generatedCard?.qrUrl}
          />

          <p className="text-[11px] text-slate-500 text-center max-w-xs">
            The generated QR code embeds a cryptographic HMAC signature preventing unauthorized alterations.
          </p>
        </div>
      </div>
    </div>
  );
}
