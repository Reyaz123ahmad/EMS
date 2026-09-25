import React, { useState, useEffect } from 'react';
import { X, QrCode, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import QRScanner from '../biometric/QRScanner';
import { useCardScan } from '../../hooks/useAttendance';

export default function QRScanModal({ isOpen, onClose, initialOperation = 'CHECK_IN', onSuccess }) {
  const [operation, setOperation] = useState(initialOperation);
  const [breakType, setBreakType] = useState('SHORT');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const cardScanMutation = useCardScan();

  useEffect(() => {
    if (isOpen) {
      setOperation(initialOperation);
      setScanResult(null);
      // Fetch GPS location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
            setLocationError(null);
          },
          (err) => {
            setLocationError('Could not acquire GPS location. Please allow location permissions.');
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }
  }, [isOpen, initialOperation]);

  if (!isOpen) return null;

  const handleScan = async (qrData) => {
    if (cardScanMutation.isPending) return;

    if (!location) {
      toast.error('Location is required for card attendance punch.');
      return;
    }

    try {
      const response = await cardScanMutation.mutateAsync({
        qrData,
        operation,
        breakType,
        location,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isMockLocation: false
        }
      });

      setScanResult({ success: true, data: response.data, message: response.message });
      toast.success(response.message || 'Card Attendance recorded successfully!');
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Card attendance failed';
      setScanResult({ success: false, message: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Scan Card QR Code</h3>
              <p className="text-xs text-slate-400">Scan employee identity badge to punch attendance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operation Selector */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          {[
            { key: 'CHECK_IN', label: 'Check In' },
            { key: 'CHECK_OUT', label: 'Check Out' },
            { key: 'BREAK_START', label: 'Start Break' },
            { key: 'BREAK_END', label: 'End Break' }
          ].map((op) => (
            <button
              key={op.key}
              type="button"
              onClick={() => setOperation(op.key)}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                operation === op.key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {operation === 'BREAK_START' && (
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-slate-400">Break Type:</label>
            <select
              value={breakType}
              onChange={(e) => setBreakType(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="SHORT">Short Break (15m)</option>
              <option value="TEA">Tea Break (15m)</option>
              <option value="LUNCH">Lunch Break (45m)</option>
              <option value="PERSONAL">Personal Break</option>
            </select>
          </div>
        )}

        {/* Location Status */}
        <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className={`w-4 h-4 ${location ? 'text-emerald-400' : 'text-amber-400'}`} />
            {location ? (
              <span className="text-slate-300">
                GPS Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)} (±{Math.round(location.accuracy)}m)
              </span>
            ) : (
              <span className="text-amber-400 font-medium">Acquiring GPS coordinates...</span>
            )}
          </div>
          {location && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Ready
            </span>
          )}
        </div>

        {locationError && (
          <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
            {locationError}
          </div>
        )}

        {/* QR Scanner */}
        <div className="mt-4">
          <QRScanner onScan={handleScan} active={isOpen && !scanResult?.success} />
        </div>

        {/* Processing / Result state */}
        {cardScanMutation.isPending && (
          <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-indigo-950/50 border border-indigo-800 rounded-xl text-indigo-300 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying HMAC signature & recording attendance...</span>
          </div>
        )}

        {scanResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-sm flex items-start gap-3 ${
              scanResult.success
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/50 border-rose-800 text-rose-200'
            }`}
          >
            {scanResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{scanResult.message}</p>
              {scanResult.success && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  Close Terminal
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
