import { Platform } from 'react-native';

const DEV_PORT = '8000';
const DEV_HOST = '192.168.43.188';

function getBaseUrl(): string {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${DEV_HOST}:${DEV_PORT}/api`;
    }

    return `http://localhost:${DEV_PORT}/api`;
  }

  return `https://your-production-domain.com/api`;
}

function getHost(): string {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${DEV_HOST}:${DEV_PORT}`;
    }

    return `http://localhost:${DEV_PORT}`;
  }

  return `https://your-production-domain.com`;
}

export const API_BASE_URL = getBaseUrl();
export const API_HOST = getHost();