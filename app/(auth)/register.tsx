import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext'; // Added to ensure user is logged in

let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  // Initialize Google Sign-In with Web Client ID (for getting idToken)
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });
} catch (error) {
  console.warn("GoogleSignin native module not found. Are you running in Expo Go without a custom dev client?");
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

type Role = "Student" | "Faculty" | "Guest";

// Hardcoded departments to mirror the web version for simplicity right now
const DEPARTMENTS = [
  "CSE", "ECE", "ME", "CE", "EE", "Maths", "Physics", "Chemistry", "HSS", "Administration"
];

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuth(); // Destructure setUser to log the user in after google register

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [otpValue, setOtpValue] = useState('');

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    uni_id: "",
    role: "Student" as Role,
    dept: DEPARTMENTS[0],
    phone: "",
  });

  const handleChange = (name: string, value: string) => {
    if (name === "role" && value === "Guest") {
      setFormData({
        ...formData,
        role: value as Role,
        dept: "N/A",
      });
      return;
    }

    if (name === "role" && value !== "Guest" && formData.dept === "N/A") {
      setFormData({
        ...formData,
        role: value as Role,
        dept: DEPARTMENTS[0],
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.uni_id || !formData.phone) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.role !== "Guest" && !formData.dept) {
      setError("Please select a department.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("otp");
        if (data.emailSent === false) {
          Alert.alert("Notice", "Account created successfully, but OTP email could not be sent. Please tap Resend OTP on the next screen.");
        } else {
          Alert.alert("Success", "Account created successfully. Please check your email for the OTP.");
        }
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/api/users/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: otpValue }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("Success", "Account verified successfully! You can now login.");
        router.replace('/(auth)/login');
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/api/users/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "OTP sent again. Please check your email.");
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const response = await fetch(`${BASE_URL}/api/users/google-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: userInfo.data.idToken }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          Alert.alert("Success", "Registered with Google successfully!");
          setUser(data.user);
          router.replace('/(tabs)');
        } else {
          setError(data.message || "Google registration failed");
        }
      } else {
        setError("Could not retrieve Google ID Token.");
      }
    } catch (error: any) {
      console.error('Google Sign In Error', error);
      if (error.code !== 'SIGN_IN_CANCELLED') {
        setError("Network error during Google Sign In.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isGuest = formData.role === "Guest";
  const idLabel = isGuest ? "Reference ID" : "University ID";
  const idPlaceholder = isGuest ? "REF-001" : "UG-2023-001";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>{step === 'form' ? 'Create Account' : 'Verify Account'}</Text>
            <Text style={styles.subtitle}>
              {step === 'form' 
                ? 'Join our university booking system' 
                : `Enter the 6-digit OTP sent to ${formData.email}`}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === 'form' ? (
            <View style={styles.formContainer}>
              
              {/* Account Type Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Type</Text>
                <View style={styles.roleTabs}>
                  <TouchableOpacity 
                    style={[styles.roleTab, formData.role !== 'Guest' && styles.roleTabActive]}
                    onPress={() => handleChange('role', 'Student')}
                  >
                    <Text style={[styles.roleTabText, formData.role !== 'Guest' && styles.roleTabTextActive]}>University</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.roleTab, formData.role === 'Guest' && styles.roleTabActive]}
                    onPress={() => handleChange('role', 'Guest')}
                  >
                    <Text style={[styles.roleTabText, formData.role === 'Guest' && styles.roleTabTextActive]}>Guest</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#94A3B8"
                    value={formData.name}
                    onChangeText={(t) => handleChange('name', t)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="john@example.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(t) => handleChange('email', t)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(t) => handleChange('password', t)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>{idLabel}</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder={idPlaceholder}
                      placeholderTextColor="#94A3B8"
                      value={formData.uni_id}
                      onChangeText={(t) => handleChange('uni_id', t)}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Phone</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="9876543210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(t) => handleChange('phone', t)}
                    />
                  </View>
                </View>
              </View>

              {!isGuest && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Department</Text>
                  {/* Basic horizontal scroll for departments since standard picker is complex in RN core */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
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
                </View>
              )}

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.disabledButton]} 
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
              </TouchableOpacity>

              {/* --- SOCIAL LOGIN DIVIDER --- */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* --- GOOGLE BUTTON --- */}
              <TouchableOpacity 
                style={[styles.googleButton, loading && styles.disabledButton]} 
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <Ionicons name="logo-google" size={20} color="#DB4437" style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.footerLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* OTP VERIFICATION VIEW */
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Enter OTP</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpValue}
                    onChangeText={(text) => { setOtpValue(text); setError(''); }}
                    editable={!loading}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#10B981' }, (loading || otpValue.length < 6) && styles.disabledButton]} 
                onPress={handleVerifyOtp}
                disabled={loading || otpValue.length < 6}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Verify Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryButton, (loading || resendingOtp) && styles.disabledOutlineButton]} 
                onPress={handleResendOtp}
                disabled={loading || resendingOtp}
              >
                {resendingOtp ? <ActivityIndicator color="#4F46E5" /> : <Text style={styles.secondaryButtonText}>Resend OTP</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backLinkContainer} 
                onPress={() => { setStep('form'); setOtpValue(''); setError(''); }}
                disabled={loading}
              >
                <Ionicons name="create-outline" size={16} color="#64748B" />
                <Text style={styles.backLinkText}>Edit registration details</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#B91C1C',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#0F172A',
  },
  deptScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  deptChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  deptChipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  deptChipTextActive: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledOutlineButton: {
    opacity: 0.5,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 12,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIcon: {
    marginRight: 8,
  },
  googleButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  footerLink: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  backLinkText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});
