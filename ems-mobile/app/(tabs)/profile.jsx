import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { storage } from '../../utils/storage.js';
import { employeeService } from '../../services/employee.service';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  ShieldCheck,
  Save,
  Camera,
  Trash2,
  Key,
  LogOut,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, refreshUser, logout, isLoading: authLoading } = useAuth();

  const userRoles = user?.roles || (user?.role ? [user.role] : ['EMPLOYEE']);
  const isEmployee =
    userRoles.includes('EMPLOYEE') &&
    !userRoles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(r)
    );

  const emp = user?.employee || user;
  const fullName =
    user?.name ||
    (emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : '') ||
    user?.email?.split('@')[0] ||
    'User';

  const [formData, setFormData] = useState({
    name: fullName,
    email: user?.email || '',
    phone: emp?.phone || user?.phone || '',
    department:
      typeof emp?.department === 'object'
        ? emp?.department?.name || 'Operations'
        : emp?.department || 'Operations',
    designation:
      typeof emp?.designation === 'object'
        ? emp?.designation?.name || user?.role || 'Staff'
        : emp?.designation || user?.role || 'Staff',
    joiningDate: emp?.joiningDate
      ? new Date(emp.joiningDate).toISOString().split('T')[0]
      : '2024-01-01',
    emergencyContact: emp?.emergencyContact || emp?.emergencyContactPhone || '',
    employeeCode: emp?.employeeCode || user?.employeeCode || '#EMP001',
  });

  const [photoUrl, setPhotoUrl] = useState(
    user?.photoUrl || emp?.photoUrl || null
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const syncProfileData = useCallback((userData) => {
    if (!userData) return;
    const currentEmp = userData.employee || userData;
    const currentName =
      userData.name ||
      (currentEmp ? `${currentEmp.firstName || ''} ${currentEmp.lastName || ''}`.trim() : '') ||
      userData.email?.split('@')[0] ||
      'User';

    setFormData({
      name: currentName,
      email: userData.email || '',
      phone: currentEmp.phone || userData.phone || '',
      department:
        typeof currentEmp.department === 'object'
          ? currentEmp.department?.name || 'Operations'
          : currentEmp.department || 'Operations',
      designation:
        typeof currentEmp.designation === 'object'
          ? currentEmp.designation?.name || userData.role || 'Staff'
          : currentEmp.designation || userData.role || 'Staff',
      joiningDate: currentEmp.joiningDate
        ? new Date(currentEmp.joiningDate).toISOString().split('T')[0]
        : '2024-01-01',
      emergencyContact: currentEmp.emergencyContact || currentEmp.emergencyContactPhone || '',
      employeeCode: currentEmp.employeeCode || userData.employeeCode || '#EMP001',
    });

    const activePhoto = userData.photoUrl || currentEmp.photoUrl || null;
    setPhotoUrl(activePhoto);
  }, []);

  const loadFreshProfile = useCallback(async () => {
    try {
      const freshUser = await refreshUser?.();
      if (freshUser) {
        syncProfileData(freshUser);
      } else {
        // Fallback to fetching photo directly
        const photoRes = await employeeService.getMyPhoto().catch(() => null);
        if (photoRes?.photoUrl) {
          setPhotoUrl(photoRes.photoUrl);
        }
      }
    } catch (e) {
      console.warn('[PROFILE] Error loading fresh profile:', e.message);
    }
  }, [refreshUser, syncProfileData]);

  const hasLoadedRef = React.useRef(false);

  useEffect(() => {
    syncProfileData(user);
  }, [user, syncProfileData]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadFreshProfile();
  }, [loadFreshProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFreshProfile();
    setRefreshing(false);
  };

  const handleSave = async () => {
    setIsSavingProfile(true);
    try {
      const payload = {
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
        emergencyContactPhone: formData.emergencyContact,
      };
      if (!isEmployee) {
        payload.name = formData.name;
      }

      await employeeService.updateMyProfile(payload);

      const updatedUser = {
        ...user,
        phone: formData.phone,
        emergencyContact: formData.emergencyContact,
        employee: {
          ...(user?.employee || {}),
          phone: formData.phone,
          emergencyContact: formData.emergencyContact,
          emergencyContactPhone: formData.emergencyContact,
        },
      };

      setUser(updatedUser);
      await storage.setItem('user', updatedUser);
      Alert.alert('Success', 'Profile details updated successfully!');
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Failed to save profile changes'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await employeeService.deleteMyPhoto();
              setPhotoUrl(null);
              const updatedUser = {
                ...user,
                photoUrl: null,
                employee: {
                  ...(user?.employee || {}),
                  photoUrl: null,
                },
              };
              setUser(updatedUser);
              await storage.setItem('user', updatedUser);
              Alert.alert('Success', 'Profile photo removed.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to remove photo');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const displayPhoto = photoUrl || user?.photoUrl || user?.employee?.photoUrl || null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTextGroup}>
            <View style={styles.titleRow}>
              <User size={22} color="#4F46E5" />
              <Text style={styles.headerTitle}>My Profile & Information</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Manage your personal details, profile photo, and security preferences.
            </Text>
          </View>

          {/* Quick Security Actions */}
          <View style={styles.securityActionsRow}>
            <TouchableOpacity
              style={styles.securityButton}
              activeOpacity={0.7}
              onPress={() => router.push('/profile/change-password')}
            >
              <Key size={14} color="#64748B" />
              <Text style={styles.securityButtonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.securityButton}
              activeOpacity={0.7}
              onPress={() => router.push('/profile/two-factor')}
            >
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.securityButtonText}>2FA Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Hero & Photo Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.avatarWrapper}>
              {displayPhoto ? (
                <Image
                  source={{ uri: displayPhoto }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {formData.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>{formData.name}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {(user?.role || userRoles[0] || 'EMPLOYEE').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroSubtitle}>
                {formData.designation} • {formData.department}
              </Text>
              <Text style={styles.heroCode}>
                Employee Code: <Text style={styles.heroCodeValue}>{formData.employeeCode}</Text>
              </Text>
            </View>
          </View>

          {/* Photo Actions */}
          {displayPhoto ? (
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={handleRemovePhoto}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color="#EF4444" />
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Profile Details Form */}
        <View style={styles.formCard}>
          {/* Section 1: Personal & Contact Details */}
          <Text style={styles.sectionHeader}>Personal & Contact Details</Text>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={[styles.inputWrapper, isEmployee && styles.disabledInputWrapper]}>
              <User size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isEmployee && styles.disabledInput]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={!isEmployee}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Mail size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.email}
                editable={false}
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+91 98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Emergency Contact</Text>
            <View style={styles.inputWrapper}>
              <Phone size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formData.emergencyContact}
                onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
                placeholder="+91 91234 56780"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Section 2: Work & Organization Info */}
          <Text style={[styles.sectionHeader, styles.sectionHeaderWork]}>
            Work & Organization Info
          </Text>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Employee Code</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Briefcase size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.employeeCode}
                editable={false}
                placeholder="Employee Code"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Department</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Building size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.department}
                editable={false}
                placeholder="Department"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Designation</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Briefcase size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.designation}
                editable={false}
                placeholder="Designation"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputField}>
            <Text style={styles.fieldLabel}>Joining Date</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Calendar size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.joiningDate}
                editable={false}
                placeholder="Joining Date"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSavingProfile}
            activeOpacity={0.8}
          >
            {isSavingProfile ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Profile Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={authLoading}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 4,
  },
  headerTextGroup: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
  },
  securityActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  securityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4F46E5',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#4F46E5',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroDetails: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  heroCode: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  heroCodeValue: {
    fontWeight: '700',
    color: '#334155',
  },
  photoActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 14,
  },
  sectionHeaderWork: {
    marginTop: 18,
  },
  inputField: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  disabledInputWrapper: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  disabledInput: {
    color: '#64748B',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
