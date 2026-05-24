import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS = {
  DRAFT: "draft",
  PENDING_HOD: "pending_hod",
  PENDING_REGISTRAR: "pending_registrar",
  PENDING_ADMIN: "pending_admin",
  APPROVED: "approved",
  AWAITING_BOOKING_PAYMENT: "awaiting_booking_payment",
  BOOKING_PAYMENT_DONE: "booking_payment_done",
  AWAITING_CHECKIN_PAYMENT: "awaiting_checkin_payment",
  CHECKIN_PAYMENT_DONE: "checkin_payment_done",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

export const getStatusConfig = (status: string) => {
  switch (status) {
    case STATUS.DRAFT:
      return { label: "Draft", bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' }; // Amber
    case STATUS.PENDING_HOD:
      return { label: "Awaiting HOD", bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }; // Slate
    case STATUS.PENDING_REGISTRAR:
      return { label: "Awaiting Registrar", bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }; // Slate
    case STATUS.PENDING_ADMIN:
      return { label: "Awaiting Admin", bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }; // Slate
    case STATUS.APPROVED:
      return { label: "Approved", bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }; // Emerald
    case STATUS.AWAITING_BOOKING_PAYMENT:
      return { label: "Awaiting Booking Fee", bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }; // Blue
    case STATUS.AWAITING_CHECKIN_PAYMENT:
      return { label: "Awaiting Check-in Fee", bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' }; // Blue
    case STATUS.CHECKED_IN:
      return { label: "Checked In", bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' }; // Indigo
    case STATUS.CHECKED_OUT:
      return { label: "Checked Out", bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' }; // Gray
    case STATUS.CANCELLED:
      return { label: "Cancelled", bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }; // Red
    case STATUS.REJECTED:
      return { label: "Rejected", bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }; // Red
    default:
      return { label: status.replace(/_/g, ' '), bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
  }
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
