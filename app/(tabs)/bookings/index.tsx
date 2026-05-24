import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Modal, Platform, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';
import { useAlert } from '@/hooks/AlertContext';
import { StatusBadge } from '@/components/StatusBadge';
import * as Print from 'expo-print';
import { generateSlipHtml } from '@/utils/slipGenerator';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchBookings = useCallback(async () => {
    if (!user?._id) return;

    try {
      const response = await fetch(`${BASE_URL}/api/bookings/user/${user._id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bookings, statusFilter]);

  const handleDeleteDraft = async (id: string) => {
    showAlert(
      "Discard Application?",
      "Are you sure you want to delete this draft? All entered data will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Discard", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/bookings/delete/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                fetchBookings();
              } else {
                showAlert("Error", "Failed to delete draft.");
              }
            } catch (error) {
              showAlert("Error", "Network error while deleting draft.");
            }
          }
        }
      ]
    );
  };

  const handleContinueDraft = (booking: any) => {
    router.push({ pathname: '/book', params: { draftId: booking._id } });
  };

  const handlePayment = (booking: any, type: string) => {
    showAlert(
      "Payment Required",
      "Native mobile payment using Razorpay is not supported in Expo Go. Please complete this payment on the web version."
    );
  };

  const handleSlip = async (booking: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/bookings/allocation/${booking._id}`);
      if (!response.ok) throw new Error("Failed to fetch allocations");
      const aData = await response.json();
      const allocations = Array.isArray(aData) ? aData : [aData];
      
      const html = generateSlipHtml(booking, allocations, user);
      await Print.printAsync({ html });
    } catch (err) {
      showAlert("Error", "Could not generate allotment slip.");
    } finally {
      setIsLoading(false);
    }
  };

  const openGuestDetails = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const d = new Date(dateString);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear().toString().substr(-2)}`;
  };

  const FilterChip = ({ label, value }: { label: string, value: string }) => {
    const isActive = statusFilter === value;
    return (
      <TouchableOpacity 
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setStatusFilter(value)}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerSub}>Track the status of your requests and manage payments.</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterChip label="All" value="all" />
          <FilterChip label="Drafts" value="draft" />
          <FilterChip label="Awaiting HOD" value="pending_hod" />
          <FilterChip label="Awaiting Admin" value="pending_admin" />
          <FilterChip label="Approved" value="approved" />
          <FilterChip label="Checked In" value="checked_in" />
          <FilterChip label="Checked Out" value="checked_out" />
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Synchronizing Applications...</Text>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No applications found</Text>
          <Text style={styles.emptySub}>You haven't made any bookings that match this filter.</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredBookings.map((b) => {
            const isBookingFeePaid = b.payments?.booking_fee?.status === 'completed' || b.payment_status === 'completed';
            const isCheckInFeePaid = b.payments?.check_in_fee?.status === 'completed';
            const isHall = b.booking_type === 'hall';

            return (
              <TouchableOpacity 
                key={b._id} 
                style={[styles.card, b.status === 'draft' && styles.cardDraft]}
                onPress={() => router.push(`/bookings/${b._id}`)}
                activeOpacity={0.8}
              >
                
                {/* Top Section */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <View style={[styles.iconBg, isHall ? styles.iconBgHall : styles.iconBgGuest]}>
                      <Ionicons name={isHall ? "business" : "people"} size={20} color={isHall ? "#2563EB" : "#4F46E5"} />
                    </View>
                    <Text style={[styles.typeText, isHall ? { color: '#3B82F6' } : { color: '#6366F1' }]}>
                      {isHall ? 'HALL' : 'GUEST HOUSE'}
                    </Text>
                  </View>
                  
                  <View style={styles.headerInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle}>{isHall ? "Hall Requisition" : "Accommodation"}</Text>
                      <StatusBadge status={b.status} />
                    </View>
                    <Text style={styles.dateUpdated}>
                      <Ionicons name="time-outline" size={10} /> Updated {formatDate(b.updatedAt || b.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Details Section */}
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.detailText}>
                      {formatDate(b.check_in_time)} - {formatDate(b.check_out_time)}
                    </Text>
                  </View>
                  
                  {!isHall && b.guest_house_fields?.guest_list?.length > 0 && (
                    <TouchableOpacity style={styles.guestBtn} onPress={() => openGuestDetails(b)}>
                      <Ionicons name="people" size={12} color="#3B82F6" />
                      <Text style={styles.guestBtnText}>{b.guest_house_fields.guest_list.length} Guest(s)</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Payments Section */}
                {b.payment_amount > 0 && (
                  <View style={styles.paymentBox}>
                    <View style={styles.paymentCol}>
                      <Ionicons name={isBookingFeePaid ? "checkmark-circle" : "wallet"} size={12} color={isBookingFeePaid ? "#059669" : "#D97706"} />
                      <Text style={[styles.paymentText, { color: isBookingFeePaid ? "#059669" : "#D97706" }]}>
                        Fee: ₹{b.payments?.booking_fee?.amount || (b.payment_amount * 0.4).toFixed(0)}
                      </Text>
                    </View>
                    <Text style={{color: '#E2E8F0'}}>|</Text>
                    <View style={styles.paymentCol}>
                      <Ionicons name={isCheckInFeePaid ? "checkmark-circle" : "wallet"} size={12} color={isCheckInFeePaid ? "#059669" : "#94A3B8"} />
                      <Text style={[styles.paymentText, { color: isCheckInFeePaid ? "#059669" : "#64748B" }]}>
                        Due: ₹{b.payments?.check_in_fee?.amount || (b.payment_amount * 0.6).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionsBox}>
                  {b.status === "draft" ? (
                    <>
                      <TouchableOpacity style={styles.btnDanger} onPress={() => handleDeleteDraft(b._id)}>
                        <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnPrimaryWarn} onPress={() => handleContinueDraft(b)}>
                        <Text style={styles.btnTextWhite}>Finish Application</Text>
                        <Ionicons name="arrow-forward-circle-outline" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </>
                  ) : b.status === "awaiting_booking_payment" && !isBookingFeePaid ? (
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => handlePayment(b, 'booking_fee')}>
                      <Text style={styles.btnTextWhite}>Pay Booking Fee</Text>
                    </TouchableOpacity>
                  ) : b.status === "awaiting_checkin_payment" && isBookingFeePaid && !isCheckInFeePaid ? (
                    <>
                      <TouchableOpacity style={styles.btnOutline} onPress={() => handleSlip(b)}>
                        <Ionicons name="download-outline" size={14} color="#2563EB" />
                        <Text style={styles.btnTextBlue}>Slip</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnSuccess} onPress={() => handlePayment(b, 'check_in_fee')}>
                        <Text style={styles.btnTextWhite}>Pay Check-In Fee</Text>
                      </TouchableOpacity>
                    </>
                  ) : b.status === "checked_in" || b.status === "checked_out" || (b.status === 'approved' && isHall) || b.status === "checkin_payment_done" ? (
                    <TouchableOpacity style={styles.btnOutline} onPress={() => handleSlip(b)}>
                      <Ionicons name="download-outline" size={14} color="#2563EB" />
                      <Text style={styles.btnTextBlue}>Print Allotment Slip</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Guest Details Modal */}
      <Modal visible={isDetailsOpen} animationType="slide" transparent={true} onRequestClose={() => setIsDetailsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="people" size={20} color="#2563EB" style={{marginRight: 8}} />
                <Text style={styles.modalTitle}>Registered Guests</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDetailsOpen(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {selectedBooking?.guest_house_fields?.guest_list?.map((guest: any, idx: number) => (
                <View key={idx} style={styles.guestItem}>
                  <View style={styles.guestMarker} />
                  <Text style={styles.guestName}>{guest.name}</Text>
                  <View style={styles.guestContact}>
                    <Text style={styles.guestContactText}><Ionicons name="mail" size={10} /> {guest.email || "N/A"}</Text>
                    <Text style={styles.guestContactText}><Ionicons name="call" size={10} /> {guest.phone || "N/A"}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  
  filterContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  filterChipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  filterChipTextActive: { color: '#2563EB', fontWeight: 'bold' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 12, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  emptyTitle: { marginTop: 16, fontSize: 16, fontWeight: 'bold', color: '#334155' },
  emptySub: { marginTop: 4, fontSize: 13, color: '#64748B', textAlign: 'center' },

  listContent: { padding: 16, paddingBottom: 110, gap: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardDraft: { borderColor: '#FDE68A', backgroundColor: '#FFFEF5' },
  
  cardHeader: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconContainer: { alignItems: 'center', justifyContent: 'center', marginRight: 12, width: 50 },
  iconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconBgHall: { backgroundColor: '#DBEAFE' },
  iconBgGuest: { backgroundColor: '#E0E7FF' },
  typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  headerInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', flex: 1, marginRight: 8 },
  dateUpdated: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  detailsBox: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC', marginHorizontal: 12, marginTop: 12, borderRadius: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  detailText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  guestBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 },
  guestBtnText: { fontSize: 10, fontWeight: 'bold', color: '#3B82F6' },

  paymentBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginHorizontal: 12, marginTop: 12, paddingVertical: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 6 },
  paymentCol: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paymentText: { fontSize: 11, fontWeight: 'bold' },

  actionsBox: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12, gap: 8 },
  btnDanger: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  btnPrimaryWarn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
  btnSuccess: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
  btnOutline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, gap: 6 },
  btnTextWhite: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  btnTextBlue: { fontSize: 12, fontWeight: 'bold', color: '#2563EB' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  modalBody: { paddingBottom: 20 },
  guestItem: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 8, position: 'relative', overflow: 'hidden' },
  guestMarker: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#3B82F6' },
  guestName: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 6, marginLeft: 8 },
  guestContact: { flexDirection: 'row', gap: 16, marginLeft: 8 },
  guestContactText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
});
