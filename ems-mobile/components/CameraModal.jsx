import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Camera, RefreshCw, X, Check, MapPin, AlertCircle } from 'lucide-react-native';

export default function CameraModal({ visible, onClose, onCapture, actionTitle = 'Face Check-In' }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Fetching GPS location...');
  const [facing, setFacing] = useState('front');
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);

  // Fetch location on modal open
  useEffect(() => {
    if (visible) {
      setPhotoUri(null);
      setPhotoBase64(null);
      setIsProcessing(false);
      setLocation(null);

      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLocationStatus('Location permission denied');
            setLocation(null);
            return;
          }
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const isMock = Boolean(loc.mocked);
          setLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracy: Math.round(loc.coords.accuracy || 5),
            source: 'gps',
            isMockLocation: isMock,
          });
          setLocationStatus(
            `GPS: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}${
              isMock ? ' (Mocked)' : ''
            }`
          );
        } catch (err) {
          setLocationStatus('Could not acquire GPS position');
          setLocation(null);
        }
      })();
    }
  }, [visible]);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
        skipProcessing: false,
      });

      if (photo) {
        setPhotoUri(photo.uri);
        const base64Data = photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : null;
        setPhotoBase64(base64Data);
      }
    } catch (err) {
      console.warn('[CAMERA] Error capturing image:', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
  };

  const handleConfirm = () => {
    if (!location) {
      alert('Valid GPS location is required to confirm punch.');
      return;
    }
    if (onCapture) {
      onCapture({
        photo: photoBase64,
        photoUri,
        location,
      });
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>{actionTitle}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Permission Check */}
        {!permission?.granted ? (
          <View style={styles.permissionContainer}>
            <AlertCircle size={48} color="#F59E0B" style={styles.permissionIcon} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionSubtitle}>
              Please grant camera access to capture your face for biometric attendance check-in.
            </Text>
            <TouchableOpacity style={styles.grantButton} onPress={requestPermission} activeOpacity={0.8}>
              <Text style={styles.grantButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
          </View>
        ) : photoUri ? (
          /* Photo Preview View */
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <View style={styles.locationBadge}>
                <MapPin size={14} color="#10B981" />
                <Text style={styles.locationText}>{locationStatus}</Text>
              </View>
            </View>

            {/* Confirmation Controls */}
            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake} activeOpacity={0.8}>
                <RefreshCw size={20} color="#E2E8F0" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.8}>
                <Check size={22} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Confirm & Punch</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Live Camera View */
          <View style={styles.cameraWrapper}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
              {/* Face Guide Oval */}
              <View style={styles.guideContainer}>
                <View style={styles.faceOvalGuide} />
                <Text style={styles.guideText}>Center your face inside the circle</Text>
              </View>

              {/* Location pill */}
              <View style={styles.locationPill}>
                <MapPin size={14} color="#10B981" />
                <Text style={styles.locationPillText}>{locationStatus}</Text>
              </View>
            </CameraView>

            {/* Bottom Camera Action Bar */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
                activeOpacity={0.7}
              >
                <RefreshCw size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shutterButton}
                onPress={handleTakePhoto}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </TouchableOpacity>

              <View style={{ width: 48 }} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    marginBottom: 16,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  grantButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOvalGuide: {
    width: 260,
    height: 320,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  guideText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  locationPillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    height: 100,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  previewOverlay: {
    padding: 16,
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  previewControls: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
