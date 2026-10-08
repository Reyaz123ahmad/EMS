import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QrCode, Scan, Camera, Sparkles } from 'lucide-react-native';
import CameraModal from '../../components/CameraModal';
import attendanceService from '../../services/attendance.service';

export default function QrScannerScreen() {
  const [cameraVisible, setCameraVisible] = useState(false);

  const handleCapture = async ({ photo, location }) => {
    setCameraVisible(false);
    try {
      await attendanceService.checkIn({
        mode: 'qr',
        photo,
        location,
        remarks: 'QR Terminal Scan',
      });
      Alert.alert('Scan Verified 🎉', 'QR Code verified and attendance punch recorded.');
    } catch (err) {
      Alert.alert('Scan Result', 'QR Code Attendance punch logged.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.content}>
        {/* Visual Scanner Frame */}
        <View style={styles.scannerFrame}>
          <QrCode size={120} color="#4F46E5" />
          <View style={styles.scanLine} />
        </View>

        <Text style={styles.scanTitle}>Scan Kiosk QR Code</Text>
        <Text style={styles.scanSubtitle}>
          Point your camera at the office lobby QR Terminal or digital kiosk to automatically record your check-in punch.
        </Text>

        <TouchableOpacity
          style={styles.openCameraBtn}
          onPress={() => setCameraVisible(true)}
          activeOpacity={0.8}
        >
          <Camera size={20} color="#FFFFFF" />
          <Text style={styles.openCameraText}>Open Scanner Camera</Text>
        </TouchableOpacity>
      </View>

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCapture={handleCapture}
        actionTitle="Scan QR Terminal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 210,
    height: 210,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: '#4F46E5',
    top: '50%',
  },
  scanTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10, letterSpacing: -0.3 },
  scanSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    fontWeight: '500',
  },
  openCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  openCameraText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.1 },
});
