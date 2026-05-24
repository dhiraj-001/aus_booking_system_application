import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

interface Resource {
  _id: string;
  name: string;
  type: string;
  category?: string;
  capacity: number;
}

export default function BookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const urlDraftId = params.draftId as string;
  const { user } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isFetchingDraft, setIsFetchingDraft] = useState(false);

  const [bookingType, setBookingType] = useState<'guest_house' | 'hall'>('guest_house');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form States (Step 1)
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [isForeign, setIsForeign] = useState(false);

  // Picker States
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('date');
  const [activeDateField, setActiveDateField] = useState<'checkIn' | 'checkOut'>('checkIn');

  // Guest House specific states
  const [roomCount, setRoomCount] = useState('1');
  const [guestList, setGuestList] = useState([{ name: '', email: '', phone: '' }]);

  // Document States (Step 2)
  const [idPhoto, setIdPhoto] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [hodLetter, setHodLetter] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (urlDraftId) {
      setDraftId(urlDraftId);
      fetchDraftDetails(urlDraftId);
    } else {
      // Reset if no draftId
      setStep(1);
      setDraftId(null);
    }
  }, [urlDraftId]);

  const fetchDraftDetails = async (id: string) => {
    setIsFetchingDraft(true);
    try {
      // Re-using the /api/bookings/:id endpoint
      const response = await fetch(`${BASE_URL}/api/bookings/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Since getBookingById returns { success: true, data: booking }
        const bookingData = data.data || data; 
        
        if (bookingData) {
          setBookingType(bookingData.booking_type || 'guest_house');
          setIsForeign(bookingData.is_foreign || false);
          setStep(2);
        }
      }
    } catch (err) {
      console.error("Error fetching draft", err);
      Alert.alert("Error", "Could not load draft details.");
    } finally {
      setIsFetchingDraft(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/resources`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResources(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch resources", err);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleAddGuest = () => setGuestList([...guestList, { name: '', email: '', phone: '' }]);
  const handleRemoveGuest = (index: number) => setGuestList(guestList.filter((_, i) => i !== index));
  const handleGuestChange = (index: number, field: string, value: string) => {
    const newList = [...guestList];
    newList[index] = { ...newList[index], [field]: value };
    setGuestList(newList);
  };

  const formatDateTime = (d: Date | null) => {
    if (!d) return "Select Date & Time";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openPicker = (field: 'checkIn' | 'checkOut') => {
    setActiveDateField(field);
    setPickerMode(Platform.OS === 'ios' ? 'datetime' : 'date');
    setShowPicker(true);
  };

  const updateDateState = (selectedDate: Date, mode: string) => {
    if (activeDateField === 'checkIn') {
      const currentDate = checkIn ? new Date(checkIn) : new Date();
      if (mode === 'date' || mode === 'datetime') currentDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      if (mode === 'time' || mode === 'datetime') currentDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setCheckIn(currentDate);
    } else {
      const currentDate = checkOut ? new Date(checkOut) : new Date();
      if (mode === 'date' || mode === 'datetime') currentDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      if (mode === 'time' || mode === 'datetime') currentDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setCheckOut(currentDate);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        updateDateState(selectedDate, pickerMode);
        if (pickerMode === 'date') {
          setTimeout(() => { setPickerMode('time'); setShowPicker(true); }, 50);
        }
      }
    } else {
      if (selectedDate) updateDateState(selectedDate, 'datetime');
    }
  };

  const pickDocument = async (type: 'idPhoto' | 'hodLetter') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        if (type === 'idPhoto') setIdPhoto(result.assets[0]);
        else setHodLetter(result.assets[0]);
      }
    } catch (err) {
      console.error("Error picking document", err);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return Alert.alert("Error", "Please login to book.");
    if (!checkIn || !checkOut) return Alert.alert("Error", "Please select check-in and check-out dates.");
    if (preferences.length === 0) return Alert.alert("Error", "Please select at least one resource preference.");
    if (checkOut <= checkIn) return Alert.alert("Error", "Check-out time must be after Check-in time.");
    if (bookingType === 'guest_house' && parseInt(roomCount) < 1) return Alert.alert("Error", "At least 1 room is required.");

    setSubmitting(true);

    try {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

      const payload = {
        user_id: user._id,
        booking_type: bookingType,
        preference: preferences,
        check_in_time: toISO(checkIn),
        check_out_time: toISO(checkOut),
        details,
        is_foreign: isForeign,
        ...(bookingType === 'guest_house' && {
          guest_house_fields: {
            category: "Standard",
            sub_category: "Single",
            gender: "Male",
            food_preference: "veg",
            room_count: parseInt(roomCount) || 1,
            meals: { breakfast: false, lunch: false, dinner: false },
            guest_list: guestList
          }
        })
      };

      const response = await fetch(`${BASE_URL}/api/bookings/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setDraftId(data.booking._id);
        setStep(2);
        Alert.alert("Draft Saved", "Please upload the required documents to finalize your application.");
      } else {
        Alert.alert("Error", data.message || "Failed to save draft.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Could not submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!idPhoto) {
      return Alert.alert("Error", `Please upload your ${isForeign ? 'Passport' : 'University ID'} scan.`);
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      
      formData.append("id_photo", {
        uri: idPhoto.uri,
        name: idPhoto.name || 'id_photo.jpg',
        type: idPhoto.mimeType || 'image/jpeg',
      } as any);

      if (hodLetter) {
        formData.append("hod_forward_letter", {
          uri: hodLetter.uri,
          name: hodLetter.name || 'hod_letter.pdf',
          type: hodLetter.mimeType || 'application/pdf',
        } as any);
      }

      const response = await fetch(`${BASE_URL}/api/bookings/finalize/${draftId}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Success", "Application Submitted successfully!", [
          { text: "OK", onPress: () => {
            setStep(1);
            setDraftId(null);
            setIdPhoto(null);
            setHodLetter(null);
            setCheckIn(null);
            setCheckOut(null);
            setPreferences([]);
            router.push('/bookings');
          }}
        ]);
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to finalize application.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error while uploading documents.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableResources = resources.filter(r => r.category === bookingType);

  if (isFetchingDraft) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#64748B' }}>Loading Draft Application...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Book a Space</Text>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}><Text style={styles.stepDotText}>1</Text></View>
            <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}><Text style={styles.stepDotText}>2</Text></View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {step === 1 ? (
            <>
              <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tabBtn, bookingType === 'guest_house' && styles.tabBtnActive]} onPress={() => { setBookingType('guest_house'); setPreferences([]); }}>
                  <Ionicons name="people" size={16} color={bookingType === 'guest_house' ? '#2563EB' : '#64748B'} />
                  <Text style={[styles.tabText, bookingType === 'guest_house' && styles.tabTextActive]}>Guest House</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, bookingType === 'hall' && styles.tabBtnActive]} onPress={() => { setBookingType('hall'); setPreferences([]); }}>
                  <Ionicons name="business" size={16} color={bookingType === 'hall' ? '#2563EB' : '#64748B'} />
                  <Text style={[styles.tabText, bookingType === 'hall' && styles.tabTextActive]}>Seminar Hall</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>1. Select Date & Time</Text>
                <Text style={styles.label}>Check-in Time</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => openPicker('checkIn')}>
                  <Ionicons name="calendar-outline" size={18} color="#475569" />
                  <Text style={[styles.datePickerText, !checkIn && styles.datePickerTextPlaceholder]}>{formatDateTime(checkIn)}</Text>
                </TouchableOpacity>
                <Text style={styles.label}>Check-out Time</Text>
                <TouchableOpacity style={styles.datePickerBtn} onPress={() => openPicker('checkOut')}>
                  <Ionicons name="calendar-outline" size={18} color="#475569" />
                  <Text style={[styles.datePickerText, !checkOut && styles.datePickerTextPlaceholder]}>{formatDateTime(checkOut)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>2. Select Preference</Text>
                {loadingResources ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <View style={styles.resourceList}>
                    {availableResources.map(r => {
                      const isActive = preferences.includes(r._id);
                      return (
                      <TouchableOpacity 
                        key={r._id} 
                        style={[styles.resourceChip, isActive && styles.resourceChipActive]}
                        onPress={() => isActive ? setPreferences(preferences.filter(p => p !== r._id)) : setPreferences([...preferences, r._id])}
                      >
                        <Text style={[styles.resourceChipText, isActive && styles.resourceChipTextActive]}>{r.name} (Cap: {r.capacity})</Text>
                      </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {bookingType === 'guest_house' && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>3. Guest Details</Text>
                  <View style={styles.row}>
                    <Text style={styles.label}>Rooms Required</Text>
                    <TextInput style={[styles.input, { width: 60, textAlign: 'center', marginBottom: 0 }]} keyboardType="numeric" value={roomCount} onChangeText={setRoomCount} />
                  </View>
                  <View style={[styles.row, { marginTop: 16 }]}>
                    <Text style={styles.label}>Are any guests foreign residents?</Text>
                    <Switch value={isForeign} onValueChange={setIsForeign} trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }} thumbColor={isForeign ? '#2563EB' : '#F1F5F9'} />
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.label}>Guest List</Text>
                  {guestList.map((g, index) => (
                    <View key={index} style={styles.guestBox}>
                      <View style={styles.guestHeader}>
                        <Text style={styles.guestTitle}>Guest {index + 1}</Text>
                        {guestList.length > 1 && <TouchableOpacity onPress={() => handleRemoveGuest(index)}><Ionicons name="trash" size={16} color="#EF4444" /></TouchableOpacity>}
                      </View>
                      <TextInput style={styles.inputSmall} placeholder="Full Name" value={g.name} onChangeText={(t) => handleGuestChange(index, 'name', t)} />
                      <TextInput style={styles.inputSmall} placeholder="Email Address" value={g.email} onChangeText={(t) => handleGuestChange(index, 'email', t)} autoCapitalize="none" keyboardType="email-address" />
                      <TextInput style={styles.inputSmall} placeholder="Phone Number" value={g.phone} onChangeText={(t) => handleGuestChange(index, 'phone', t)} keyboardType="phone-pad" />
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addGuestBtn} onPress={handleAddGuest}>
                    <Ionicons name="add" size={16} color="#2563EB" />
                    <Text style={styles.addGuestText}>Add Another Guest</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{bookingType === 'guest_house' ? '4. Additional Details' : '3. Purpose / Details'}</Text>
                <TextInput style={styles.textArea} placeholder="Provide a brief description..." multiline numberOfLines={4} value={details} onChangeText={setDetails} />
              </View>

              <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSaveDraft} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Text style={styles.submitBtnText}>Save Draft & Continue</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // STEP 2 UI
            <View style={styles.step2Container}>
              <View style={styles.card}>
                <View style={styles.step2Header}>
                  <Ionicons name="cloud-upload" size={32} color="#2563EB" />
                  <Text style={styles.sectionTitleStep2}>Document Upload</Text>
                  <Text style={styles.headerSub}>Please upload the required documents to finalize your application.</Text>
                </View>

                {/* HOD Letter */}
                <View style={styles.uploadZone}>
                  <Text style={styles.label}>1. Signed HOD Forward Letter (Optional)</Text>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument('hodLetter')}>
                    <Ionicons name="document-text" size={24} color={hodLetter ? "#059669" : "#64748B"} />
                    <Text style={[styles.uploadText, hodLetter && {color: '#059669', fontWeight: 'bold'}]}>
                      {hodLetter ? hodLetter.name : "Tap to browse files"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* ID Photo */}
                <View style={styles.uploadZone}>
                  <Text style={styles.label}>2. {isForeign && bookingType === 'guest_house' ? "Passport Scan" : "University ID Photo"} <Text style={{color: 'red'}}>*</Text></Text>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => pickDocument('idPhoto')}>
                    <Ionicons name="image" size={24} color={idPhoto ? "#059669" : "#64748B"} />
                    <Text style={[styles.uploadText, idPhoto && {color: '#059669', fontWeight: 'bold'}]}>
                      {idPhoto ? idPhoto.name : "Tap to browse files"}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#059669' }, submitting && styles.submitBtnDisabled]} onPress={handleFinalSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                    <Text style={styles.submitBtnText}>Submit Final Application</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>&larr; Back to Step 1</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.iosPickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={(activeDateField === 'checkIn' ? checkIn : checkOut) || new Date()}
            mode={pickerMode as any}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'center' },
  
  stepIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#2563EB' },
  stepDotText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  stepLine: { width: 16, height: 2, backgroundColor: '#E2E8F0' },
  stepLineActive: { backgroundColor: '#2563EB' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', marginBottom: 16, padding: 4, borderRadius: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6, gap: 6 },
  tabBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#2563EB' },

  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 110 },
  
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
  sectionTitleStep2: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginTop: 12 },
  
  label: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A', marginBottom: 16, backgroundColor: '#F8FAFC' },
  inputSmall: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#0F172A', marginBottom: 8, backgroundColor: '#FFF' },
  textArea: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A', backgroundColor: '#F8FAFC', minHeight: 100, textAlignVertical: 'top' },
  
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F8FAFC', marginBottom: 16, gap: 8 },
  datePickerText: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  datePickerTextPlaceholder: { color: '#94A3B8' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  
  resourceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resourceChip: { borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F8FAFC' },
  resourceChipActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  resourceChipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  resourceChipTextActive: { color: '#2563EB', fontWeight: 'bold' },

  guestBox: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 12 },
  guestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  guestTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  
  addGuestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, backgroundColor: '#EFF6FF', borderStyle: 'dashed', gap: 6 },
  addGuestText: { fontSize: 13, fontWeight: 'bold', color: '#2563EB' },

  submitBtn: { flexDirection: 'row', backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

  iosPickerContainer: { backgroundColor: '#FFF', position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: 20 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  iosPickerDone: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 },

  step2Container: { marginTop: 8 },
  step2Header: { alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  uploadZone: { marginBottom: 16 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 8, backgroundColor: '#F8FAFC', gap: 12 },
  uploadText: { fontSize: 14, color: '#64748B', flex: 1 },
  
  backBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
  backBtnText: { color: '#64748B', fontWeight: 'bold', fontSize: 13 }
});
