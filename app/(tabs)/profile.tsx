import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, Modal, Platform, KeyboardAvoidingView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

const DEPARTMENTS = [
  "CSE", "ECE", "ME", "CE", "EE", "Maths", "Physics", "Chemistry", "HSS", "Administration"
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    uni_id: user?.uni_id || "",
    dept: user?.dept || "",
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordMethod, setPasswordMethod] = useState<'standard' | 'otp'>('standard');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  if (!user) return null;

  const isProfileIncomplete = !user.phone || (user.role !== "Guest" && !user.dept);
  const canEditDept = user.role === "Student" || user.role === "Teacher";

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/logout`, {
        method: "POST",
      });
      if (response.ok) {
        setUser(null);
        router.replace('/(auth)/login');
      } else {
        Alert.alert("Logout Failed", "Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error during logout.");
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return { bg: '#FEE2E2', text: '#B91C1C' }; // red
      case "HOD": 
      case "Registrar": return { bg: '#E0E7FF', text: '#4338CA' }; // indigo
      case "Teacher": return { bg: '#F3E8FF', text: '#7E22CE' }; // purple
      case "Student": return { bg: '#DBEAFE', text: '#1D4ED8' }; // blue
      default: return { bg: '#F1F5F9', text: '#475569' }; // slate
    }
  };

  const roleStyles = getRoleColor(user.role);

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateProfile = async () => {
    if (!formData.name || !formData.uni_id) {
      Alert.alert("Error", "Name and ID cannot be empty");
      return;
    }
    
    if (!formData.phone) {
      Alert.alert("Error", "Phone number is required for booking services");
      return;
    }

    if (canEditDept && !formData.dept) {
      Alert.alert("Error", "Please specify your department");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert("Success", "Profile updated successfully");
        setUser(data.user);
        setIsEditing(false);
      } else {
        Alert.alert("Error", data.message || "Failed to update profile");
      }
    } catch (error) {
      Alert.alert("Error", "Network error while updating profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const resetPasswordModalState = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordMethod("standard");
    setOtpSent(false);
    setOtpValue("");
  };

  const handleStandardPasswordChange = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return Alert.alert("Error", "Please fill in all password fields");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Alert.alert("Error", "New passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return Alert.alert("Error", "New password must be at least 6 characters long");
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert("Success", "Password changed successfully!");
        resetPasswordModalState();
      } else {
        Alert.alert("Error", data.message || "Failed to change password");
      }
    } catch (error) {
      Alert.alert("Error", "Network error while changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        Alert.alert("Success", "OTP sent to your email!");
        setOtpSent(true);
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Could not send OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpPasswordSubmit = async () => {
    if (otpValue.length < 6) return Alert.alert("Error", "Please enter the complete OTP");
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) return Alert.alert("Error", "Please fill all fields");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return Alert.alert("Error", "Passwords do not match");
    if (passwordForm.newPassword.length < 6) return Alert.alert("Error", "New password must be at least 6 characters long");

    setIsChangingPassword(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          otp: otpValue,
          newPassword: passwordForm.newPassword
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Password updated successfully via OTP!");
        resetPasswordModalState();
      } else {
        Alert.alert("Error", data.message || "Invalid or expired OTP");
      }
    } catch (err) {
      Alert.alert("Error", "Network error while resetting password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* PROFILE HEADER CARD */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
            <View style={styles.headerInfo}>
              {isEditing ? (
                <TextInput 
                  style={styles.editInputName}
                  value={formData.name}
                  onChangeText={(t) => handleChange('name', t)}
                  placeholder="Full Name"
                />
              ) : (
                <Text style={styles.userName}>{user.name}</Text>
              )}
              <Text style={styles.userEmail}>{user.email}</Text>
              
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: roleStyles.bg }]}>
                  <Ionicons name="shield-checkmark" size={12} color={roleStyles.text} style={styles.badgeIcon} />
                  <Text style={[styles.badgeText, { color: roleStyles.text }]}>{user.role}</Text>
                </View>
                {user.isVerified && (
                  <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.badgeText, { color: '#065F46' }]}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            {isEditing ? (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleUpdateProfile} disabled={isUpdating}>
                  {isUpdating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => {
                  setIsEditing(false);
                  setFormData({ name: user.name, phone: user.phone || "", uni_id: user.uni_id, dept: user.dept || "" });
                }} disabled={isUpdating}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={16} color="#4F46E5" />
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.logoutBtn]} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                  <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* INCOMPLETE PROFILE WARNING */}
        {isProfileIncomplete && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#D97706" />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Action Required</Text>
              <Text style={styles.warningDesc}>You must provide a phone number {user.role !== "Guest" && "and department "}to access booking services.</Text>
            </View>
            {!isEditing && (
              <TouchableOpacity style={styles.fixBtn} onPress={() => setIsEditing(true)}>
                <Text style={styles.fixBtnText}>Fix Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* INFO CARDS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#64748B" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            {isEditing ? (
              <TextInput style={styles.editInput} value={formData.name} onChangeText={(t) => handleChange('name', t)} />
            ) : (
              <Text style={styles.infoValue}>{user.name}</Text>
            )}
          </View>
          <View style={styles.separator} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            {isEditing ? (
              <TextInput 
                style={[styles.editInput, !formData.phone && styles.inputError]} 
                value={formData.phone} 
                onChangeText={(t) => handleChange('phone', t)} 
                keyboardType="phone-pad"
                placeholder="+91..."
              />
            ) : (
              <Text style={[styles.infoValue, !user.phone && styles.errorText]}>{user.phone || "Required for booking"}</Text>
            )}
          </View>
          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Ionicons name="lock-closed-outline" size={16} color="#64748B" style={{marginRight: 4}} />
              <Text style={styles.infoLabel}>Security</Text>
            </View>
            <TouchableOpacity style={styles.changePwdBtn} onPress={() => setIsPasswordModalOpen(true)}>
              <Text style={styles.changePwdBtnText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name={user.role === 'Guest' ? 'briefcase-outline' : 'school-outline'} size={20} color="#64748B" />
            <Text style={styles.sectionTitle}>{user.role === 'Guest' ? 'Guest Details' : 'Academic Details'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Number</Text>
            {isEditing ? (
              <TextInput style={styles.editInput} value={formData.uni_id} onChangeText={(t) => handleChange('uni_id', t)} />
            ) : (
              <Text style={styles.infoValueMono}>{user.uni_id}</Text>
            )}
          </View>
          <View style={styles.separator} />
          
          {user.role !== "Guest" && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Department</Text>
                {isEditing ? (
                  canEditDept ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flex: 1, marginLeft: 10}}>
                      {DEPARTMENTS.map(dept => (
                        <TouchableOpacity 
                          key={dept} 
                          style={[styles.deptChip, formData.dept === dept && styles.deptChipActive]}
                          onPress={() => handleChange('dept', dept)}
                        >
                          <Text style={[styles.deptChipText, formData.dept === dept && styles.deptChipTextActive]}>{dept}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.infoValueLight}>{user.dept || "Not Assigned"}</Text>
                  )
                ) : (
                  <Text style={[styles.infoValue, !user.dept && styles.errorText]}>{user.dept || "Required for booking"}</Text>
                )}
              </View>
              <View style={styles.separator} />
            </>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Clearance</Text>
            <Text style={styles.infoValueBold}>{user.role}</Text>
          </View>
        </View>
        
        {/* PASSWORD MODAL */}
        <Modal
          visible={isPasswordModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={resetPasswordModalState}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="lock-closed" size={24} color="#4F46E5" />
                <Text style={styles.modalTitle}>Change Password</Text>
              </View>
              
              <View style={styles.modalTabs}>
                <TouchableOpacity 
                  style={[styles.modalTab, passwordMethod === 'standard' && styles.modalTabActive]}
                  onPress={() => setPasswordMethod('standard')}
                >
                  <Text style={[styles.modalTabText, passwordMethod === 'standard' && styles.modalTabTextActive]}>Current Password</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalTab, passwordMethod === 'otp' && styles.modalTabActive]}
                  onPress={() => setPasswordMethod('otp')}
                >
                  <Text style={[styles.modalTabText, passwordMethod === 'otp' && styles.modalTabTextActive]}>Verify via OTP</Text>
                </TouchableOpacity>
              </View>

              {passwordMethod === 'standard' ? (
                <View style={styles.modalBody}>
                  <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                  <TextInput style={styles.modalInput} secureTextEntry value={passwordForm.oldPassword} onChangeText={t => setPasswordForm({...passwordForm, oldPassword: t})} />
                  
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <TextInput style={styles.modalInput} secureTextEntry value={passwordForm.newPassword} onChangeText={t => setPasswordForm({...passwordForm, newPassword: t})} />
                  
                  <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                  <TextInput style={styles.modalInput} secureTextEntry value={passwordForm.confirmPassword} onChangeText={t => setPasswordForm({...passwordForm, confirmPassword: t})} />

                  <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.modalBtnCancel} onPress={resetPasswordModalState}>
                      <Text style={styles.modalBtnCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnSubmit} onPress={handleStandardPasswordChange} disabled={isChangingPassword}>
                      {isChangingPassword ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnSubmitText}>Update Password</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.modalBody}>
                  {!otpSent ? (
                    <View style={styles.otpPrompt}>
                      <Ionicons name="mail" size={40} color="#4F46E5" />
                      <Text style={styles.otpPromptTitle}>Forgot your current password?</Text>
                      <Text style={styles.otpPromptDesc}>We will send a 6-digit code to {user.email}</Text>
                      <TouchableOpacity style={styles.sendOtpBtn} onPress={handleSendOtp} disabled={isSendingOtp}>
                        {isSendingOtp ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendOtpBtnText}>Send OTP</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalBtnCancel, {marginTop: 12, width: '100%', alignItems: 'center'}]} onPress={resetPasswordModalState}>
                        <Text style={styles.modalBtnCancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{width: '100%'}}>
                      <Text style={styles.inputLabel}>ENTER 6-DIGIT OTP</Text>
                      <TextInput 
                        style={styles.modalInput} 
                        keyboardType="number-pad" 
                        maxLength={6} 
                        value={otpValue} 
                        onChangeText={setOtpValue} 
                        placeholder="123456" 
                      />

                      <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                      <TextInput style={styles.modalInput} secureTextEntry value={passwordForm.newPassword} onChangeText={t => setPasswordForm({...passwordForm, newPassword: t})} />
                      
                      <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                      <TextInput style={styles.modalInput} secureTextEntry value={passwordForm.confirmPassword} onChangeText={t => setPasswordForm({...passwordForm, confirmPassword: t})} />

                      <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.modalBtnCancel} onPress={resetPasswordModalState}>
                          <Text style={styles.modalBtnCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalBtnSubmit} onPress={handleOtpPasswordSubmit} disabled={isChangingPassword || otpValue.length < 6}>
                          {isChangingPassword ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnSubmitText}>Verify & Update</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9',
    borderWidth: 4, borderColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#475569' },
  headerInfo: { flex: 1 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  editInputName: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingVertical: 0, marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeIcon: { marginRight: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  editBtn: { borderColor: '#E0E7FF', backgroundColor: '#F5F8FF' },
  editBtnText: { color: '#4F46E5', fontWeight: '600', marginLeft: 6 },
  logoutBtn: { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  logoutBtnText: { color: '#EF4444', fontWeight: '600', marginLeft: 6 },
  saveBtn: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  saveBtnText: { color: '#FFF', fontWeight: '600' },
  cancelBtn: { borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  cancelBtnText: { color: '#64748B', fontWeight: '600' },

  warningBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
    borderWidth: 1, borderColor: '#FDE68A', padding: 16, borderRadius: 12, marginBottom: 16
  },
  warningTextContainer: { flex: 1, marginLeft: 12, marginRight: 8 },
  warningTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400E' },
  warningDesc: { fontSize: 12, color: '#B45309', marginTop: 2 },
  fixBtn: { borderWidth: 1, borderColor: '#FCD34D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#FEF3C7' },
  fixBtnText: { fontSize: 12, fontWeight: 'bold', color: '#92400E' },

  sectionCard: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden'
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginLeft: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16, minHeight: 60 },
  infoLabel: { width: 100, fontSize: 14, color: '#64748B', fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '600' },
  infoValueBold: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: 'bold' },
  infoValueLight: { flex: 1, fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },
  infoValueMono: { flex: 1, fontSize: 14, color: '#334155', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  errorText: { color: '#D97706' },
  editInput: { flex: 1, fontSize: 14, color: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingVertical: 4 },
  inputError: { borderBottomColor: '#F59E0B' },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 16 },

  deptChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  deptChipActive: { backgroundColor: '#EEF2FF', borderColor: '#818CF8' },
  deptChipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  deptChipTextActive: { color: '#4F46E5', fontWeight: 'bold' },

  changePwdBtn: { borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  changePwdBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginLeft: 8 },
  modalTabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', margin: 20, padding: 4, borderRadius: 8 },
  modalTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  modalTabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  modalTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  modalTabTextActive: { color: '#4F46E5' },
  modalBody: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  inputLabel: { alignSelf: 'flex-start', fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 6, marginTop: 12 },
  modalInput: { width: '100%', height: 44, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: 24, gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  modalBtnSubmit: { backgroundColor: '#4F46E5', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  modalBtnSubmitText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },

  otpPrompt: { alignItems: 'center', width: '100%', paddingVertical: 16 },
  otpPromptTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginTop: 16, marginBottom: 8 },
  otpPromptDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  sendOtpBtn: { backgroundColor: '#4F46E5', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  sendOtpBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
