import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import leaveService from '../../services/leave.service';
import { useLeaveBalances } from '../../hooks/useLeaveBalances';
import {
  Calendar,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PieChart,
  RefreshCw,
  Send,
  ChevronDown,
  Check,
  X,
  Layers,
} from 'lucide-react-native';

export default function LeaveScreen() {
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'apply' | 'balance'
  const [refreshing, setRefreshing] = useState(false);

  // Apply Form State
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Leave Balances (Shared deduped query)
  const {
    data: balancesData,
    isLoading: balancesLoading,
    refetch: refetchBalances,
  } = useLeaveBalances();

  // Fetch Leave Types
  const {
    data: typesData,
    isLoading: typesLoading,
    refetch: refetchTypes,
  } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => leaveService.getLeaveTypes(),
  });

  // Fetch My Requests
  const {
    data: myRequestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['myLeaveRequests'],
    queryFn: () => leaveService.getMyRequests(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBalances(), refetchTypes(), refetchRequests()]);
    setRefreshing(false);
  }, [refetchBalances, refetchTypes, refetchRequests]);

  // Robust extraction of leave types from { types: [...] }, { data: { types: [...] } }, or array
  const leaveTypesList =
    typesData?.types ||
    typesData?.data?.types ||
    typesData?.data ||
    (Array.isArray(typesData) ? typesData : []);

  const selectedType = leaveTypesList.find((t) => t.id === selectedTypeId);

  const rawBalances =
    balancesData?.balances ||
    balancesData?.data?.balances ||
    balancesData?.data ||
    (Array.isArray(balancesData) ? balancesData : []);
  const balancesList = Array.isArray(rawBalances) ? rawBalances : [];

  const requestsList =
    myRequestsData?.requests ||
    myRequestsData?.data?.requests ||
    myRequestsData?.data ||
    (Array.isArray(myRequestsData) ? myRequestsData : []);

  // Handle Submit Apply Leave
  const handleApplyLeave = async () => {
    if (!selectedTypeId) {
      Alert.alert('Missing Field', 'Please select a leave category.');
      return;
    }
    if (!startDate.trim()) {
      Alert.alert('Missing Field', 'Please enter a valid start date (YYYY-MM-DD).');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Missing Field', 'Please provide a brief reason for your leave.');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveService.applyLeave({
        leaveTypeId: selectedTypeId,
        startDate: startDate.trim(),
        endDate: (endDate || startDate).trim(),
        reason: reason.trim(),
        isHalfDay,
      });

      Alert.alert('Application Submitted 🎉', 'Your leave request has been sent for approval.');
      setSelectedTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setIsHalfDay(false);
      setActiveTab('my');
      await Promise.all([refetchRequests(), refetchBalances()]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || err.message || 'Leave application failed.';
      Alert.alert('Submission Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoDates = (daysFromNow = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const dateStr = d.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Segmented Tab Navigation */}
      <View style={styles.tabsHeader}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
          onPress={() => setActiveTab('my')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabButtonText, activeTab === 'my' && styles.tabButtonTextActive]}>
            My Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'apply' && styles.tabButtonActive]}
          onPress={() => setActiveTab('apply')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabButtonText, activeTab === 'apply' && styles.tabButtonTextActive]}>
            Apply Leave
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'balance' && styles.tabButtonActive]}
          onPress={() => setActiveTab('balance')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabButtonText, activeTab === 'balance' && styles.tabButtonTextActive]}>
            Balances
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* TAB 1: My Requests */}
        {activeTab === 'my' ? (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Leave History & Requests</Text>
              <TouchableOpacity
                style={styles.applyShortcutBtn}
                onPress={() => setActiveTab('apply')}
                activeOpacity={0.7}
              >
                <PlusCircle size={14} color="#4F46E5" />
                <Text style={styles.applyShortcutText}>New Request</Text>
              </TouchableOpacity>
            </View>

            {requestsLoading && requestsList.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading leave requests...</Text>
              </View>
            ) : requestsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Calendar size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Leave Applications</Text>
                <Text style={styles.emptySubtitle}>You haven't submitted any leave requests yet.</Text>
                <TouchableOpacity
                  style={styles.applyEmptyBtn}
                  onPress={() => setActiveTab('apply')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyEmptyBtnText}>Apply for Leave</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {requestsList.map((req, idx) => {
                  const status = (req.status || 'PENDING').toUpperCase();
                  const isApproved = status === 'APPROVED';
                  const isRejected = status === 'REJECTED';
                  const leaveTypeName = req.leaveType?.name || 'General Leave';

                  return (
                    <View key={req.id || idx} style={styles.requestCard}>
                      <View style={styles.requestCardTop}>
                        <View>
                          <Text style={styles.requestTypeName}>{leaveTypeName}</Text>
                          <Text style={styles.requestDateRange}>
                            {new Date(req.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {req.endDate && req.endDate !== req.startDate
                              ? ` - ${new Date(req.endDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}`
                              : `, ${new Date(req.startDate).getFullYear()}`}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            isApproved
                              ? { backgroundColor: '#ECFDF5' }
                              : isRejected
                              ? { backgroundColor: '#FEF2F2' }
                              : { backgroundColor: '#FEF3C7' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              isApproved
                                ? { color: '#059669' }
                                : isRejected
                                ? { color: '#DC2626' }
                                : { color: '#D97706' },
                            ]}
                          >
                            {status}
                          </Text>
                        </View>
                      </View>

                      {req.reason ? (
                        <Text style={styles.requestReason}>"{req.reason}"</Text>
                      ) : null}

                      <View style={styles.requestFooter}>
                        <Text style={styles.requestDaysCount}>
                          Duration: {req.totalDays || 1} day{req.totalDays > 1 ? 's' : ''}
                        </Text>
                        {req.isHalfDay ? (
                          <Text style={styles.halfDayBadge}>Half Day</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {/* TAB 2: Apply Leave Form */}
        {activeTab === 'apply' ? (
          <View style={styles.applyFormCard}>
            <Text style={styles.formTitle}>Apply for Leave</Text>
            <Text style={styles.formSubtitle}>Submit your request for manager approval</Text>

            {/* Leave Category Selector */}
            <Text style={styles.inputLabel}>Leave Category *</Text>
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                isTypeDropdownOpen && styles.dropdownTriggerActive,
              ]}
              onPress={() => setIsTypeDropdownOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownSelectedRow}>
                <Layers size={16} color={selectedType ? '#4F46E5' : '#94A3B8'} />
                <Text
                  style={[
                    styles.dropdownSelectedText,
                    !selectedType && styles.dropdownPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedType
                    ? `${selectedType.name} (${selectedType.code || 'LV'})`
                    : typesLoading
                    ? 'Loading leave categories...'
                    : 'Select Leave Category'}
                </Text>
              </View>
              <ChevronDown size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Dates */}
            <View style={styles.dateInputsRow}>
              <View style={styles.dateInputCol}>
                <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-10-15"
                  placeholderTextColor="#94A3B8"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={styles.dateInputCol}>
                <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-10-15"
                  placeholderTextColor="#94A3B8"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>

            {/* Quick Fill Date Shortcuts */}
            <View style={styles.quickDateShortcuts}>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => setDemoDates(1)}>
                <Text style={styles.quickDateText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickDateChip} onPress={() => setDemoDates(7)}>
                <Text style={styles.quickDateText}>Next Week</Text>
              </TouchableOpacity>
            </View>

            {/* Reason */}
            <Text style={styles.inputLabel}>Reason / Remarks</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Explain the reason for taking leave..."
              placeholderTextColor="#94A3B8"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleApplyLeave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Send size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit Leave Application</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* TAB 3: Leave Balances */}
        {activeTab === 'balance' ? (
          <View>
            <Text style={styles.sectionTitle}>Your Leave Balances</Text>
            {balancesLoading && balancesList.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading leave balances...</Text>
              </View>
            ) : balancesList.length === 0 ? (
              <View style={styles.emptyCard}>
                <PieChart size={38} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Balance Allocations</Text>
                <Text style={styles.emptySubtitle}>No leave quota assigned to your account yet.</Text>
              </View>
            ) : (
              <View style={styles.balancesGrid}>
                {balancesList.map((bal, idx) => {
                  const typeName = bal.leaveType?.name || 'Leave';
                  const remaining = Number(bal.remainingDays || 0);
                  const used = Number(bal.usedDays || 0);
                  const total = remaining + used;

                  return (
                    <View key={bal.id || idx} style={styles.balanceCard}>
                      <View style={styles.balanceCardTop}>
                        <Text style={styles.balanceTypeName}>{typeName}</Text>
                        <Text style={styles.balanceRemainingNum}>{remaining}d left</Text>
                      </View>

                      <View style={styles.balanceStatsRow}>
                        <View style={styles.balanceStat}>
                          <Text style={styles.balanceStatLabel}>Total Quota</Text>
                          <Text style={styles.balanceStatVal}>{total} days</Text>
                        </View>
                        <View style={styles.balanceStat}>
                          <Text style={styles.balanceStatLabel}>Used</Text>
                          <Text style={[styles.balanceStatVal, { color: '#DC2626' }]}>
                            {used} days
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Leave Category Selector Modal */}
      <Modal
        visible={isTypeDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTypeDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsTypeDropdownOpen(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Leave Category</Text>
                <Text style={styles.modalSub}>Choose applicable leave quota type</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsTypeDropdownOpen(false)}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {typesLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.modalLoadingText}>Fetching leave categories...</Text>
              </View>
            ) : leaveTypesList.length === 0 ? (
              <View style={styles.modalEmpty}>
                <AlertCircle size={28} color="#94A3B8" />
                <Text style={styles.modalEmptyText}>No leave categories available.</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {leaveTypesList.map((item) => {
                  const isSelected = selectedTypeId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.modalItem,
                        isSelected && styles.modalItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedTypeId(item.id);
                        setIsTypeDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modalItemLeft}>
                        <View
                          style={[
                            styles.modalItemCodeBadge,
                            isSelected && styles.modalItemCodeBadgeSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.modalItemCodeText,
                              isSelected && styles.modalItemCodeTextSelected,
                            ]}
                          >
                            {item.code || 'LV'}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={[
                              styles.modalItemName,
                              isSelected && styles.modalItemNameSelected,
                            ]}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.modalItemSub}>
                            {item.isPaid ? 'Paid Leave' : 'Unpaid Leave'}
                            {item.maxDaysPerYear ? ` • ${item.maxDaysPerYear} days/year` : ''}
                          </Text>
                        </View>
                      </View>

                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Check size={14} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={styles.uncheckCircle} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#4F46E5',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  applyShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  applyShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  applyEmptyBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyEmptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTypeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  requestDateRange: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestReason: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  requestDaysCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  halfDayBadge: {
    fontSize: 11,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '600',
  },
  applyFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },
  dropdownTriggerActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  dropdownSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownPlaceholderText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  dateInputCol: {
    flex: 1,
  },
  quickDateShortcuts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickDateChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickDateText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  balancesGrid: {
    gap: 12,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTypeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  balanceRemainingNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  balanceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  balanceStat: {
    alignItems: 'center',
  },
  balanceStatLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  balanceStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  modalLoadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  modalEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  modalEmptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  modalList: {
    marginTop: 6,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalItemCodeBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemCodeBadgeSelected: {
    backgroundColor: '#4F46E5',
  },
  modalItemCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  modalItemCodeTextSelected: {
    color: '#FFFFFF',
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalItemNameSelected: {
    color: '#4F46E5',
  },
  modalItemSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
});
