import { useState, useEffect } from 'react';
import { MapPin, Check } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function LiveLocationPage() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const fillBranchLocation = async () => {
    if (!location) {
      toast.error('Get location first');
      return;
    }

    try {
      setLoading(true);
      await api.put(
        '/branches/f74c6719-d57a-4237-9a61-85fa9e9c7dc7',
        {
          latitude: location.latitude,
          longitude: location.longitude,
          address: 'Auto-filled from live location',
          city: 'Auto-detected',
          state: 'Auto-detected'
        }
      );
      toast.success('Branch location updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
          Live Location Setup
        </h1>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Getting your location...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={getLocation}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Retry
            </button>
          </div>
        )}

        {location && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-800 dark:text-green-300">
                  Location Found
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>Latitude:</strong> {location.latitude}</p>
                <p><strong>Longitude:</strong> {location.longitude}</p>
                <p><strong>Accuracy:</strong> {Math.round(location.accuracy)}m</p>
              </div>
            </div>

            <button
              onClick={fillBranchLocation}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
              Fill Branch Location
            </button>

            <button
              onClick={getLocation}
              className="w-full py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition"
            >
              Refresh Location
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
