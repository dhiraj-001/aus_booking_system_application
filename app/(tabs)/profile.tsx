import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Platform,
  KeyboardAvoidingView, Appearance, useColorScheme, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import { useAlert } from '@/hooks/AlertContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

const DEPARTMENTS = ["CSE", "ECE", "ME", "CE", "EE", "Maths", "Physics", "Chemistry", "HSS", "Administration"];

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  // Hero / brand
  heroTop: '#0F1729',
  heroBottom: '#1A2847',
  heroBorder: 'rgba(255,255,255,0.07)',

  // Surface
  bg: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FF',
  border: '#E4EAF6',

  // Primary
  primary: '#4056E8',
  primaryLight: '#EEF1FE',
  primaryMid: '#C7CEF9',

  // Accent / semantic
  accent: '#12B981',
  accentLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',
  danger: '#EF4444',
  dangerLight: '#FFF1F1',

  // Text
  text: '#0E1B3D',
  textSub: '#5A6A8A',
  textMuted: '#9BA8C3',
  textOnDark: '#FFFFFF',
  textOnDarkSub: 'rgba(255,255,255,0.6)',

  white: '#FFFFFF',
  shadow: '#1E3A8A',
};

// Role chip colors
const ROLE_PALETTE: Record<string, { bg: string; text: string; border: string }> = {
  Admin:     { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  HOD:       { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  Registrar: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  Teacher:   { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' },
  Student:   { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  Guest:     { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
};

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function Separator() {
  return <View style={styles.separator} />;
}

function InfoRow({
  label, value, mono, dim, warn, children
}: { label: string; value?: string; mono?: boolean; dim?: boolean; warn?: boolean; children?: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {children ?? (
        <Text style={[
          styles.infoValue,
          mono && styles.infoValueMono,
          dim && styles.infoValueDim,
          warn && styles.infoValueWarn,
        ]}>
          {value}
        </Text>
      )}
    </View>
  );
}

function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon as any} size={15} color={C.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { showAlert } = useAlert();
  const colorScheme = useColorScheme();

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    uni_id: user?.uni_id || '',
    dept: user?.dept || '',
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordMethod, setPasswordMethod] = useState<'standard' | 'otp'>('standard');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  if (!user) return null;

  const isProfileIncomplete = !user.phone || (user.role !== 'Guest' && !user.dept);
  const canEditDept = user.role === 'Student' || user.role === 'Teacher';
  const roleStyle = ROLE_PALETTE[user.role] ?? ROLE_PALETTE.Guest;

  const handleChange = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }));

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/logout`, { method: 'GET' });
      if (res.ok) { setUser(null); router.replace('/(auth)/login'); }
      else Alert.alert('Logout Failed', 'Please try again.');
    } catch { Alert.alert('Error', 'Network error during logout.'); }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.uni_id) return Alert.alert('Error', 'Name and ID cannot be empty');
    if (!formData.phone) return Alert.alert('Error', 'Phone number is required for booking services');
    if (canEditDept && !formData.dept) return Alert.alert('Error', 'Please specify your department');
    setIsUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (res.ok && data.success) { Alert.alert('Success', 'Profile updated'); setUser(data.user); setIsEditing(false); }
      else Alert.alert('Error', data.message || 'Failed to update profile');
    } catch { Alert.alert('Error', 'Network error'); }
    finally { setIsUpdating(false); }
  };

  const resetPasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordMethod('standard');
    setOtpSent(false);
    setOtpValue('');
  };

  const handleStandardPasswordChange = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword)
      return showAlert('Error', 'Please fill all password fields', undefined, 'error');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showAlert('Error', 'Passwords do not match', undefined, 'error');
    if (passwordForm.newPassword.length < 6) return showAlert('Error', 'Minimum 6 characters', undefined, 'error');
    setIsChangingPassword(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }) });
      const data = await res.json();
      if (res.ok && data.success) { showAlert('Success', 'Password changed!', undefined, 'success'); resetPasswordModal(); }
      else showAlert('Error', data.message || 'Failed to change password', undefined, 'error');
    } catch { showAlert('Error', 'Network error', undefined, 'error'); }
    finally { setIsChangingPassword(false); }
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });
      const data = await res.json();
      if (res.ok) { showAlert('OTP Sent', 'Check your email', undefined, 'success'); setOtpSent(true); }
      else showAlert('Error', data.message || 'Failed to send OTP', undefined, 'error');
    } catch { showAlert('Error', 'Network error', undefined, 'error'); }
    finally { setIsSendingOtp(false); }
  };

  const handleOtpSubmit = async () => {
    if (otpValue.length < 6) return showAlert('Error', 'Enter the complete OTP', undefined, 'error');
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) return showAlert('Error', 'Fill all fields', undefined, 'error');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return showAlert('Error', 'Passwords do not match', undefined, 'error');
    if (passwordForm.newPassword.length < 6) return showAlert('Error', 'Minimum 6 characters', undefined, 'error');
    setIsChangingPassword(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, otp: otpValue, newPassword: passwordForm.newPassword }) });
      const data = await res.json();
      if (res.ok) { showAlert('Success', 'Password reset via OTP!', undefined, 'success'); resetPasswordModal(); }
      else showAlert('Error', data.message || 'Invalid or expired OTP', undefined, 'error');
    } catch { showAlert('Error', 'Network error', undefined, 'error'); }
    finally { setIsChangingPassword(false); }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.heroTop }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.heroTop} />

      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ───────────────────────────────── */}
        <View style={styles.hero}>
          {/* Decorative rings */}
          <View style={styles.heroRing1} />
          <View style={styles.heroRing2} />

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            {user.isVerified && (
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={10} color={C.white} />
              </View>
            )}
          </View>

          {/* Name / email */}
          {isEditing ? (
            <TextInput
              style={styles.heroNameInput}
              value={formData.name}
              onChangeText={t => handleChange('name', t)}
              placeholder="Full Name"
              placeholderTextColor="rgba(255,255,255,0.35)"
              selectionColor={C.primaryMid}
            />
          ) : (
            <Text style={styles.heroName}>{user.name}</Text>
          )}
          <Text style={styles.heroEmail}>{user.email}</Text>

          {/* Badges */}
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroBadge, { borderColor: roleStyle.border + '80' }]}>
              <Ionicons name="shield-checkmark" size={11} color={roleStyle.text} />
              <Text style={[styles.heroBadgeText, { color: roleStyle.text }]}>{user.role}</Text>
            </View>
            {user.isVerified && (
              <View style={[styles.heroBadge, { borderColor: C.accent + '60' }]}>
                <Ionicons name="ribbon" size={11} color={C.accent} />
                <Text style={[styles.heroBadgeText, { color: C.accent }]}>Verified</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.heroActions}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.heroBtnPrimary} onPress={handleUpdateProfile} disabled={isUpdating} activeOpacity={0.85}>
                  {isUpdating ? <ActivityIndicator size="small" color={C.white} /> : (
                    <><Ionicons name="checkmark-circle" size={16} color={C.white} /><Text style={styles.heroBtnPrimaryText}>Save Changes</Text></>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroBtnGhost} onPress={() => { setIsEditing(false); setFormData({ name: user.name, phone: user.phone || '', uni_id: user.uni_id, dept: user.dept || '' }); }} disabled={isUpdating} activeOpacity={0.7}>
                  <Text style={styles.heroBtnGhostText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => setIsEditing(true)} activeOpacity={0.85}>
                  <Ionicons name="pencil" size={15} color={C.white} />
                  <Text style={styles.heroBtnPrimaryText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroBtnDanger} onPress={handleLogout} activeOpacity={0.85}>
                  <Ionicons name="log-out-outline" size={15} color={C.danger} />
                  <Text style={styles.heroBtnDangerText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── Incomplete Warning ──────────────────────── */}
        {isProfileIncomplete && (
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Ionicons name="alert" size={18} color={C.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Action Required</Text>
              <Text style={styles.warningDesc}>
                Provide a phone number{user.role !== 'Guest' && ' and department'} to access booking services.
              </Text>
            </View>
            {!isEditing && (
              <TouchableOpacity style={styles.warningFixBtn} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
                <Text style={styles.warningFixText}>Fix Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Personal Info ────────────────────────────── */}
        <SectionCard icon="person-outline" title="Personal Information">
          <InfoRow label="Full Name">
            {isEditing
              ? <TextInput style={styles.inlineEdit} value={formData.name} onChangeText={t => handleChange('name', t)} placeholderTextColor={C.textMuted} />
              : <Text style={styles.infoValue}>{user.name}</Text>}
          </InfoRow>
          <Separator />
          <InfoRow label="Phone">
            {isEditing
              ? <TextInput style={[styles.inlineEdit, !formData.phone && { borderBottomColor: C.warning }]} value={formData.phone} onChangeText={t => handleChange('phone', t)} keyboardType="phone-pad" placeholder="+91…" placeholderTextColor={C.textMuted} />
              : <Text style={[styles.infoValue, !user.phone && styles.infoValueWarn]}>{user.phone || 'Required for booking'}</Text>}
          </InfoRow>
          <Separator />
          <InfoRow label="Security">
            <TouchableOpacity style={styles.pillBtn} onPress={() => setIsPasswordModalOpen(true)} activeOpacity={0.75}>
              <Ionicons name="key-outline" size={13} color={C.primary} />
              <Text style={styles.pillBtnText}>Change Password</Text>
            </TouchableOpacity>
          </InfoRow>
          <Separator />
          <InfoRow label="Appearance">
            <TouchableOpacity style={styles.pillBtn} onPress={() => Appearance.setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')} activeOpacity={0.75}>
              <Ionicons name={colorScheme === 'dark' ? 'moon-outline' : 'sunny-outline'} size={13} color={C.primary} />
              <Text style={styles.pillBtnText}>{colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
            </TouchableOpacity>
          </InfoRow>
        </SectionCard>

        {/* ── Academic / Guest Details ─────────────────── */}
        <SectionCard icon={user.role === 'Guest' ? 'briefcase-outline' : 'school-outline'} title={user.role === 'Guest' ? 'Guest Details' : 'Academic Details'}>
          <InfoRow label="ID Number">
            {isEditing
              ? <TextInput style={styles.inlineEdit} value={formData.uni_id} onChangeText={t => handleChange('uni_id', t)} placeholderTextColor={C.textMuted} />
              : <Text style={styles.infoValueMono}>{user.uni_id}</Text>}
          </InfoRow>

          {user.role !== 'Guest' && (
            <>
              <Separator />
              <InfoRow label="Department">
                {isEditing ? (
                  canEditDept ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 10 }}>
                      {DEPARTMENTS.map(d => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.deptChip, formData.dept === d && styles.deptChipActive]}
                          onPress={() => handleChange('dept', d)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.deptChipText, formData.dept === d && styles.deptChipTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoValueDim}>{user.dept || 'Not Assigned'}</Text>
                  )
                ) : (
                  <Text style={[styles.infoValue, !user.dept && styles.infoValueWarn]}>{user.dept || 'Required for booking'}</Text>
                )}
              </InfoRow>
            </>
          )}

          <Separator />
          <InfoRow label="Clearance">
            <View style={[styles.rolePill, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
              <Text style={[styles.rolePillText, { color: roleStyle.text }]}>{user.role}</Text>
            </View>
          </InfoRow>
        </SectionCard>

        {/* ── Help & Support ───────────────────────────── */}
        <SectionCard icon="help-buoy-outline" title="Help & Support">
          <InfoRow label="Contact Us">
            <TouchableOpacity style={styles.pillBtn} onPress={() => router.push('/support')} activeOpacity={0.75}>
              <Ionicons name="arrow-forward-circle-outline" size={13} color={C.primary} />
              <Text style={styles.pillBtnText}>View Details</Text>
            </TouchableOpacity>
          </InfoRow>
        </SectionCard>

        </ScrollView>
      </View>

      {/* ── Password Modal ───────────────────────────────────────────────────── */}
      <Modal visible={isPasswordModalOpen} animationType="slide" transparent onRequestClose={resetPasswordModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>

            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Title row */}
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleIcon}>
                <Ionicons name="lock-closed" size={18} color={C.primary} />
              </View>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={resetPasswordModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color={C.textSub} />
              </TouchableOpacity>
            </View>

            {/* Method tabs */}
            <View style={styles.modalTabs}>
              {(['standard', 'otp'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modalTab, passwordMethod === m && styles.modalTabActive]}
                  onPress={() => setPasswordMethod(m)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={m === 'standard' ? 'key-outline' : 'mail-outline'}
                    size={13}
                    color={passwordMethod === m ? C.primary : C.textMuted}
                  />
                  <Text style={[styles.modalTabText, passwordMethod === m && styles.modalTabTextActive]}>
                    {m === 'standard' ? 'Current Password' : 'Verify via OTP'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {passwordMethod === 'standard' ? (
                <View>
                  <ModalInput label="Current Password" secure value={passwordForm.oldPassword} onChange={t => setPasswordForm(p => ({ ...p, oldPassword: t }))} />
                  <ModalInput label="New Password" secure value={passwordForm.newPassword} onChange={t => setPasswordForm(p => ({ ...p, newPassword: t }))} />
                  <ModalInput label="Confirm New Password" secure value={passwordForm.confirmPassword} onChange={t => setPasswordForm(p => ({ ...p, confirmPassword: t }))} />

                  <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={resetPasswordModal}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleStandardPasswordChange} disabled={isChangingPassword} activeOpacity={0.85}>
                      {isChangingPassword ? <ActivityIndicator size="small" color={C.white} /> : <Text style={styles.modalSubmitText}>Update Password</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : !otpSent ? (
                <View style={styles.otpPromptWrap}>
                  <View style={styles.otpMailIcon}>
                    <Ionicons name="mail" size={28} color={C.primary} />
                  </View>
                  <Text style={styles.otpPromptTitle}>Forgot your password?</Text>
                  <Text style={styles.otpPromptDesc}>We'll send a 6-digit code to {'\n'}<Text style={{ color: C.primary, fontWeight: '700' }}>{user.email}</Text></Text>

                  <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSendOtp} disabled={isSendingOtp} activeOpacity={0.85}>
                    {isSendingOtp ? <ActivityIndicator color={C.white} /> : (
                      <><Ionicons name="send" size={15} color={C.white} /><Text style={styles.modalSubmitText}>Send OTP</Text></>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalCancelBtn, { marginTop: 10, width: '100%', alignItems: 'center' }]} onPress={resetPasswordModal}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <ModalInput label="6-Digit OTP" keyboard="number-pad" maxLength={6} value={otpValue} onChange={setOtpValue} placeholder="123456" />
                  <ModalInput label="New Password" secure value={passwordForm.newPassword} onChange={t => setPasswordForm(p => ({ ...p, newPassword: t }))} />
                  <ModalInput label="Confirm New Password" secure value={passwordForm.confirmPassword} onChange={t => setPasswordForm(p => ({ ...p, confirmPassword: t }))} />
                  <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={resetPasswordModal}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: C.accent }]} onPress={handleOtpSubmit} disabled={isChangingPassword || otpValue.length < 6} activeOpacity={0.85}>
                      {isChangingPassword ? <ActivityIndicator size="small" color={C.white} /> : <Text style={styles.modalSubmitText}>Verify & Update</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Modal Input helper ────────────────────────────────────────────────────────
function ModalInput({ label, secure, value, onChange, keyboard, maxLength, placeholder }: {
  label: string; secure?: boolean; value: string; onChange: (t: string) => void;
  keyboard?: any; maxLength?: number; placeholder?: string;
}) {
  const [isSecure, setIsSecure] = useState(!!secure);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.modalInputLabel}>{label.toUpperCase()}</Text>
      <View style={{ position: 'relative' }}>
        <TextInput
          style={[styles.modalInput, secure && { paddingRight: 40 }]}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          autoCapitalize="none"
        />
        {secure && (
          <TouchableOpacity
            style={{ position: 'absolute', right: 12, top: 10, zIndex: 10, padding: 2 }}
            onPress={() => setIsSecure(!isSecure)}
            activeOpacity={0.7}
          >
            <Ionicons name={isSecure ? 'eye-off' : 'eye'} size={20} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 120 },

  // ── Hero
  hero: {
    backgroundColor: C.heroTop,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    // bottom curves
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  heroRing1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1, borderColor: C.heroBorder,
    top: -60, right: -60,
  },
  heroRing2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1, borderColor: C.heroBorder,
    bottom: -40, left: -40,
  },

  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.white },
  verifiedDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.accent, borderWidth: 2, borderColor: C.heroTop,
    alignItems: 'center', justifyContent: 'center',
  },

  heroName: { fontSize: 22, fontWeight: '800', color: C.textOnDark, marginBottom: 4, textAlign: 'center' },
  heroNameInput: {
    fontSize: 22, fontWeight: '800', color: C.textOnDark, textAlign: 'center',
    borderBottomWidth: 1.5, borderBottomColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 2, marginBottom: 4, minWidth: 200,
  },
  heroEmail: { fontSize: 13, color: C.textOnDarkSub, marginBottom: 14 },

  heroBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },

  heroActions: { flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center' },
  heroBtnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: C.primary,
    paddingVertical: 12, borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  heroBtnPrimaryText: { color: C.white, fontWeight: '700', fontSize: 14 },
  heroBtnGhost: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroBtnGhostText: { color: C.textOnDarkSub, fontWeight: '700', fontSize: 14 },
  heroBtnDanger: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
    backgroundColor: C.dangerLight,
    borderWidth: 1, borderColor: '#FECACA',
  },
  heroBtnDangerText: { color: C.danger, fontWeight: '700', fontSize: 14 },

  // ── Warning
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.warningLight, borderWidth: 1, borderColor: C.warningBorder,
    borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 16,
  },
  warningIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: C.warningBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  warningTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  warningDesc: { fontSize: 12, color: '#B45309', marginTop: 2, lineHeight: 16 },
  warningFixBtn: {
    backgroundColor: C.warning, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8,
    ...Platform.select({ ios: { shadowColor: C.warning, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 }, android: { elevation: 3 } }),
  },
  warningFixText: { fontSize: 12, fontWeight: '800', color: C.white },

  // ── Section Card
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    marginHorizontal: 16, marginBottom: 14, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surfaceAlt, paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: C.text, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Info Row
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, minHeight: 52,
  },
  infoLabel: { width: 110, fontSize: 13, color: C.textSub, fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 14, color: C.text, fontWeight: '600' },
  infoValueMono: { flex: 1, fontSize: 14, color: C.text, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  infoValueDim: { flex: 1, fontSize: 14, color: C.textMuted, fontStyle: 'italic' },
  infoValueWarn: { color: C.warning },
  separator: { height: 1, backgroundColor: C.border, marginLeft: 16 },

  inlineEdit: {
    flex: 1, fontSize: 14, color: C.text, fontWeight: '600',
    borderBottomWidth: 1.5, borderBottomColor: C.primaryMid,
    paddingVertical: 2, paddingHorizontal: 2,
  },

  // ── Pill Button (inline actions)
  pillBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: C.primaryMid,
    backgroundColor: C.primaryLight,
  },
  pillBtnText: { fontSize: 12, fontWeight: '700', color: C.primary },

  // ── Role pill
  rolePill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  rolePillText: { fontSize: 12, fontWeight: '700' },

  // ── Dept Chips
  deptChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: C.surfaceAlt, marginRight: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  deptChipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  deptChipText: { fontSize: 12, color: C.textSub, fontWeight: '500' },
  deptChipTextActive: { color: C.primary, fontWeight: '700' },

  // ── Field label (editing forms)
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  // ── Password Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,35,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '88%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },

  modalTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalTitleIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: C.text },
  modalCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },

  modalTabs: {
    flexDirection: 'row', margin: 16, padding: 4,
    backgroundColor: C.surfaceAlt, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  modalTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 9 },
  modalTabActive: {
    backgroundColor: C.surface,
    ...Platform.select({ ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }, android: { elevation: 2 } }),
  },
  modalTabText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  modalTabTextActive: { color: C.primary, fontWeight: '700' },

  modalBody: { paddingHorizontal: 20, paddingTop: 8 },

  modalInputLabel: { fontSize: 10, fontWeight: '800', color: C.textSub, letterSpacing: 0.8, marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: C.text, backgroundColor: C.surfaceAlt,
  },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20, marginBottom: 4 },
  modalCancelBtn: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10 },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: C.textSub },
  modalSubmitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primary, paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10,
    ...Platform.select({ ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 }, android: { elevation: 5 } }),
  },
  modalSubmitText: { fontSize: 14, fontWeight: '800', color: C.white },

  // ── OTP Prompt
  otpPromptWrap: { alignItems: 'center', paddingVertical: 20, gap: 8, width: '100%' },
  otpMailIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: C.primaryLight, borderWidth: 1.5, borderColor: C.primaryMid,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  otpPromptTitle: { fontSize: 17, fontWeight: '800', color: C.text, textAlign: 'center' },
  otpPromptDesc: { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
});