import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, throwError } from 'rxjs';
import { API_ENDPOINTS, buildApiUrl } from '../config/api-endpoints';
import {
  AirQualityHistoryPoint,
  AirQualityRecord,
  AlmatyCityAverageResponse,
  AlmatyDistrictAverage,
  AlmatyDistrictRating,
  AlmatyDistrictsResponse,
  AlmatyNo2Point,
  AlmatyPaginatedResponse,
  AlmatyParticlePoint,
  MapLocation,
  PaginatedResponse,
} from '../models/api.models';
import { ApiErrorService } from './api-error.service';
import { environment } from '../../../environments/environment';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type AirQualityListResponse = AirQualityRecord[] | PaginatedResponse<AirQualityRecord>;
type MapResponse = MapLocation[] | PaginatedResponse<MapLocation>;
type HistoryResponse = AirQualityHistoryPoint[] | PaginatedResponse<AirQualityHistoryPoint>;
type CurrentResponse = AirQualityRecord | AirQualityRecord[] | PaginatedResponse<AirQualityRecord>;

@Injectable({ providedIn: 'root' })
export class AirQualityService {
  private readonly http = inject(HttpClient);
  private readonly apiErrorService = inject(ApiErrorService);

  private readonly airDataSource = environment.airDataSource;
  private readonly almatyAirBaseUrl = environment.almatyAirBaseUrl;

  getCitySummary(): Observable<AirQualityRecord> {
    if (this.airDataSource === 'almaty-air') {
      return this.http
        .get<AlmatyCityAverageResponse>(this.buildAlmatyUrl('/api/city/average'))
        .pipe(
          map((response) => this.mapCityAverage(response)),
          catchError((error) =>
            throwError(
              () =>
                new Error(
                  this.apiErrorService.getMessage(
                    error,
                    'Unable to load the Almaty city summary right now.',
                  ),
                ),
            ),
          ),
        );
    }

    return this.getCurrentAirQuality();
  }

