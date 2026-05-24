import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, localhost is 10.0.2.2. For iOS simulator, it's localhost.
// Replace with your actual local IP if testing on a physical device.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
  return 'https://your-production-url.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
