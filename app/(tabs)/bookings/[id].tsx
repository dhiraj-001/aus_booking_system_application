import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  return <View><Text>Booking {id}</Text></View>;
}
