import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

export default function SupportScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL('mailto:registrar@aus.ac.in');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+9103842270806');
  };

  const handleMap = () => {
    // Basic fallback query if scheme fails
    const url = Platform.select({
      ios: 'maps:0,0?q=Assam+University,+Silchar',
      android: 'geo:0,0?q=Assam+University,+Silchar'
    });
    Linking.openURL(url as string);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Contact</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={40} color="#4F46E5" />
          </View>
          <Text style={styles.appName}>AU Booking</Text>
          <Text style={styles.appDesc}>
            The official portal for Assam University guest house and hall allocations. We streamline reservations to provide a seamless experience for students, faculty, and guests.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          <TouchableOpacity style={styles.contactRow} onPress={handleMap}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="location" size={20} color="#4F46E5" />
            </View>
            <View style={styles.contactTextWrapper}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>Assam University, Silchar{'\n'}788 011, Assam, India</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.contactRow} onPress={handlePhone}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="call" size={20} color="#10B981" />
            </View>
            <View style={styles.contactTextWrapper}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+91 03842-270806</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="mail" size={20} color="#F59E0B" />
            </View>
            <View style={styles.contactTextWrapper}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>registrar@aus.ac.in</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Assam University, Silchar.{'\n'}All rights reserved.
          </Text>
          <Text style={styles.footerTextDev}>Developed by Dhiraj</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  appDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  contactIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactTextWrapper: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 76,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.7,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerTextDev: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
