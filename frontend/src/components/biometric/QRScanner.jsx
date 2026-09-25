import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, Upload, QrCode } from 'lucide-react';

export default function QRScanner({ onScan, onError, active = true }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const scannerRef = useRef(null);
  const containerId = 'qr-reader-container';

  useEffect(() => {
    let mounted = true;

    async function initCameras() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (mounted && devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back')) || devices[0];
          setSelectedCamera(backCam.id);
        }
      } catch (err) {
        if (mounted) {
          setErrorMsg('Camera access denied or no camera device found.');
        }
      }
    }

    initCameras();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId) => {
    try {
      setErrorMsg(null);
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          if (onScan) onScan(decodedText);
        },
        () => {
          // ignore frame decode noise
        }
      );

      setIsScanning(true);
    } catch (err) {
      setErrorMsg(`Failed to start camera scanner: ${err.message || err}`);
      if (onError) onError(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (active && selectedCamera && !isScanning) {
      startScanner(selectedCamera);
    } else if (!active && isScanning) {
      stopScanner();
    }
  }, [active, selectedCamera]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode(containerId);
      const result = await html5QrCode.scanFile(file, true);
      if (onScan) onScan(result);
    } catch (err) {
      setErrorMsg('Could not detect a valid QR code in this image.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim() && onScan) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-white">
      {/* Viewfinder Area */}
      <div className="relative w-full aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700/50">
        <div id={containerId} className="w-full h-full object-cover" />

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Target Box */}
            <div className="relative w-64 h-64 border-2 border-indigo-500/80 rounded-2xl flex items-center justify-center">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br" />

              {/* Scanning Animation Laser Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
              Align QR Code within the frame
            </p>
          </div>
        )}

        {!isScanning && (
          <div className="text-center p-6 space-y-3">
            <CameraOff className="w-12 h-12 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-400">Camera is paused or inactive</p>
            {selectedCamera && (
              <button
                onClick={() => startScanner(selectedCamera)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Start Camera
              </button>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-3 w-full bg-rose-950/50 border border-rose-800/60 rounded-lg p-2.5 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Controls & Fallbacks */}
      <div className="w-full mt-4 space-y-3">
        {cameras.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Camera:</label>
            <select
              value={selectedCamera}
              onChange={(e) => {
                setSelectedCamera(e.target.value);
                startScanner(e.target.value);
              }}
              className="flex-1 bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
            <Upload className="w-3.5 h-3.5" />
            Scan from Image File
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>

          <button
            type="button"
            onClick={() => {
              if (selectedCamera) startScanner(selectedCamera);
            }}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Manual Code / Scanner gun input */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste QR payload / scanner data..."
            className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-lg text-slate-200"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
