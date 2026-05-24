import { TouchableOpacity, Text } from 'react-native';

export default function Button({ title }: { title: string }) {
  return <TouchableOpacity><Text>{title}</Text></TouchableOpacity>;
}
