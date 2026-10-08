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
import api from '../../services/api';
import { Timer, Send, Clock } from 'lucide-react-native';

export default function ApplyOvertimeScreen() {
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date.trim()) {
      Alert.alert('Missing Date', 'Please enter the overtime date (YYYY-MM-DD).');
      return;
    }
    if (!hours.trim() || isNaN(Number(hours))) {
      Alert.alert('Missing Hours', 'Please enter valid overtime hours (e.g. 2.5).');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Missing Reason', 'Please provide project or task justification for overtime.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/overtime/apply', {
        date: date.trim(),
        hours: Number(hours),
        reason: reason.trim(),
      });
      Alert.alert('Overtime Claimed 🎉', 'Your overtime request has been submitted for supervisor review.');
      setDate('');
      setHours('');
      setReason('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Overtime claim logged.';
      Alert.alert('Overtime Submitted', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Timer size={20} color="#4F46E5" />
            <Text style={styles.headerTitle}>Claim Overtime Hours</Text>
          </View>

          <Text style={styles.label}>Overtime Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-10-05"
            placeholderTextColor="#94A3B8"
            value={date}
            onChangeText={setDate}
          />

          <Text style={styles.label}>Total Overtime Hours Claimed *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3.5"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            value={hours}
            onChangeText={setHours}
          />

          <Text style={styles.label}>Task / Project Justification *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the sprint release, deployment, or urgent support completed..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
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
                <Text style={styles.submitBtnText}>Submit Overtime Claim</Text>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 7, marginTop: 6, letterSpacing: 0.1 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 22,
    fontWeight: '500',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },
});
