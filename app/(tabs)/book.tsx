import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import { useAlert } from '@/hooks/AlertContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FF',
  border: '#E4EAF6',
  borderFocus: '#4F6EF7',
  primary: '#4056E8',
  primaryLight: '#EEF1FE',
  primaryMid: '#C7CEF9',
  accent: '#12B981',
  accentLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FFF1F1',
  text: '#0E1B3D',
  textSub: '#5A6A8A',
  textMuted: '#9BA8C3',
  white: '#FFFFFF',
  shadow: '#1E3A8A',
};

interface Resource {
  _id: string;
  name: string;
  type: string;
  category?: string;
  capacity: number;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {children}{required && <Text style={{ color: C.danger }}> *</Text>}
    </Text>
  );
}

function DateButton({ label, value, onPress }: { label: string; value: Date | null; onPress: () => void }) {
  const formatted = value
    ? value.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <TouchableOpacity style={styles.dateBtn} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.dateBtnIcon}>
        <Ionicons name="calendar" size={16} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.dateBtnLabel}>{label}</Text>
        <Text style={[styles.dateBtnValue, !value && { color: C.textMuted }]}>
          {formatted || 'Tap to select'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
    </TouchableOpacity>
  );
}

function ResourceChip({ name, capacity, active, onPress }: { name: string; capacity: number; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {active && <Ionicons name="checkmark-circle" size={14} color={C.primary} style={{ marginRight: 4 }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {name}
      </Text>
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>{capacity}</Text>
      </View>
    </TouchableOpacity>
  );
}

function GuestCard({ guest, index, total, onChange, onRemove }: any) {
  return (
    <View style={styles.guestCard}>
      <View style={styles.guestCardHeader}>
        <View style={styles.guestBadge}>
          <Text style={styles.guestBadgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.guestCardTitle}>Guest {index + 1}</Text>
        {total > 1 && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <Ionicons name="close" size={14} color={C.danger} />
          </TouchableOpacity>
        )}
      </View>
      <TextInput style={styles.inlineInput} placeholder="Full Name" value={guest.name} onChangeText={(t) => onChange('name', t)} placeholderTextColor={C.textMuted} />
      <TextInput style={styles.inlineInput} placeholder="Email Address" value={guest.email} onChangeText={(t) => onChange('email', t)} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={C.textMuted} />
      <TextInput style={[styles.inlineInput, { marginBottom: 0 }]} placeholder="Phone Number" value={guest.phone} onChangeText={(t) => onChange('phone', t)} keyboardType="phone-pad" placeholderTextColor={C.textMuted} />
    </View>
  );
}

function UploadZone({ label, file, onPick, required }: { label: string; file: DocumentPicker.DocumentPickerAsset | null; onPick: () => void; required?: boolean }) {
  const uploaded = !!file;
  return (
    <View style={{ marginBottom: 16 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <TouchableOpacity style={[styles.uploadZone, uploaded && styles.uploadZoneUploaded]} onPress={onPick} activeOpacity={0.8}>
        <View style={[styles.uploadIcon, uploaded && styles.uploadIconUploaded]}>
          <Ionicons name={uploaded ? 'checkmark' : 'cloud-upload-outline'} size={20} color={uploaded ? C.accent : C.textSub} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.uploadTitle, uploaded && { color: C.accent }]}>
            {uploaded ? 'File uploaded' : 'Tap to browse files'}
          </Text>
          <Text style={styles.uploadSub} numberOfLines={1}>
            {uploaded ? file!.name : 'PDF, JPG or PNG accepted'}
          </Text>
        </View>
        {uploaded && <Ionicons name="create-outline" size={16} color={C.accent} />}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function BookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const urlDraftId = params.draftId as string;
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<1 | 2>(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isFetchingDraft, setIsFetchingDraft] = useState(false);

  const [bookingType, setBookingType] = useState<'guest_house' | 'hall'>('guest_house');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [isForeign, setIsForeign] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('date');
  const [activeDateField, setActiveDateField] = useState<'checkIn' | 'checkOut'>('checkIn');

  const [roomCount, setRoomCount] = useState('1');
  const [guestList, setGuestList] = useState([{ name: '', email: '', phone: '' }]);

  const [idPhoto, setIdPhoto] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [hodLetter, setHodLetter] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  useEffect(() => { fetchResources(); }, [checkIn, checkOut, bookingType]);

  useEffect(() => {
    if (urlDraftId) { setDraftId(urlDraftId); fetchDraftDetails(urlDraftId); }
    else { setStep(1); setDraftId(null); }
  }, [urlDraftId]);

  const fetchDraftDetails = async (id: string) => {
    setIsFetchingDraft(true);
    try {
      const response = await fetch(`${BASE_URL}/api/bookings/${id}`, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        const bookingData = data.data || data;
        if (bookingData) { setBookingType(bookingData.booking_type || 'guest_house'); setIsForeign(bookingData.is_foreign || false); setStep(2); }
      }
    } catch (err) { showAlert("Error", "Could not load draft details."); }
    finally { setIsFetchingDraft(false); }
  };

  const fetchResources = async () => {
    if (!checkIn || !checkOut) {
      setResources([]);
      setLoadingResources(false);
      return;
    }
    setLoadingResources(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/resources/available?startDate=${checkIn.toISOString()}&endDate=${checkOut.toISOString()}&category=${bookingType}`);
      if (res.ok) { 
        const data = await res.json(); 
        if (data.success) {
          setResources(data.data);
          const availableIds = data.data.map((r: any) => r._id);
          setPreferences(prev => prev.filter(p => availableIds.includes(p)));
        } 
      }
    } catch (err) { } finally { setLoadingResources(false); }
  };

  const handleAddGuest = () => setGuestList([...guestList, { name: '', email: '', phone: '' }]);
  const handleRemoveGuest = (index: number) => setGuestList(guestList.filter((_, i) => i !== index));
  const handleGuestChange = (index: number, field: string, value: string) => {
    const newList = [...guestList];
    newList[index] = { ...newList[index], [field]: value };
    setGuestList(newList);
  };

  const openPicker = (field: 'checkIn' | 'checkOut') => {
    setActiveDateField(field);
    setPickerMode(Platform.OS === 'ios' ? 'datetime' : 'date');
    setShowPicker(true);
  };

  const updateDateState = (selectedDate: Date, mode: string) => {
    const setter = activeDateField === 'checkIn' ? setCheckIn : setCheckOut;
    const current = (activeDateField === 'checkIn' ? checkIn : checkOut) ? new Date(activeDateField === 'checkIn' ? checkIn! : checkOut!) : new Date();
    if (mode === 'date' || mode === 'datetime') current.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    if (mode === 'time' || mode === 'datetime') current.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    setter(new Date(current));

    if (activeDateField === 'checkIn' && checkOut && current >= checkOut) {
      setCheckOut(null);
      showAlert("Notice", "Check-out cleared. Please select a time after Check-in.");
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        updateDateState(selectedDate, pickerMode);
        if (pickerMode === 'date') setTimeout(() => { setPickerMode('time'); setShowPicker(true); }, 50);
      }
    } else {
      if (selectedDate) updateDateState(selectedDate, 'datetime');
    }
  };

  const pickDocument = async (type: 'idPhoto' | 'hodLetter') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets.length > 0) {
        if (type === 'idPhoto') setIdPhoto(result.assets[0]);
        else setHodLetter(result.assets[0]);
      }
    } catch (err) { }
  };

  const handleSaveDraft = async () => {
    if (!user) return showAlert("Error", "Please login to book.");
    if (!checkIn || !checkOut) return showAlert("Error", "Please select check-in and check-out dates.");
    if (preferences.length === 0) return showAlert("Error", "Please select at least one resource preference.");
    if (checkOut <= checkIn) return showAlert("Error", "Check-out time must be after check-in time.");
    setSubmitting(true);
    try {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      const payload = {
        user_id: user._id, booking_type: bookingType, preference: preferences,
        check_in_time: toISO(checkIn), check_out_time: toISO(checkOut), details, is_foreign: isForeign,
        ...(bookingType === 'guest_house' && { guest_house_fields: { category: "Standard", sub_category: "Single", gender: "Male", food_preference: "veg", room_count: parseInt(roomCount) || 1, meals: { breakfast: false, lunch: false, dinner: false }, guest_list: guestList } })
      };
      const response = await fetch(`${BASE_URL}/api/bookings/draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.ok) { setDraftId(data.booking._id); setStep(2); }
      else showAlert("Error", data.message || "Failed to save draft.");
    } catch { showAlert("Error", "Network error. Could not submit."); }
    finally { setSubmitting(false); }
  };

  const handleFinalSubmit = async () => {
    if (!idPhoto) return showAlert("Required", `Please upload your ${isForeign ? 'Passport' : 'University ID'} scan.`);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("id_photo", { uri: idPhoto.uri, name: idPhoto.name || 'id_photo.jpg', type: idPhoto.mimeType || 'image/jpeg' } as any);
      if (hodLetter) formData.append("hod_forward_letter", { uri: hodLetter.uri, name: hodLetter.name || 'hod_letter.pdf', type: hodLetter.mimeType || 'application/pdf' } as any);
      const response = await fetch(`${BASE_URL}/api/bookings/finalize/${draftId}`, { method: "PATCH", body: formData });
      if (response.ok) {
        showAlert("Submitted!", "Your application has been submitted successfully.", [{
          text: "View Bookings", onPress: () => {
            setStep(1); setDraftId(null); setIdPhoto(null); setHodLetter(null);
            setCheckIn(null); setCheckOut(null); setPreferences([]);
            router.push('/bookings');
          }
        }]);
      } else {
        const data = await response.json();
        showAlert("Error", data.message || "Failed to finalize application.");
      }
    } catch { showAlert("Error", "Network error while uploading documents."); }
    finally { setSubmitting(false); }
  };

  const availableResources = resources.filter(r => r.category === bookingType);

  if (isFetchingDraft) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[styles.textSub, { marginTop: 12 }]}>Loading draft application…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>New Application</Text>
            <Text style={styles.headerTitle}>Book a Hall / Guest House</Text>
          </View>
          {/* Step Tracker */}
          <View style={styles.stepper}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
                {step > 1
                  ? <Ionicons name="checkmark" size={12} color={C.white} />
                  : <Text style={styles.stepNum}>1</Text>}
              </View>
              <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Details</Text>
            </View>
            <View style={[styles.stepConnector, step === 2 && styles.stepConnectorActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, step === 2 && styles.stepCircleActive]}>
                <Text style={styles.stepNum}>2</Text>
              </View>
              <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Documents</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {step === 1 ? (
            <>
              {/* Booking Type Toggle */}
              <View style={styles.typeToggle}>
                {(['guest_house', 'hall'] as const).map((type) => {
                  const active = bookingType === type;
                  const icon = type === 'guest_house' ? 'bed-outline' : 'business-outline';
                  const label = type === 'guest_house' ? 'Guest House' : 'Seminar Hall';
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeBtn, active && styles.typeBtnActive]}
                      onPress={() => { setBookingType(type); setPreferences([]); }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.typeBtnIcon, active && styles.typeBtnIconActive]}>
                        <Ionicons name={icon as any} size={18} color={active ? C.white : C.textSub} />
                      </View>
                      <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date & Time */}
              <SectionCard>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderIcon}><Ionicons name="time-outline" size={16} color={C.primary} /></View>
                  <Text style={styles.cardTitle}>Date & Time</Text>
                </View>
                <DateButton label="Check-in" value={checkIn} onPress={() => openPicker('checkIn')} />
                <View style={styles.dateSeparator}>
                  <View style={styles.dateSeparatorLine} />
                  <Text style={styles.dateSeparatorText}>to</Text>
                  <View style={styles.dateSeparatorLine} />
                </View>
                <DateButton label="Check-out" value={checkOut} onPress={() => openPicker('checkOut')} />
              </SectionCard>

              {/* Resource Preference */}
              <SectionCard>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderIcon}><Ionicons name="layers-outline" size={16} color={C.primary} /></View>
                  <Text style={styles.cardTitle}>Preferences</Text>
                  {preferences.length > 0 && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{preferences.length} selected</Text>
                    </View>
                  )}
                </View>
                {(!checkIn || !checkOut) ? (
                  <Text style={styles.emptyText}>Select Check-in and Check-out dates first to view available resources.</Text>
                ) : loadingResources ? (
                  <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 8 }} />
                ) : availableResources.length === 0 ? (
                  <Text style={styles.emptyText}>No resources available for these dates.</Text>
                ) : (
                  <View style={styles.chipRow}>
                    {availableResources.map(r => (
                      <ResourceChip
                        key={r._id} name={r.name} capacity={r.capacity}
                        active={preferences.includes(r._id)}
                        onPress={() => preferences.includes(r._id) ? setPreferences(preferences.filter(p => p !== r._id)) : setPreferences([...preferences, r._id])}
                      />
                    ))}
                  </View>
                )}
              </SectionCard>

              {/* Guest House Fields */}
              {bookingType === 'guest_house' && (
                <SectionCard>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderIcon}><Ionicons name="people-outline" size={16} color={C.primary} /></View>
                    <Text style={styles.cardTitle}>Guest Details</Text>
                  </View>

                  {/* Room Count */}
                  <View style={styles.roomRow}>
                    <Text style={styles.label}>Rooms Required</Text>
                    <View style={styles.roomCounter}>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => setRoomCount(String(Math.max(1, parseInt(roomCount) - 1)))}>
                        <Ionicons name="remove" size={16} color={C.primary} />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{roomCount}</Text>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => setRoomCount(String(parseInt(roomCount) + 1))}>
                        <Ionicons name="add" size={16} color={C.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Foreign Toggle */}
                  <View style={[styles.roomRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }]}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.label}>Foreign Residents</Text>
                      <Text style={styles.textMuted}>Requires passport instead of university ID</Text>
                    </View>
                    <Switch
                      value={isForeign} onValueChange={setIsForeign}
                      trackColor={{ false: C.border, true: C.primaryMid }}
                      thumbColor={isForeign ? C.primary : '#F0F4FF'}
                    />
                  </View>

                  {/* Guest List */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.label}>Guest List</Text>
                    {guestList.map((g, i) => (
                      <GuestCard key={i} guest={g} index={i} total={guestList.length}
                        onChange={(field: string, val: string) => handleGuestChange(i, field, val)}
                        onRemove={() => handleRemoveGuest(i)} />
                    ))}
                    <TouchableOpacity style={styles.addGuestBtn} onPress={handleAddGuest} activeOpacity={0.75}>
                      <Ionicons name="add-circle-outline" size={18} color={C.primary} />
                      <Text style={styles.addGuestText}>Add Guest</Text>
                    </TouchableOpacity>
                  </View>
                </SectionCard>
              )}

              {/* Additional Details */}
              <SectionCard>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderIcon}><Ionicons name="document-text-outline" size={16} color={C.primary} /></View>
                  <Text style={styles.cardTitle}>{bookingType === 'guest_house' ? 'Additional Notes' : 'Purpose / Details'}</Text>
                </View>
                <TextInput
                  style={styles.textArea}
                  placeholder="Briefly describe the purpose of your booking…"
                  placeholderTextColor={C.textMuted}
                  multiline numberOfLines={4}
                  value={details} onChangeText={setDetails}
                />
              </SectionCard>

              <TouchableOpacity style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]} onPress={handleSaveDraft} disabled={submitting} activeOpacity={0.85}>
                {submitting
                  ? <ActivityIndicator color={C.white} />
                  : <>
                      <Text style={styles.primaryBtnText}>Save & Continue</Text>
                      <Ionicons name="arrow-forward-circle" size={20} color={C.white} />
                    </>}
              </TouchableOpacity>
            </>
          ) : (
            /* ── STEP 2 ── */
            <>
              <View style={styles.step2Banner}>
                <View style={styles.step2BannerIcon}>
                  <Ionicons name="shield-checkmark" size={24} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.step2BannerTitle}>Almost there!</Text>
                  <Text style={styles.step2BannerSub}>Upload your verification documents to finalize the application.</Text>
                </View>
              </View>

              <SectionCard>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderIcon}><Ionicons name="cloud-upload-outline" size={16} color={C.primary} /></View>
                  <Text style={styles.cardTitle}>Document Upload</Text>
                </View>

                <UploadZone
                  label="HOD Forward Letter (optional)"
                  file={hodLetter}
                  onPick={() => pickDocument('hodLetter')}
                />
                <UploadZone
                  label={isForeign && bookingType === 'guest_house' ? 'Passport Scan' : 'University ID Photo'}
                  file={idPhoto}
                  onPick={() => pickDocument('idPhoto')}
                  required
                />
              </SectionCard>

              <TouchableOpacity style={[styles.successBtn, submitting && styles.primaryBtnDisabled]} onPress={handleFinalSubmit} disabled={submitting} activeOpacity={0.85}>
                {submitting
                  ? <ActivityIndicator color={C.white} />
                  : <>
                      <Ionicons name="checkmark-circle" size={20} color={C.white} />
                      <Text style={styles.primaryBtnText}>Submit Application</Text>
                    </>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.ghostBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={15} color={C.textSub} />
                <Text style={styles.ghostBtnText}>Back to Step 1</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showPicker && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerSheet : undefined}>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerBar}>
              <Text style={styles.iosPickerTitle}>{activeDateField === 'checkIn' ? 'Check-in' : 'Check-out'}</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.iosDoneBtn}>
                <Text style={styles.iosDoneText}>Done</Text>
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

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  headerEyebrow: { fontSize: 11, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: C.primary },
  stepNum: { fontSize: 11, fontWeight: '800', color: C.textMuted },
  stepLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted },
  stepLabelActive: { color: C.primary },
  stepConnector: { width: 28, height: 2, backgroundColor: C.border, borderRadius: 1, marginBottom: 14 },
  stepConnectorActive: { backgroundColor: C.primary },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },

  // Type Toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 13,
    gap: 8,
  },
  typeBtnActive: { backgroundColor: C.primaryLight },
  typeBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnIconActive: { backgroundColor: C.primary },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: C.textSub },
  typeBtnTextActive: { color: C.primary, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardHeaderIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  selectedBadge: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  selectedBadgeText: { color: C.white, fontSize: 11, fontWeight: '700' },

  // Date Button
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  dateBtnIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  dateBtnLabel: { fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateBtnValue: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 2 },
  dateSeparator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  dateSeparatorLine: { flex: 1, height: 1, backgroundColor: C.border },
  dateSeparatorText: { fontSize: 11, fontWeight: '600', color: C.textMuted },

  // Resource Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
    gap: 6,
  },
  chipActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  chipText: { fontSize: 13, fontWeight: '600', color: C.textSub },
  chipTextActive: { color: C.primary },
  chipBadge: {
    backgroundColor: C.border,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  chipBadgeActive: { backgroundColor: C.primaryMid },
  chipBadgeText: { fontSize: 10, fontWeight: '700', color: C.textSub },
  chipBadgeTextActive: { color: C.primary },

  // Room Counter
  roomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomCounter: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: C.surfaceAlt,
    borderRadius: 10, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  counterBtn: { padding: 10, backgroundColor: C.primaryLight },
  counterValue: { paddingHorizontal: 20, fontSize: 15, fontWeight: '700', color: C.text },

  // Guest Card
  guestCard: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  guestCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  guestBadge: {
    width: 22, height: 22, borderRadius: 7,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  guestBadgeText: { fontSize: 11, fontWeight: '800', color: C.primary },
  guestCardTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text },
  removeBtn: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: C.dangerLight, alignItems: 'center', justifyContent: 'center',
  },

  addGuestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
    borderWidth: 1.5, borderColor: C.primaryMid, borderRadius: 12,
    borderStyle: 'dashed', backgroundColor: C.primaryLight,
  },
  addGuestText: { fontSize: 13, fontWeight: '700', color: C.primary },

  // Inputs
  label: { fontSize: 12, fontWeight: '700', color: C.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  inlineInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, color: C.text,
    backgroundColor: C.surface, marginBottom: 8,
  },
  textArea: {
    borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.text, backgroundColor: C.surfaceAlt,
    minHeight: 96, textAlignVertical: 'top',
  },

  // Upload Zone
  uploadZone: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
    backgroundColor: C.surfaceAlt,
  },
  uploadZoneUploaded: { borderColor: C.accent, borderStyle: 'solid', backgroundColor: C.accentLight },
  uploadIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  uploadIconUploaded: { backgroundColor: C.accentLight, borderColor: C.accent },
  uploadTitle: { fontSize: 14, fontWeight: '600', color: C.textSub },
  uploadSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Step 2 Banner
  step2Banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.primaryLight,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.primaryMid,
    marginBottom: 14,
  },
  step2BannerIcon: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.primaryMid,
  },
  step2BannerTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  step2BannerSub: { fontSize: 12, color: C.textSub, marginTop: 2, lineHeight: 16 },

  // Buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.primary,
    paddingVertical: 16, borderRadius: 14, marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  primaryBtnDisabled: { backgroundColor: C.primaryMid },
  primaryBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },
  successBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.accent,
    paddingVertical: 16, borderRadius: 14, marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, marginTop: 8,
  },
  ghostBtnText: { fontSize: 13, fontWeight: '700', color: C.textSub },

  // iOS Picker
  iosPickerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: 24,
  },
  iosPickerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iosPickerTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  iosDoneBtn: { backgroundColor: C.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  iosDoneText: { color: C.primary, fontWeight: '800', fontSize: 14 },

  // Misc
  textSub: { fontSize: 13, color: C.textSub },
  textMuted: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  emptyText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
});