import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Download,
  Printer,
  QrCode,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Phone,
  CheckCircle2
} from 'lucide-react';
import biometricCardService from '../../services/biometric-card.service.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export default function MyCardPage() {
  const cardRef = useRef(null);

  const { data: response, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['my-biometric-card'],
    queryFn: async () => {
      return await biometricCardService.getMyCard();
    }
  });

  const card = response?.data || response;

  const handleDownload = async () => {
    if (!card?.id) return;
    try {
      toast.info('Generating PDF badge download...');
      const blob = await biometricCardService.downloadCard(card.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `card-${card.cardNumber || 'badge'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Card PDF downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download card PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-card-section, #printable-card-section * {
            visibility: visible;
          }
          #printable-card-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: center;
            gap: 20px;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            My Identity & Biometric Card
          </h1>
          <p className="text-sm text-slate-400">
            Your official digital identity badge with verifiable QR code for contactless attendance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </Button>

          {card && (
            <>
              <Button variant="secondary" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print Card
              </Button>
              <Button size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Spinner size="lg" />
        </div>
      ) : !card ? (
        <Card className="p-12 text-center bg-slate-900 border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">No Card Assigned</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You do not currently have an active identity card. Contact your HR administrator to issue a biometric identity card.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Card Previews (Front & Back) */}
          <div id="printable-card-section" ref={cardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FRONT SIDE */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                    {card.company?.name ? card.company.name.charAt(0) : 'E'}
                  </div>
                  <span className="font-bold text-sm tracking-wide text-white">
                    {card.company?.name || 'Company ID Badge'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {card.cardType || 'QR'} • {card.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="flex items-start gap-4">
                {/* Employee Photo */}
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-800 border-2 border-indigo-500/40 shrink-0 flex items-center justify-center shadow-md">
                  {card.employee?.photoUrl ? (
                    <img
                      src={card.employee.photoUrl}
                      alt="Employee"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Avatar name={`${card.employee?.firstName || ''} ${card.employee?.lastName || ''}`} size="lg" />
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-bold text-lg text-white truncate">
                    {card.employee?.firstName} {card.employee?.lastName}
                  </h3>
                  <p className="text-xs font-mono text-indigo-400 font-semibold">
                    {card.employee?.employeeCode}
                  </p>
                  <p className="text-xs text-slate-300">
                    {card.employee?.designation?.name || 'Employee'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Dept: {card.employee?.department?.name || 'General'}
                  </p>
                </div>
              </div>

              {/* QR Code & Card Number */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Card No</span>
                  <span className="font-mono font-bold text-sm text-amber-400">{card.cardNumber}</span>
                </div>

                {card.qrUrl ? (
                  <div className="p-1.5 bg-white rounded-xl shadow-inner">
                    <img src={card.qrUrl} alt="QR Code" className="w-14 h-14 object-contain" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-indigo-950/80 border border-indigo-500/40 rounded-xl flex items-center justify-center text-indigo-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                <span>Issued: {dayjs(card.assignedAt || card.createdAt).format('DD MMM YYYY')}</span>
                <span>Expires: {card.expiresAt ? dayjs(card.expiresAt).format('DD MMM YYYY') : 'Permanent'}</span>
              </div>
            </div>

            {/* BACK SIDE */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl flex flex-col justify-between text-white space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Card Guidelines</span>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <p>• This badge is non-transferable and remains the property of the company.</p>
                <p>• Present or scan this QR at all biometric verification checkpoints.</p>
                <p>• If found, please return to Human Resources Department or email security.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Emergency Contact
                </span>
                <p className="text-slate-400 font-mono">HR Desk: +91 98765 43210</p>
                <p className="text-slate-400">helpdesk@company.com</p>
              </div>

              <div className="text-center text-[10px] text-slate-500">
                Cryptographically Secured by EMS Zero-Trust HMAC
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
