import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import api from '../../services/api';
import { buildDeviceInfo } from '../../services/attendance.service';
import { AlertTriangle, Send, ShieldAlert, Clock } from 'lucide-react-native';

export default function EmergencyAttendanceScreen() {
  const [reason, setReason] = useState('');
  const [locationRemarks, setLocationRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Missing Reason', 'Please provide a reason for the emergency attendance request.');
      return;
    }

    setIsSubmitting(true);
    try {
      let location = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          location = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracy: Math.round(loc.coords.accuracy || 5),
            source: 'gps',
            isMockLocation: Boolean(loc.mocked),
          };
        }
      } catch {}

      await api.post('/attendance/check-in', {
        mode: 'manual',
        location: location || undefined,
        remarks: `EMERGENCY ATTENDANCE: ${reason.trim()} (${locationRemarks.trim() || 'Off-site punch'})`,
        deviceInfo: { ...buildDeviceInfo(location?.isMockLocation), emergency: true },
      });
      Alert.alert('Request Submitted 🎉', 'Your emergency attendance punch has been submitted for supervisor approval.');
      setReason('');
      setLocationRemarks('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Submission failed.';
      Alert.alert('Submission Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Warning Banner */}
        <View style={styles.warningBox}>
          <AlertTriangle size={22} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Emergency Punch Override</Text>
            <Text style={styles.warningText}>
              Use this option only if biometric hardware, biometric terminal, or GPS is unavailable during an urgent field deployment.
            </Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Emergency Reason *</Text>
          <TextInput
            style={styles.textInputArea}
            placeholder="Describe the emergency circumstance (e.g. Biometric reader hardware offline, field deployment emergency)..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />

          <Text style={styles.fieldLabel}>Location Details / Site Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Client Data Center Site #4"
            placeholderTextColor="#94A3B8"
            value={locationRemarks}
            onChangeText={setLocationRemarks}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit Emergency Punch</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 22, paddingBottom: 44 },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  warningTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 3, letterSpacing: -0.1 },
  warningText: { fontSize: 12, color: '#B45309', lineHeight: 18, fontWeight: '500' },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 10, marginTop: 6, letterSpacing: -0.1 },
  textInputArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    height: 110,
    marginBottom: 16,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 22,
    fontWeight: '500',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#D97706',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },
});
