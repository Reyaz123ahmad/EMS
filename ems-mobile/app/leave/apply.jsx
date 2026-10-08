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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import leaveService from '../../services/leave.service';
import { Send, ChevronDown, Check, X, Tag } from 'lucide-react-native';

export default function ApplyLeaveScreen() {
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => leaveService.getLeaveTypes(),
  });

  const leaveTypesList = Array.isArray(typesData) ? typesData : typesData?.data || [];
  const selectedType = leaveTypesList.find((t) => t.id === selectedTypeId);

  const handleApply = async () => {
    if (!selectedTypeId) {
      Alert.alert('Missing Leave Type', 'Please select a leave category from the dropdown.');
      return;
    }
    if (!startDate.trim()) {
      Alert.alert('Missing Date', 'Please enter a valid start date (YYYY-MM-DD).');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Missing Reason', 'Please provide a reason for the leave request.');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveService.applyLeave({
        leaveTypeId: selectedTypeId,
        startDate: startDate.trim(),
        endDate: endDate.trim() || startDate.trim(),
        reason: reason.trim(),
      });
      Alert.alert('Success 🎉', 'Leave request submitted successfully for approval.');
      setSelectedTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not submit leave.';
      Alert.alert('Submission Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          {/* Dropdown Selector */}
          <Text style={styles.sectionTitle}>Leave Category *</Text>
          <TouchableOpacity
            style={[styles.dropdownTrigger, isDropdownOpen && styles.dropdownTriggerActive]}
            onPress={() => setIsDropdownOpen(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Tag size={18} color={selectedType ? '#4F46E5' : '#94A3B8'} />
              <Text style={[styles.dropdownTriggerText, selectedType && styles.dropdownTriggerTextSelected]}>
                {selectedType ? `${selectedType.name} (${selectedType.code || 'LEAVE'})` : 'Select leave category...'}
              </Text>
            </View>
            <ChevronDown size={18} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-11-15"
            placeholderTextColor="#94A3B8"
            value={startDate}
            onChangeText={setStartDate}
          />

          <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-11-16 (Optional)"
            placeholderTextColor="#94A3B8"
            value={endDate}
            onChangeText={setEndDate}
          />

          <Text style={styles.label}>Reason for Leave *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Brief reason for your absence..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!selectedTypeId || isSubmitting) && styles.submitBtnDisabled]}
            onPress={handleApply}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit Leave Application</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal Dropdown Picker */}
        <Modal
          visible={isDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Leave Category</Text>
                <TouchableOpacity onPress={() => setIsDropdownOpen(false)} style={styles.closeBtn}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {typesLoading ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>Loading leave categories...</Text>
                </View>
              ) : leaveTypesList.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>No leave types configured by HR.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 300 }}>
                  {leaveTypesList.map((type) => {
                    const isSelected = selectedTypeId === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.modalItem, isSelected && styles.modalItemActive]}
                        onPress={() => {
                          setSelectedTypeId(type.id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalItemTitle, isSelected && styles.modalItemTitleActive]}>
                            {type.name}
                          </Text>
                          <Text style={styles.modalItemSub}>
                            Code: {type.code || 'N/A'} • {type.isPaid ? 'Paid' : 'Unpaid'}
                            {type.maxDaysPerYear ? ` • Max ${type.maxDaysPerYear}d/yr` : ''}
                          </Text>
                        </View>
                        {isSelected && <Check size={18} color="#4F46E5" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
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
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 10, letterSpacing: -0.1 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  dropdownTriggerActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dropdownTriggerTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
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
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    width: '100%',
    maxWidth: 400,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.1 },
  closeBtn: { padding: 6 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  modalItemActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  modalItemTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  modalItemTitleActive: { color: '#4F46E5', fontWeight: '800' },
  modalItemSub: { fontSize: 11, color: '#64748B', marginTop: 3, fontWeight: '500' },
});
