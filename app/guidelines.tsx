import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

export default function GuidelinesScreen() {
  const router = useRouter();

  const rules = [
    {
      icon: "wallet",
      title: "Pre-Booking Fees",
      desc: "A 40% pre-booking fee is required to confirm all guest house reservations. The remaining balance must be paid upon check-in or checkout as per administration policy."
    },
    {
      icon: "document-text",
      title: "Prior Approval",
      desc: "Approval from the Head of Department (HOD) is strictly mandatory for all university-affiliated bookings. Please ensure the HOD forward letter is uploaded during the application."
    },
    {
      icon: "id-card",
      title: "Identity & Documentation",
      desc: "A valid University ID or Government-issued ID must be presented physically at the time of key handover. Foreign nationals must present a valid passport."
    },
    {
      icon: "time",
      title: "Standard Timings",
      desc: "Standard check-in time is 12:00 PM and check-out is 11:00 AM. Early check-ins or late check-outs are subject to availability and may incur additional charges."
    },
    {
      icon: "close-circle",
      title: "Cancellations & Refunds",
      desc: "Cancellations must be requested at least 48 hours prior to the scheduled booking date to be eligible for a partial refund. Late cancellations will result in forfeiture of the fee."
    },
    {
      icon: "alert-circle",
      title: "Property Damage & Conduct",
      desc: "Guests are expected to maintain decorum. Any physical damage to the property or its amenities during the allocation period will be heavily fined and billed directly to the applicant."
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rules & Guidelines</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introBox}>
          <Ionicons name="information-circle" size={28} color="#4F46E5" />
          <Text style={styles.introText}>
            Please read the following guidelines carefully before applying for a guest house or hall allocation. Strict adherence is expected from all applicants.
          </Text>
        </View>

        <View style={styles.rulesContainer}>
          {rules.map((rule, index) => (
            <View key={index} style={styles.ruleCard}>
              <View style={styles.ruleIconBox}>
                <Ionicons name={rule.icon as any} size={22} color="#4F46E5" />
              </View>
              <View style={styles.ruleTextContent}>
                <Text style={styles.ruleTitle}>{rule.title}</Text>
                <Text style={styles.ruleDesc}>{rule.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For further queries, please contact the administration via the Support page.
          </Text>
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
    paddingBottom: 40,
  },
  introBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  introText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  rulesContainer: {
    gap: 16,
  },
  ruleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  ruleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ruleTextContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  ruleDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
