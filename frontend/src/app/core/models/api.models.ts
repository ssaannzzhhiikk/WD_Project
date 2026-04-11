export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  access: string;
  refresh?: string;
  user: User;
}

export type AirQualityStatus = 'good' | 'moderate' | 'unhealthy' | 'hazardous';

export interface AirQualityRecord {
  id: number | string;
  city: string;
  country: string;
  district?: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2?: number | null;
  updatedAt: string;
  source: string;
  latitude: number;
  longitude: number;
  stationCount?: number;
  status: AirQualityStatus;
  note?: string;
}

export interface AirQualityHistoryPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  label?: string;
}

export interface MapLocation {
  id: number | string;
  city: string;
  country: string;
  district?: string;
  latitude: number;
  longitude: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2?: number | null;
  updatedAt: string;
  label?: string;
  source?: string;
}

export interface SuggestionRequest {
  district: string;
  activityType: string;
  sensitivityLevel: string;
  travelMode: string;
  note?: string;
}

export interface SavedSuggestion extends SuggestionRequest {
  id: number;
  summary: string;
  riskLevel: AirQualityStatus;
  currentAqi: number;
  currentPm25: number;
  currentPm10: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AlmatyCityAverageResponse {
  city: string;
  pm25_avg: number | null;
  pm10_avg: number | null;
  aqi_avg: number | null;
  stations_total: number;
  timestamp: string;
  sources?: {
    airgradient?: {
      pm25_avg?: number | null;
      pm10_avg?: number | null;
      stations_count?: number;
    };
    iqair?: {
      pm25_avg?: number | null;
      pm10_avg?: number | null;
      aqi_avg?: number | null;
      stations_count?: number;
    };
  };
}

export interface AlmatyDistrictAverage {
  district: string;
  pm25_avg: number | null;
  pm10_avg: number | null;
  stations_count: number;
}

export interface AlmatyDistrictsResponse {
  city: string;
  timestamp: string;
  districts: AlmatyDistrictAverage[];
}

export interface AlmatyDistrictRating {
  rank: number;
  district: string;
  datetime: string;
  pm25: number | null;
  no2: number | null;
}

export interface AlmatyParticlePoint {
  datetime: string;
  id: string;
  name?: string | null;
  pm25?: number | null;
  pm10?: number | null;
  lat?: number | null;
  lon?: number | null;
  district?: string | null;
  origin?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AlmatyNo2Point {
  datetime: string;
  id: string;
  name?: string | null;
  no2?: number | null;
  lat?: number | null;
  lon?: number | null;
  district?: string | null;
  origin?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AlmatyStation {
  id: string;
  name?: string | null;
  lat: number;
  lon: number;
  origin: string;
}

export interface AlmatyTimelinePoint {
  datetime: string;
  pm25_stations?: number;
  no2_stations?: number;
  total_stations?: number;
}

export interface AlmatyPaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  errors?: Record<string, string[] | string>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
