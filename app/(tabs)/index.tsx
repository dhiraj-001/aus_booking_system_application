import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/AuthContext';

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

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedResources();
  }, []);

  const fetchFeaturedResources = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/resources`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Just take the first 5 resources as featured
          setFeaturedResources(data.data.slice(0, 5));
        }
      }
    } catch (err) {
      console.error("Error fetching featured resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLink = (route: string) => {
    router.push(route as any);
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop';
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  const getFirstName = (name?: string) => {
    if (!name) return 'User';
    return name.split(' ')[0];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{getFirstName(user?.name)} 👋</Text>
          </View>
          
        </View>

        {/* Hero Card */}
        <TouchableOpacity style={styles.heroCard} activeOpacity={0.9} onPress={() => handleQuickLink('/resources')}>
          <Image 
            source={{ uri: featuredResources.length > 0 ? getImageUrl(featuredResources[0].image) : "" }} 
            style={styles.heroImage} 
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTag}>Available Now</Text>
            <Text style={styles.heroTitle}>Find the perfect space for your needs</Text>
            <View style={styles.heroAction}>
              <Text style={styles.heroActionText}>Browse Resources</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Links Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickLinksContainer}>
          <QuickLinkCard 
            icon="calendar" 
            title="My Bookings" 
            color="#E0E7FF" 
            iconColor="#4F46E5" 
            onPress={() => handleQuickLink('/bookings')} 
          />
          <QuickLinkCard 
            icon="business" 
            title="All Spaces" 
            color="#DDF4FF" 
            iconColor="#0284C7" 
            onPress={() => handleQuickLink('/resources')} 
          />
          <QuickLinkCard 
            icon="document-text" 
            title="Guidelines" 
            color="#FCE7F3" 
            iconColor="#DB2777" 
            onPress={() => handleQuickLink('/guidelines')} 
          />
          <QuickLinkCard 
            icon="help-circle" 
            title="Support" 
            color="#FEF3C7" 
            iconColor="#D97706" 
            onPress={() => handleQuickLink('/support')} 
          />
        </View>

        {/* Featured Resources Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleWithoutMargin}>Popular Spaces</Text>
          <TouchableOpacity onPress={() => handleQuickLink('/resources')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4F46E5" />
          </View>
        ) : featuredResources.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={{color: '#94A3B8'}}>No featured spaces available.</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselContent}
          >
            {featuredResources.map((resource) => {
              const imageUrl = getImageUrl(resource.image);
              
              return (
                <TouchableOpacity 
                  key={resource._id} 
                  style={styles.resourceCard}
                  activeOpacity={0.8}
                  onPress={() => handleQuickLink(`/resources/${resource._id}`)}
                >
                  <Image source={{ uri: imageUrl }} style={styles.resourceImage} />
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceName} numberOfLines={1}>{resource.name}</Text>
                    <View style={styles.resourceMeta}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="people" size={12} color="#64748B" />
                        <Text style={styles.metaText}>Up to {resource.capacity || 0}</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Ionicons name="pricetag" size={12} color="#64748B" />
                        <Text style={styles.metaText}>{resource.buildingName || resource.type || resource.category}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-component for Quick Links
const QuickLinkCard = ({ icon, title, color, iconColor, onPress }: any) => (
  <TouchableOpacity style={styles.quickLinkItem} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.quickLinkIconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon as any} size={24} color={iconColor} />
    </View>
    <Text style={styles.quickLinkText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  loadingContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  heroCard: {
    marginHorizontal: 20,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: 24,
    justifyContent: 'flex-end',
  },
  heroTag: {
    backgroundColor: '#10B981',
    color: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    width: '85%',
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleWithoutMargin: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickLinkItem: {
    alignItems: 'center',
    width: '23%',
  },
  quickLinkIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
  resourceCard: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resourceImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  resourceInfo: {
    padding: 16,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  resourceMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
});
