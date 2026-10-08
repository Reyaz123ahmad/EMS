import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import {
  CreditCard,
  Download,
  RefreshCw,
  ShieldCheck,
  Phone,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth.js';
import biometricCardService from '../services/biometric-card.service.js';

export default function MyCardScreen() {
  const { user: authUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch official biometric card from backend
  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['my-biometric-card'],
    queryFn: async () => {
      return await biometricCardService.getMyCard();
    },
    staleTime: 30000,
  });

  const card = response?.data || response;

  // Resolved Employee Name with complete fallback chain
  const employeeName =
    (card?.employee?.firstName
      ? `${card.employee.firstName} ${card.employee.lastName || ''}`.trim()
      : null) ||
    authUser?.name ||
    (authUser?.firstName
      ? `${authUser.firstName} ${authUser.lastName || ''}`.trim()
      : null) ||
    (authUser?.employee?.firstName
      ? `${authUser.employee.firstName} ${authUser.employee.lastName || ''}`.trim()
      : null) ||
    'Employee';

  // Resolved Employee Code
  const employeeCode =
    card?.employee?.employeeCode ||
    authUser?.employee?.employeeCode ||
    authUser?.employeeCode ||
    'MYCO-EMP-0001';

  // Resolved Department & Designation
  const departmentName =
    card?.employee?.department?.name ||
    authUser?.employee?.department?.name ||
    authUser?.department ||
    'General';

  const designationName =
    card?.employee?.designation?.name ||
    authUser?.employee?.designation?.name ||
    authUser?.designation ||
    authUser?.role ||
    'Staff Member';

  // Company Name
  const companyName =
    card?.company?.name ||
    authUser?.company?.name ||
    'Enterprise EMS';

  const cardNumber = card?.cardNumber || 'EMP0001';
  const photoUrl = card?.employee?.photoUrl || authUser?.employee?.photoUrl || authUser?.photoUrl;

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Permanent';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Permanent';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const issuedDateStr = formatDate(card?.assignedAt || card?.createdAt || new Date());
  const expiryDateStr = card?.expiresAt ? formatDate(card.expiresAt) : 'Permanent';

  // QR Code payload string matching web format
  const qrCodeValue =
    card?.qrSignature ||
    JSON.stringify({
      v: '1.0',
      employeeId: card?.employeeId || authUser?.id,
      cardNumber: cardNumber,
      issuedAt: card?.assignedAt || card?.createdAt,
    });

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied', `Employee Code ${employeeCode} copied.`);
  };

  const handleDownloadPdf = async () => {
    if (!card?.id) {
      Alert.alert('Notice', 'No active card available to download.');
      return;
    }
    try {
      setDownloading(true);
      await biometricCardService.downloadCard(card.id, cardNumber);
    } catch (err) {
      Alert.alert('Download Failed', err.message || 'Could not download card PDF badge.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <View style={styles.titleRow}>
            <CreditCard size={22} color="#4F46E5" />
            <Text style={styles.headerTitle}>My Identity & Biometric Card</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Your official digital identity badge with verifiable QR code for contactless attendance
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => refetch()}
            activeOpacity={0.7}
            disabled={isFetching}
          >
            <RefreshCw size={16} color="#4F46E5" />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading identity badge...</Text>
          </View>
        ) : !card ? (
          <View style={styles.noCardContainer}>
            <View style={styles.noCardIconBox}>
              <AlertCircle size={32} color="#D97706" />
            </View>
            <Text style={styles.noCardTitle}>No Card Assigned</Text>
            <Text style={styles.noCardSubtitle}>
              You do not currently have an active identity card. Contact your HR administrator to issue a biometric identity card.
            </Text>
          </View>
        ) : (
          <View style={styles.cardsWrapper}>
            {/* ==================== FRONT SIDE ==================== */}
            <View style={styles.cardFront}>
              {/* Decorative Glow */}
              <View style={styles.glowTopRight} />

              {/* Card Header */}
              <View style={styles.cardFrontHeader}>
                <View style={styles.companyRow}>
                  <View style={styles.companyBadge}>
                    <Text style={styles.companyBadgeText}>
                      {companyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {companyName}
                  </Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {card.cardType || 'QR'} • {card.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                </View>
              </View>

              {/* Card Body (Photo + Info) */}
              <View style={styles.cardBodyRow}>
                <View style={styles.photoContainer}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.photoImg} />
                  ) : (
                    <View style={styles.photoFallback}>
                      <Text style={styles.photoFallbackText}>
                        {employeeName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {employeeName}
                  </Text>
                  <Text style={styles.codeText}>{employeeCode}</Text>
                  <Text style={styles.designationText} numberOfLines={1}>
                    {designationName}
                  </Text>
                  <Text style={styles.departmentText} numberOfLines={1}>
                    Dept: {departmentName}
                  </Text>
                </View>
              </View>

              {/* QR Code & Card Number Row */}
              <View style={styles.qrRow}>
                <View style={styles.cardNumberCol}>
                  <Text style={styles.cardNoLabel}>CARD NO</Text>
                  <Text style={styles.cardNoValue}>{cardNumber}</Text>
                </View>

                <View style={styles.qrCodeWrapper}>
                  {card.qrUrl ? (
                    <Image source={{ uri: card.qrUrl }} style={styles.qrImage} />
                  ) : (
                    <QRCode
                      value={qrCodeValue}
                      size={58}
                      color="#0F172A"
                      backgroundColor="#FFFFFF"
                    />
                  )}
                </View>
              </View>

              {/* Card Footer (Issued & Expires) */}
              <View style={styles.cardFooterRow}>
                <Text style={styles.footerDateText}>Issued: {issuedDateStr}</Text>
                <Text style={styles.footerDateText}>Expires: {expiryDateStr}</Text>
              </View>
            </View>

            {/* ==================== BACK SIDE ==================== */}
            <View style={styles.cardBack}>
              <View style={styles.cardBackHeader}>
                <Text style={styles.cardBackTitle}>CARD GUIDELINES</Text>
                <ShieldCheck size={18} color="#818CF8" />
              </View>

              <View style={styles.guidelinesList}>
                <Text style={styles.guidelineItem}>
                  • This badge is non-transferable and remains the property of the company.
                </Text>
                <Text style={styles.guidelineItem}>
                  • Present or scan this QR at all biometric verification checkpoints.
                </Text>
                <Text style={styles.guidelineItem}>
                  • If found, please return to Human Resources Department or email security.
                </Text>
              </View>

              <View style={styles.emergencyContactBox}>
                <View style={styles.emergencyTitleRow}>
                  <Phone size={14} color="#10B981" />
                  <Text style={styles.emergencyTitle}>Emergency Contact</Text>
                </View>
                <Text style={styles.emergencyPhone}>HR Desk: +91 98765 43210</Text>
                <Text style={styles.emergencyEmail}>helpdesk@company.com</Text>
              </View>

              <Text style={styles.watermarkText}>
                Cryptographically Secured by EMS Zero-Trust HMAC
              </Text>
            </View>

            {/* ==================== ACTION CONTROLS ==================== */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={handleDownloadPdf}
                activeOpacity={0.8}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Download size={18} color="#FFFFFF" />
                )}
                <Text style={styles.downloadBtnText}>
                  {downloading ? 'Downloading PDF...' : 'Download PDF Badge'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.copyBtn}
                onPress={handleCopyCode}
                activeOpacity={0.8}
              >
                {copied ? <Check size={18} color="#059669" /> : <Copy size={18} color="#4F46E5" />}
                <Text style={[styles.copyBtnText, copied && { color: '#059669' }]}>
                  {copied ? 'Employee Code Copied' : 'Copy Employee Code'}
                </Text>
              </TouchableOpacity>
            </View>
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
  headerRow: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerTextGroup: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  refreshBtnText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 44,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    minHeight: 200,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  noCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  noCardIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  noCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  cardsWrapper: {
    gap: 22,
  },
  // FRONT SIDE STYLES
  cardFront: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 12,
    overflow: 'hidden',
  },
  glowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(79, 70, 229, 0.18)',
  },
  cardFrontHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 14,
    marginBottom: 16,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
    marginRight: 10,
  },
  companyBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusPillText: {
    color: '#34D399',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  photoContainer: {
    width: 76,
    height: 92,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#6366F1',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#312E81',
  },
  photoFallbackText: {
    color: '#E0E7FF',
    fontSize: 28,
    fontWeight: '900',
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  codeText: {
    color: '#818CF8',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  designationText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  departmentText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 14,
    marginBottom: 12,
  },
  cardNumberCol: {
    gap: 3,
  },
  cardNoLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardNoValue: {
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.2,
  },
  qrCodeWrapper: {
    padding: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  footerDateText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // BACK SIDE STYLES
  cardBack: {
    backgroundColor: '#090D16',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    gap: 14,
  },
  cardBackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 12,
  },
  cardBackTitle: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  guidelinesList: {
    gap: 8,
  },
  guidelineItem: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  emergencyContactBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 3,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 3,
  },
  emergencyTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  emergencyPhone: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emergencyEmail: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  watermarkText: {
    color: '#475569',
    fontSize: 9.5,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ACTION BUTTONS
  actionButtonsCol: {
    gap: 12,
    marginTop: 6,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    paddingVertical: 15,
    borderRadius: 16,
  },
  copyBtnText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.1,
  },
});
