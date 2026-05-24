import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Platform-specific API URL for local development
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

interface Resource {
  _id: string;
  name: string;
  image: string;
  category: string;
  type: string;
  status: string;
  capacity: number;
  buildingName: string;
}

const CATEGORIES = ['All', 'guest_house', 'hall']; // Matching the frontend categories format
const CATEGORY_LABELS: Record<string, string> = {
  'All': 'All Spaces',
  'guest_house': 'Guest House',
  'hall': 'Hall'
};

export default function ResourcesScreen() {
  const router = useRouter();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('All');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${BASE_URL}/api/v1/resources`);

      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data = await response.json();
      
      if (data.success) {
        setResources(data.data);
        const uniqueTypes = [...new Set(data.data.map((item: Resource) => item.type).filter(Boolean))] as string[];
        setTypes(uniqueTypes);
      } else {
        setError("Failed to load resource data");
      }
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError("Could not connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((r) => {
    // Search filter
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.buildingName && r.buildingName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter
    let matchesCategory = true;
    if (activeCategory !== 'All') {
      const normalizedApiCategory = r.category.toLowerCase().replace(/ /g, "_");
      matchesCategory = normalizedApiCategory === activeCategory;
    }

    // Type filter
    let matchesType = true;
    if (activeType !== 'All') {
      matchesType = r.type ? r.type.toLowerCase() === activeType.toLowerCase() : false;
    }

    return matchesSearch && matchesCategory && matchesType;
  });

  const renderResourceCard = ({ item }: { item: Resource }) => {
    // Default image if missing
    const imageUrl = item.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop';
    const isAvailable = item.status === 'Available' || item.status === 'active' || item.status === 'Active';
    
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        activeOpacity={0.8}
        onPress={() => router.push(`/resources/${item._id}` as any)}
      >
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        
        <View style={styles.cardStatusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: isAvailable ? '#10B981' : (item.status?.toLowerCase() === 'booked' ? '#EF4444' : '#F59E0B') }]}>
            <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardType}>{item.buildingName || item.type || item.category}</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.metaInfo}>
              <Ionicons name="people-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>Up to {item.capacity || 0}</Text>
            </View>
            <View style={styles.actionButton}>
              <Text style={styles.actionText}>View Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#4F46E5" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Space</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or building..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Filter */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({ item }) => {
            const isActive = activeCategory === item;
            return (
              <TouchableOpacity 
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => {
                  setActiveCategory(item);
                  setActiveType('All'); // Reset type when category changes
                }}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {CATEGORY_LABELS[item] || item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Types Filter (Sub-category) */}
      {types.length > 0 && activeCategory !== 'All' && (
        <View style={styles.typesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            <TouchableOpacity 
              style={[styles.typeChip, activeType === 'All' && styles.typeChipActive]}
              onPress={() => setActiveType('All')}
            >
              <Text style={[styles.typeText, activeType === 'All' && styles.typeTextActive]}>All Types</Text>
            </TouchableOpacity>
            {types.map((t) => {
               const isActive = activeType === t;
               return (
                 <TouchableOpacity 
                   key={t}
                   style={[styles.typeChip, isActive && styles.typeChipActive]}
                   onPress={() => setActiveType(t)}
                 >
                   <Text style={[styles.typeText, isActive && styles.typeTextActive]}>{t}</Text>
                 </TouchableOpacity>
               );
            })}
          </ScrollView>
        </View>
      )}

      {/* Resource List / Loading / Error */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading spaces...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchResources}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item._id}
          renderItem={renderResourceCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyStateTitle}>No spaces found</Text>
              <Text style={styles.emptyStateSub}>Try adjusting your search or filters.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#334155',
  },
  clearIcon: {
    padding: 4,
  },
  categoriesWrapper: {
    marginBottom: 16,
  },
  typesWrapper: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  typeTextActive: {
    color: '#334155',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardStatusContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardType: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
