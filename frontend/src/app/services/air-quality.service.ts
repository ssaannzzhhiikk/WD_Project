import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: number;
  name: string;
  locality: string | null;
  timezone: string;
  isMonitor: boolean;
  coordinates: Coordinates;
  datetimeLast: { utc: string } | null;
}

export interface OpenAQv3Response {
  results: Location[];
}

@Injectable({ providedIn: 'root' })
export class AirQualityService {
  private base = '/openaq/v3';

  constructor(private http: HttpClient) {}

  getLocations(): Observable<OpenAQv3Response> {
    return this.http.get<OpenAQv3Response>(
      `${this.base}/locations?coordinates=43.2220,76.8512&radius=15000&limit=10`
    );
  }
}