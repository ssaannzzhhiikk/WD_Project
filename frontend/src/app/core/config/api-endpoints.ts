import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
  },
  airQuality: {
    list: '/air-quality/',
    current: '/air-quality/current/',
    map: '/air-quality/map/',
    history: '/air-quality/history/',
  },
  cities: {
    list: '/cities/',
    detail: (id: number) => `/cities/${id}/`,
  },
} as const;

export function buildApiUrl(path: string): string {
  const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  return `${baseUrl}${path}`;
}
