import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/hooks/AlertContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

interface Resource {
  _id: string;
  name: string;
  image?: string;
  category: string;
  type?: string;
  status: string; // "active" or "maintenance"
  capacity: number;
  buildingName?: string;
  roomNo?: string;
  description?: string; 
}

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${BASE_URL}/api/v1/resources/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch resource details.");
      }

      const data = await response.json();
      
      if (data.success) {
        setResource(data.data);
      } else {
        setError(data.message || "Failed to load resource data");
      }
    } catch (err) {
      console.error("Error fetching resource:", err);
      setError("Could not load resource details. It might have been removed.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!resource || resource.status !== 'active') return;
    // Note: To be implemented when booking flow is created
    showAlert("Booking Started", `Navigating to booking for ${resource.name}...`);
    // router.push(`/booking?tab=${resource.category}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !resource) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Resource Not Found</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Return to Catalog</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const imageUrl = resource.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop';
  const isActive = resource.status === 'active' || resource.status === 'Available';
  const isHall = resource.category.toLowerCase().includes('hall');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Image Area */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          <View style={styles.headerOverlay}>
            <SafeAreaView edges={['top']} style={styles.topBar}>
              <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#0F172A" />
              </TouchableOpacity>
              <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                <View style={[styles.statusDot, isActive ? {backgroundColor: '#10B981'} : {backgroundColor: '#EF4444'}]} />
                <Text style={[styles.statusText, isActive ? {color: '#065F46'} : {color: '#991B1B'}]}>
                  {resource.status}
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          {/* Tags */}
          <View style={styles.tagsContainer}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{resource.category.replace('_', ' ')}</Text>
            </View>
            {resource.type && (
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{resource.type}</Text>
              </View>
            )}
          </View>

          {/* Title & Meta */}
          <Text style={styles.title}>{resource.name}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={20} color="#3B82F6" />
              <Text style={styles.metaItemText}>
                {resource.buildingName || "Main Campus"} {resource.roomNo ? `(${resource.roomNo})` : ''}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={20} color="#8B5CF6" />
              <Text style={styles.metaItemText}>Up to {resource.capacity} People</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* About Section */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={22} color="#3B82F6" /> About this Space
          </Text>
          <Text style={styles.description}>
            {resource.description || `This ${resource.type?.toLowerCase() || 'facility'} is part of the ${resource.category.replace('_', ' ')} category located at ${resource.buildingName || 'the university'}. It is well-maintained and suitable for university staff, students, and approved guests. Please refer to your booking allocation slip for specific entry instructions.`}
          </Text>

          <View style={styles.divider} />

          {/* Amenities Section */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" /> Included Amenities
          </Text>
          <View style={styles.amenitiesGrid}>
            {isHall ? (
              <>
                <AmenityItem icon="tv-outline" text="HD Projector" />
                <AmenityItem icon="snow-outline" text="Air Conditioning" />
                <AmenityItem icon="wifi-outline" text="High-Speed WiFi" />
                <AmenityItem icon="mic-outline" text="PA System" />
                <AmenityItem icon="cafe-outline" text="Catering Area" />
              </>
            ) : (
              <>
                <AmenityItem icon="snow-outline" text="Air Conditioning" color="#8B5CF6" />
                <AmenityItem icon="wifi-outline" text="Free WiFi" color="#8B5CF6" />
                <AmenityItem icon="cafe-outline" text="Room Service" color="#8B5CF6" />
                <AmenityItem icon="shield-checkmark-outline" text="24/7 Security" color="#8B5CF6" />
              </>
            )}
          </View>

          <View style={styles.divider} />

          {/* Rules Section */}
          <Text style={styles.sectionTitle}>
            <Ionicons name="warning" size={22} color="#F59E0B" /> Rules & Guidelines
          </Text>
          <View style={styles.rulesBox}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>
                <Text style={styles.ruleBold}>Prior Approval:</Text> Approval from the Head of Department (HOD) is mandatory for all university-affiliated bookings.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>
                <Text style={styles.ruleBold}>Property Damage:</Text> Any physical damage to the property or its amenities during the allocation period will be heavily fined.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.priceLabel}>Status</Text>
            <Text style={[styles.priceValue, isActive ? {color: '#10B981'} : {color: '#EF4444'}]}>
              {isActive ? "Available to Book" : "Unavailable"}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.bookButton, !isActive && styles.bookButtonDisabled]} 
            disabled={!isActive}
            onPress={handleBookNow}
          >
            <Text style={styles.bookButtonText}>Start Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const AmenityItem = ({ icon, text, color = "#3B82F6" }: { icon: any, text: string, color?: string }) => (
  <View style={styles.amenityItem}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={styles.amenityText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100, // Make room for bottom bar
  },
  heroContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTagText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeTag: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    width: '48%',
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  rulesBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginTop: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  ruleBold: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