  getAirQualityList(params?: QueryParams): Observable<AirQualityRecord[]> {
    if (this.airDataSource === 'almaty-air') {
      return forkJoin({
        districts: this.http.get<AlmatyDistrictsResponse>(
          this.buildAlmatyUrl('/api/city/districts'),
        ),
        ratings: this.http.get<AlmatyDistrictRating[]>(
          this.buildAlmatyUrl('/api/ratings/districts'),
          { params: this.buildParams({ limit: 8 }) },
        ),
      }).pipe(
        map(({ districts, ratings }) => this.mapDistrictRecords(districts, ratings, params)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                this.apiErrorService.getMessage(
                  error,
                  'Unable to load district air quality data for Almaty right now.',
                ),
              ),
          ),
        ),
      );
    }

    return this.http
      .get<AirQualityListResponse>(buildApiUrl(API_ENDPOINTS.airQuality.list), {
        params: this.buildParams(params),
      })
      .pipe(
        map((response) => this.extractResults(response)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                this.apiErrorService.getMessage(
                  error,
                  'Unable to load the dashboard data right now.',
                ),
              ),
          ),
        ),
      );
  }

  getCurrentAirQuality(district?: string): Observable<AirQualityRecord> {
    if (this.airDataSource === 'almaty-air') {
      if (!district?.trim()) {
        return this.getCitySummary();
      }

      return this.getAirQualityList({ district }).pipe(
        map((records) => {
          const record = records[0];

          if (!record) {
            throw new Error('No live district data was returned for that part of Almaty.');
          }

          return record;
        }),
      );
    }

    return this.http
      .get<CurrentResponse>(buildApiUrl(API_ENDPOINTS.airQuality.current), {
        params: this.buildParams({ city: district }),
      })
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return response[0];
          }

          if ('results' in response) {
            return response.results[0];
          }

          return response;
        }),
        map((record) => {
          if (!record) {
            throw new Error('No air quality data was returned for the selected area.');
          }

          return record;
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                this.apiErrorService.getMessage(
                  error,
                  'Unable to load the current air quality details.',
                ),
              ),
          ),
        ),
      );
  }

  getMapData(params?: QueryParams): Observable<MapLocation[]> {
    if (this.airDataSource === 'almaty-air') {
      return forkJoin({
        pm25: this.http.get<AlmatyParticlePoint[]>(this.buildAlmatyUrl('/api/pm25/hourly/latest')),
        pm10: this.http.get<AlmatyParticlePoint[]>(this.buildAlmatyUrl('/api/pm10/hourly/latest')),
        no2: this.http.get<AlmatyNo2Point[]>(this.buildAlmatyUrl('/api/no2/hourly/latest')),
      }).pipe(
        map(({ pm25, pm10, no2 }) => this.mapStationLocations(pm25, pm10, no2, params)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                this.apiErrorService.getMessage(
                  error,
                  'Unable to load live station markers for the Almaty map right now.',
                ),
              ),
          ),
        ),
      );
    }

    return this.http
      .get<MapResponse>(buildApiUrl(API_ENDPOINTS.airQuality.map), {
        params: this.buildParams(params),
      })
      .pipe(
        map((response) => this.extractResults(response)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                this.apiErrorService.getMessage(error, 'Unable to load map locations right now.'),
              ),
          ),
        ),
      );
  }

  getHistory(district: string): Observable<AirQualityHistoryPoint[]> {
    if (this.airDataSource === 'almaty-air') {
      const from = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const commonParams = { from, limit: 400, offset: 0 };

      return forkJoin({
        pm25: this.http.get<AlmatyPaginatedResponse<AlmatyParticlePoint>>(
          this.buildAlmatyUrl('/api/pm25/hourly'),
          { params: this.buildParams(commonParams) },
        ),
        pm10: this.http.get<AlmatyPaginatedResponse<AlmatyParticlePoint>>(
          this.buildAlmatyUrl('/api/pm10/hourly'),
          { params: this.buildParams(commonParams) },
        ),
      }).pipe(
        map(({ pm25, pm10 }) => this.mapDistrictHistory(pm25.items, pm10.items, district)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                this.apiErrorService.getMessage(
                  error,
                  'Unable to load recent district history for Almaty right now.',
                ),
              ),
          ),
        ),
      );
    }

    return this.http
      .get<HistoryResponse>(buildApiUrl(API_ENDPOINTS.airQuality.history), {
        params: this.buildParams({ city: district }),
      })
      .pipe(
        map((response) => this.extractResults(response)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                this.apiErrorService.getMessage(
                  error,
                  'Unable to load the air quality history for this city.',
                ),
              ),
          ),
        ),
      );
  }

  private mapCityAverage(response: AlmatyCityAverageResponse): AirQualityRecord {
    const pm25 = response.pm25_avg ?? 0;
    const pm10 = response.pm10_avg ?? 0;
    const aqi = Math.round(response.aqi_avg ?? this.calculateAqi(pm25, pm10));

    return {
      id: 'almaty-city',
      city: 'Almaty',
      country: 'Kazakhstan',
      aqi,
      pm25,
      pm10,
      updatedAt: response.timestamp,
      source: 'Almaty Air Initiative',
      latitude: 43.2389,
      longitude: 76.8897,
      stationCount: response.stations_total,
      status: this.getAqiStatus(aqi),
      note: 'City-wide average across active Almaty monitoring stations.',
    };
  }

  private mapDistrictRecords(
    response: AlmatyDistrictsResponse,
    ratings: AlmatyDistrictRating[],
    params?: QueryParams,
  ): AirQualityRecord[] {
    const ratingMap = new Map(
      ratings.map((item) => [this.normalizeText(item.district), item]),
    );

    return response.districts
      .map((district) => this.mapDistrictRecord(district, response.timestamp, ratingMap))
      .filter((record) => this.matchesDistrictFilters(record, params))
      .sort((left, right) => right.aqi - left.aqi);
  }

  private mapDistrictRecord(
    district: AlmatyDistrictAverage,
    updatedAt: string,
    ratingMap: Map<string, AlmatyDistrictRating>,
  ): AirQualityRecord {
    const pm25 = district.pm25_avg ?? 0;
    const pm10 = district.pm10_avg ?? 0;
    const aqi = this.calculateAqi(pm25, pm10);
    const rating = ratingMap.get(this.normalizeText(district.district));

    return {
      id: this.normalizeText(district.district) || district.district,
      city: 'Almaty',
      country: 'Kazakhstan',
      district: district.district,
      aqi,
      pm25,
      pm10,
      no2: rating?.no2 ?? null,
      updatedAt: rating?.datetime ?? updatedAt,
      source: 'Almaty Air Initiative',
      latitude: 43.2389,
      longitude: 76.8897,
      stationCount: district.stations_count,
      status: this.getAqiStatus(aqi),
      note: rating?.rank
        ? `Current district rank: #${rating.rank} across Almaty.`
        : undefined,
    };
  }

  private mapStationLocations(
    pm25Points: AlmatyParticlePoint[],
    pm10Points: AlmatyParticlePoint[],
    no2Points: AlmatyNo2Point[],
    params?: QueryParams,
  ): MapLocation[] {
    const pm10Map = new Map(pm10Points.map((item) => [String(item.id), item]));
    const no2Map = new Map(no2Points.map((item) => [String(item.id), item]));
    const locations: MapLocation[] = [];

    for (const point of pm25Points) {
      if (
        !this.isFresh(point.datetime, 96) ||
        !this.isWithinAlmatyBounds(point.lat, point.lon)
      ) {
        continue;
      }

      const linkedPm10 = pm10Map.get(String(point.id));
      const linkedNo2 = no2Map.get(String(point.id));
      const pm25 = point.pm25 ?? 0;
      const pm10 = linkedPm10?.pm10 ?? 0;
      const aqi = this.calculateAqi(pm25, pm10);

      locations.push({
        id: String(point.id),
        city: 'Almaty',
        country: 'Kazakhstan',
        district: point.district ?? 'Almaty area',
        latitude: point.lat ?? 43.2389,
        longitude: point.lon ?? 76.8897,
        aqi,
        pm25,
        pm10,
        no2: linkedNo2?.no2 ?? null,
        updatedAt: point.datetime,
        label: point.name || point.district || 'Station',
        source: point.source ?? point.origin ?? 'Almaty Air Initiative',
      });
    }

    return locations
      .filter((location) => this.matchesLocationFilters(location, params))
      .sort((left, right) => right.aqi - left.aqi)
      .slice(0, 40);
  }

  private mapDistrictHistory(
    pm25Points: AlmatyParticlePoint[],
    pm10Points: AlmatyParticlePoint[],
    district: string,
  ): AirQualityHistoryPoint[] {
    const selectedDistrict = this.normalizeText(district);
    const timeline = new Map<string, { pm25Values: number[]; pm10Values: number[] }>();

    for (const point of pm25Points) {
      if (
        this.normalizeText(point.district) !== selectedDistrict ||
        !this.isFresh(point.datetime, 72)
      ) {
        continue;
      }

      const bucket = timeline.get(point.datetime) ?? { pm25Values: [], pm10Values: [] };
      bucket.pm25Values.push(point.pm25 ?? 0);
      timeline.set(point.datetime, bucket);
    }

    for (const point of pm10Points) {
      if (
        this.normalizeText(point.district) !== selectedDistrict ||
        !this.isFresh(point.datetime, 72)
      ) {
        continue;
      }

      const bucket = timeline.get(point.datetime) ?? { pm25Values: [], pm10Values: [] };
      bucket.pm10Values.push(point.pm10 ?? 0);
      timeline.set(point.datetime, bucket);
    }

    return [...timeline.entries()]
      .map(([timestamp, values]) => {
        const pm25 = this.average(values.pm25Values);
        const pm10 = this.average(values.pm10Values);

        return {
          timestamp,
          pm25,
          pm10,
          aqi: this.calculateAqi(pm25, pm10),
          label: district,
        };
      })
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
      .slice(-12)
      .reverse();
  }

  private matchesDistrictFilters(record: AirQualityRecord, params?: QueryParams): boolean {
    const districtFilter = this.normalizeText(params?.['district'] ?? params?.['city']);
    const minAqi = Number(params?.['min_aqi'] ?? params?.['minAqiThreshold'] ?? 0);
    const districtLabel = this.normalizeText(`${record.district ?? ''} ${record.city}`);

    return (!districtFilter || districtLabel.includes(districtFilter)) && (!minAqi || record.aqi >= minAqi);
  }

  private matchesLocationFilters(location: MapLocation, params?: QueryParams): boolean {
    const districtFilter = this.normalizeText(params?.['district'] ?? params?.['city']);
    const sourceFilter = this.normalizeText(params?.['source']);
    const minAqi = Number(params?.['min_aqi'] ?? 0);
    const locationLabel = this.normalizeText(`${location.district ?? ''} ${location.label ?? ''}`);
    const sourceLabel = this.normalizeText(location.source);

    return (
      (!districtFilter || locationLabel.includes(districtFilter)) &&
      (!sourceFilter || sourceLabel.includes(sourceFilter)) &&
      (!minAqi || location.aqi >= minAqi)
    );
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isFresh(timestamp: string, maxAgeHours: number): boolean {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return Date.now() - date.getTime() <= maxAgeHours * 60 * 60 * 1000;
  }

  private isWithinAlmatyBounds(latitude?: number | null, longitude?: number | null): boolean {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return false;
    }

    return latitude >= 43.12 && latitude <= 43.42 && longitude >= 76.72 && longitude <= 77.06;
  }

  private average(values: number[]): number {
    return values.length
      ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1))
      : 0;
  }

  private buildAlmatyUrl(path: string): string {
    return `${this.almatyAirBaseUrl.replace(/\/$/, '')}${path}`;
  }

  private calculateAqi(pm25: number, pm10: number): number {
    const pm25Aqi = this.calculateSubIndex(pm25, [
      [0, 12, 0, 50],
      [12.1, 35.4, 51, 100],
      [35.5, 55.4, 101, 150],
      [55.5, 150.4, 151, 200],
      [150.5, 250.4, 201, 300],
      [250.5, 350.4, 301, 400],
      [350.5, 500.4, 401, 500],
    ]);
    const pm10Aqi = this.calculateSubIndex(pm10, [
      [0, 54, 0, 50],
      [55, 154, 51, 100],
      [155, 254, 101, 150],
      [255, 354, 151, 200],
      [355, 424, 201, 300],
      [425, 504, 301, 400],
      [505, 604, 401, 500],
    ]);

    return Math.round(Math.max(pm25Aqi, pm10Aqi));
  }

  private calculateSubIndex(
    concentration: number,
    breakpoints: Array<[number, number, number, number]>,
  ): number {
    for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
      if (concentration >= cLow && concentration <= cHigh) {
        return ((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow;
      }
    }

    return 500;
  }

  private getAqiStatus(aqi: number): AirQualityRecord['status'] {
    if (aqi <= 50) {
      return 'good';
    }

    if (aqi <= 100) {
      return 'moderate';
    }

    if (aqi <= 200) {
      return 'unhealthy';
    }

    return 'hazardous';
  }

  private extractResults<T>(response: T[] | PaginatedResponse<T>): T[] {
    return Array.isArray(response) ? response : response.results;
  }

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === null || value === undefined || value === '') {
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }
}
