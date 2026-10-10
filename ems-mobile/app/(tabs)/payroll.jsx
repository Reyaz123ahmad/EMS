import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import payrollService from '../../services/payroll.service';
import {
  IndianRupee,
  Download,
  Calendar,
  FileText,
  CheckCircle,
  TrendingUp,
  Shield,
  Share2,
} from 'lucide-react-native';

export default function PayrollScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch employee payslips
  const {
    data: slipsData,
    isLoading: slipsLoading,
    refetch: refetchSlips,
  } = useQuery({
    queryKey: ['myPayslips'],
    queryFn: () => payrollService.getMyPayslips({ page: 1, limit: 20 }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchSlips();
    setRefreshing(false);
  }, [refetchSlips]);

  const slipsList = slipsData?.slips || slipsData?.data || (Array.isArray(slipsData) ? slipsData : []);

  // Format currency
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getMonthName = (monthNum) => {
    const num = Number(monthNum);
    if (!num || isNaN(num) || num < 1 || num > 12) return 'Salary Slip';
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[num - 1];
  };

  const parseSlipDetails = (slip) => {
    const pItem = slip.payrollItem || {};
    const pRun = pItem.payrollRun || slip.payrollRun || {};

    let month = pRun.month || pItem.month || slip.month;
    let year = pRun.year || pItem.year || slip.year;

    const rawDate = slip.generatedAt || pItem.createdAt || slip.createdAt || pRun.payoutDate;
    if ((!month || isNaN(Number(month))) && rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        month = d.getMonth() + 1;
        year = year || d.getFullYear();
      }
    }

    month = Number(month) || new Date().getMonth() + 1;
    year = Number(year) || new Date().getFullYear();

    const monthName = getMonthName(month);
    const netPay = pItem.netSalary ?? slip.netSalary ?? slip.netPay ?? 0;
    const grossPay = pItem.grossSalary ?? slip.grossSalary ?? slip.grossPay ?? netPay;
    const totalDeductions = pItem.totalDeductions ?? slip.totalDeductions ?? Math.max(0, grossPay - netPay);

    const disbursedRaw = pRun.payoutDate || slip.paymentDate || slip.generatedAt || pItem.createdAt || slip.createdAt;
    let disbursedStr = 'Processed';
    if (disbursedRaw) {
      const d = new Date(disbursedRaw);
      if (!isNaN(d.getTime())) {
        disbursedStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }

    return {
      month,
      year,
      monthName,
      netPay,
      grossPay,
      totalDeductions,
      disbursedStr,
      slipNumber: slip.slipNumber || `SLIP-${year}-${String(month).padStart(2, '0')}`,
    };
  };

  // Handle Download & Share PDF
  const handleDownloadPDF = async (slip) => {
    const details = parseSlipDetails(slip);
    const slipTitle = `Payslip_${details.monthName}_${details.year}`;

    setDownloadingId(slip.id);
    try {
      await payrollService.downloadPayslip(slip.id, slipTitle);
      Alert.alert('Download Complete 🎉', `Official payslip for ${details.monthName} ${details.year} has been downloaded.`);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || err.message || 'Could not download payslip.';
      Alert.alert('Download Failed', errorMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  // Calculate latest net pay for banner
  const latestSlip = slipsList[0];
  const latestDetails = latestSlip ? parseSlipDetails(latestSlip) : null;
  const latestNetSalary = latestDetails ? latestDetails.netPay : 0;
  const latestMonthYear = latestDetails
    ? `${latestDetails.monthName} ${latestDetails.year}`
    : 'Current Year';

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Latest Salary Overview Banner */}
        <View style={styles.salaryBanner}>
          <View style={styles.salaryBannerTop}>
            <View style={styles.bannerIconCircle}>
              <IndianRupee size={24} color="#059669" />
            </View>
            <View style={styles.bannerStatusBadge}>
              <CheckCircle size={12} color="#059669" />
              <Text style={styles.bannerStatusText}>Direct Deposit</Text>
            </View>
          </View>

          <Text style={styles.bannerLabel}>Latest Disbursed Salary ({latestMonthYear})</Text>
          <Text style={styles.bannerAmount}>{formatCurrency(latestNetSalary)}</Text>

          <View style={styles.bannerStatsRow}>
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatLabel}>Total Payslips</Text>
              <Text style={styles.bannerStatVal}>{slipsList.length}</Text>
            </View>
            <View style={styles.bannerStatDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatLabel}>Tax Deducted</Text>
              <Text style={styles.bannerStatVal}>{formatCurrency(latestSlip?.payrollItem?.tdsDeduction || latestSlip?.tdsDeduction || 0)}</Text>
            </View>
            <View style={styles.bannerStatDivider} />
            <View style={styles.bannerStat}>
              <Text style={styles.bannerStatLabel}>PF Contribution</Text>
              <Text style={styles.bannerStatVal}>{formatCurrency(latestSlip?.payrollItem?.pfDeduction || latestSlip?.pfDeduction || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Payslips History List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Monthly Salary Slips</Text>
          <Text style={styles.sectionSubtitle}>{slipsList.length} statements</Text>
        </View>

        {slipsLoading && slipsList.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching payroll records...</Text>
          </View>
        ) : slipsList.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={38} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Payslips Available</Text>
            <Text style={styles.emptySubtitle}>
              Monthly salary statements and tax breakdowns will appear here once processed by HR.
            </Text>
          </View>
        ) : (
          <View style={styles.slipsList}>
            {slipsList.map((slip, idx) => {
              const details = parseSlipDetails(slip);
              const isDownloading = downloadingId === slip.id;

              return (
                <View key={slip.id || idx} style={styles.slipCard}>
                  <View style={styles.slipCardTop}>
                    <View style={styles.slipDateCol}>
                      <Text style={styles.slipMonthYear}>{details.monthName} {details.year}</Text>
                      <Text style={styles.slipDisbursedDate}>
                        Disbursed on {details.disbursedStr}
                      </Text>
                    </View>

                    <Text style={styles.slipNetPay}>{formatCurrency(details.netPay)}</Text>
                  </View>

                  {/* Earnings & Deductions Bar */}
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownCol}>
                      <Text style={styles.breakdownLabel}>Gross Salary</Text>
                      <Text style={styles.breakdownVal}>{formatCurrency(details.grossPay)}</Text>
                    </View>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.breakdownCol}>
                      <Text style={styles.breakdownLabel}>Deductions</Text>
                      <Text style={[styles.breakdownVal, { color: '#DC2626' }]}>
                        -{formatCurrency(details.totalDeductions)}
                      </Text>
                    </View>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.breakdownCol}>
                      <Text style={styles.breakdownLabel}>Net Pay</Text>
                      <Text style={[styles.breakdownVal, { color: '#059669' }]}>
                        {formatCurrency(details.netPay)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Download Button */}
                  <TouchableOpacity
                    style={[styles.downloadBtn, isDownloading && styles.downloadBtnDisabled]}
                    onPress={() => handleDownloadPDF(slip)}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                      <>
                        <Download size={16} color="#4F46E5" />
                        <Text style={styles.downloadBtnText}>Download Official PDF Payslip</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 44,
  },
  salaryBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  salaryBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bannerStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.2,
  },
  bannerLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  bannerAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 18,
    letterSpacing: -0.5,
  },
  bannerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
  },
  bannerStat: {
    flex: 1,
    alignItems: 'center',
  },
  bannerStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },
  bannerStatLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  bannerStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 36,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  slipsList: {
    gap: 14,
  },
  slipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  slipCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  slipDateCol: {
    flex: 1,
  },
  slipMonthYear: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  slipDisbursedDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  slipNetPay: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  breakdownCol: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 12,
    borderRadius: 12,
  },
  downloadBtnDisabled: {
    opacity: 0.7,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.1,
  },
});
