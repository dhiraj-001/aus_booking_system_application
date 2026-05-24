import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBadge } from '@/components/StatusBadge';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/bookings/${id}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.data || data.booking || data);
          
          const allocRes = await fetch(`${BASE_URL}/api/bookings/allocation/${id}`);
          if (allocRes.ok) {
            const allocData = await allocRes.json();
            const allocs = allocData.data || allocData.allocation || allocData;
            if (Array.isArray(allocs)) setAllocations(allocs);
            else setAllocations([allocs]);          }
        }
      } catch (err) {
        console.error("Failed to fetch booking details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "TBD";
    const d = new Date(dateString);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "TBD";
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${BASE_URL}/${path.replace(/\\/g, '/')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.navigate('/bookings')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isHall = booking.booking_type === 'hall';
  const guestList = booking.guest_house_fields?.guest_list || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.navigate('/bookings')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.headerTitle}>{isHall ? 'Seminar Hall Requisition' : 'Guest House Booking'}</Text>
            <Text style={styles.headerSub}>ID: {booking.booking_id || booking._id}</Text>
          </View>
          <StatusBadge status={booking.status} />
        </View>

        {/* Basic Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Application Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Applied On</Text>
              <Text style={styles.infoValue}>{formatDate(booking.createdAt)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(booking.updatedAt)}</Text>
            </View>
          </View>
          {booking.details && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.infoLabel}>Purpose / Note</Text>
              <Text style={styles.infoValue}>{booking.details}</Text>
            </View>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Check In</Text>
              <Text style={styles.timeValue}>{formatDate(booking.check_in_time)}</Text>
              <Text style={styles.timeSub}>{formatTime(booking.check_in_time)}</Text>
            </View>
            <View style={styles.timeDivider}>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={styles.timeValue}>{formatDate(booking.check_out_time)}</Text>
              <Text style={styles.timeSub}>{formatTime(booking.check_out_time)}</Text>
            </View>
          </View>
        </View>

        {/* Guests */}
        {!isHall && guestList.length > 0 && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.cardTitle}>Guest List ({guestList.length})</Text>
            </View>
            {guestList.map((guest: any, idx: number) => (
              <View key={idx} style={[styles.guestItem, idx > 0 && { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 }]}>
                <View style={styles.guestIcon}>
                  <Ionicons name="person" size={16} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.guestName}>{guest.name || `Guest ${idx + 1}`}</Text>
                  {guest.email ? <Text style={styles.guestContact}>{guest.email}</Text> : null}
                  {guest.phone ? <Text style={styles.guestContact}>{guest.phone}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Allocations */}
        {allocations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Allocated Resources</Text>
            {allocations.map((alloc, idx) => (
              <View key={alloc._id} style={styles.allocationCard}>
                <Ionicons name="location" size={20} color="#059669" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.allocationName}>
                    {alloc.resource_id?.name || 'Unknown Resource'}
                  </Text>
                  {alloc.resource_id?.roomNo && (
                    <Text style={styles.allocationMeta}>Room: {alloc.resource_id.roomNo}</Text>
                  )}
                  {alloc.resource_id?.buildingName && (
                    <Text style={styles.allocationMeta}>Building: {alloc.resource_id.buildingName}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Documents */}
        {(booking.id_photo || booking.hod_forward_letter) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attached Documents</Text>
            {booking.id_photo && (
              <TouchableOpacity style={styles.docRow} onPress={() => Linking.openURL(getFileUrl(booking.id_photo))}>
                <Ionicons name="id-card" size={20} color="#2563EB" />
                <Text style={styles.docText}>ID Proof</Text>
                <Ionicons name="download-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            {booking.hod_forward_letter && (
              <TouchableOpacity style={[styles.docRow, { marginTop: 8 }]} onPress={() => Linking.openURL(getFileUrl(booking.hod_forward_letter))}>
                <Ionicons name="document-text" size={20} color="#2563EB" />
                <Text style={styles.docText}>HOD Letter</Text>
                <Ionicons name="download-outline" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { flex: 1, paddingHorizontal: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  emptyText: { marginTop: 12, fontSize: 16, color: '#4B5563', fontWeight: '500' },
  
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#F0F4FF'
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingHorizontal: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#6B7280', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 14 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600' },
  
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  timeBox: { flex: 1, alignItems: 'center' },
  timeDivider: { width: 30, alignItems: 'center' },
  timeLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 },
  timeValue: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  timeSub: { fontSize: 12, color: '#4F46E5', fontWeight: '700' },
  
  guestItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  guestIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  guestName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  guestContact: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },

  allocationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#A7F3D0' },
  allocationName: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  allocationMeta: { fontSize: 12, color: '#047857', marginTop: 2, fontWeight: '600' },

  docRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  docText: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600', color: '#111827' }
});
