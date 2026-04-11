<<<<<<< HEAD
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import * as L from 'leaflet';
=======
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
import { AirQualityRecord, MapLocation } from '../../../../core/models/api.models';
import { AirQualityService } from '../../../../core/services/air-quality.service';
import { ErrorAlertComponent } from '../../../../shared/components/error-alert/error-alert.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, ErrorAlertComponent, LoadingStateComponent],
  template: `
    <section class="flex w-full flex-col gap-6">
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div class="panel-surface rounded-[2rem] px-6 py-8 sm:px-8">
          <p class="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">Station Map</p>
          <h1 class="page-title mt-4 text-white">Live Almaty station overview</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">
<<<<<<< HEAD
            This page now uses a real map. Station dots stay color-coded by air quality so it is
            easier to see which areas are safer and which ones need attention.
=======
            This view is now centered only on Almaty. It loads live station markers from the
            Almaty Air Initiative API and lets you filter by district, source, and pollution level.
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
          </p>
        </div>

        <div class="panel-light rounded-[2rem] px-6 py-8 text-slate-900">
          <div class="grid gap-4 md:grid-cols-3">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">District</span>
              <input
                [(ngModel)]="districtFilter"
                name="districtFilter"
                type="text"
<<<<<<< HEAD
                placeholder="For example Bostandyk"
=======
                placeholder="For example Медеуский"
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              >
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Source</span>
              <input
                [(ngModel)]="sourceFilter"
                name="sourceFilter"
                type="text"
                placeholder="airgradient or clarity"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              >
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Minimum AQI</span>
              <input
                [(ngModel)]="minAqiFilter"
                name="minAqiFilter"
                type="number"
                min="0"
                placeholder="60"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              >
            </label>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              (click)="refreshMapData()"
              class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Refresh map data
            </button>
            <button
              type="button"
              (click)="applyFilters()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Apply filters
            </button>
            <button
              type="button"
              (click)="clearFilters()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Reset filters
            </button>
          </div>
<<<<<<< HEAD

          <div class="mt-5 flex flex-wrap gap-2">
            @for (item of legendItems; track item.label) {
              <span class="metric-chip" [class]="item.className">{{ item.label }}</span>
            }
          </div>
=======
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
        </div>
      </div>

      @if (error()) {
        <app-error-alert title="Map request failed" [message]="error()" />
      }

      <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div class="panel-light rounded-[2rem] p-4 text-slate-900 sm:p-6">
<<<<<<< HEAD
          <div class="relative min-h-[540px] overflow-hidden rounded-[1.5rem]">
            <div #mapHost class="h-[540px] w-full"></div>

            @if (loading()) {
              <div class="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 p-6 backdrop-blur-sm">
                <app-loading-state
                  message="Loading Almaty station map..."
                  detail="AirWatch is requesting fresh PM2.5, PM10, and NO2 station points from the API."
                />
              </div>
            }

            @if (!loading() && !locations().length) {
              <div class="absolute inset-0 z-[500] flex items-center justify-center bg-white/88 p-8 text-center text-slate-600 backdrop-blur-sm">
                <div>
                  <p class="text-lg font-semibold text-slate-900">No fresh stations found</p>
                  <p class="mt-2 max-w-md text-sm leading-6">
                    Adjust the district or source filters, then request the data again.
                  </p>
                </div>
              </div>
            }
          </div>
=======
          @if (loading()) {
            <app-loading-state
              message="Loading Almaty station map..."
              detail="AirWatch is requesting fresh PM2.5, PM10, and NO2 station points from the API."
            />
          } @else {
            <div class="subtle-grid relative min-h-[540px] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_top,#d7f4ff_0%,#eff8ff_38%,#f8fbff_100%)]">
              <div class="absolute inset-x-6 top-6 rounded-2xl bg-white/85 p-4 shadow-sm backdrop-blur">
                <p class="text-sm font-semibold text-slate-900">Map-ready Almaty canvas</p>
                <p class="mt-1 text-sm text-slate-600">
                  Marker positions are placed using station coordinates inside an Almaty-focused
                  bounding box, so a real Leaflet map can be connected later with minimal changes.
                </p>
              </div>

              @for (location of locations(); track location.id) {
                <button
                  type="button"
                  (click)="selectLocation(location)"
                  [style.left.%]="getLeft(location)"
                  [style.top.%]="getTop(location)"
                  [class]="'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white p-3 shadow-lg transition hover:scale-110 ' + getMarkerClass(location)"
                  [attr.aria-label]="'View ' + (location.label || location.district || location.city) + ' details'"
                >
                  <span class="block h-2 w-2 rounded-full bg-white"></span>
                </button>
              } @empty {
                <div class="flex min-h-[540px] items-center justify-center p-8 text-center text-slate-600">
                  <div>
                    <p class="text-lg font-semibold text-slate-900">No fresh stations found</p>
                    <p class="mt-2 max-w-md text-sm leading-6">
                      Adjust the district or source filters, then request the data again.
                    </p>
                  </div>
                </div>
              }
            </div>
          }
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
        </div>

        <aside class="flex flex-col gap-6">
          <div class="panel-surface rounded-[2rem] px-6 py-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Selected station</p>
                <h2 class="mt-2 text-2xl font-semibold text-white">
                  {{ selectedLocation()?.label || 'Choose a marker' }}
                </h2>
              </div>
              @if (selectedLocation()) {
                <button
                  type="button"
                  (click)="loadSelectedDistrictDetails()"
                  class="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Load district details
                </button>
              }
            </div>

            @if (detailsError()) {
              <div class="mt-5">
                <app-error-alert title="Detail request failed" [message]="detailsError()" />
              </div>
            }

            @if (detailsLoading()) {
              <div class="mt-5">
                <app-loading-state
                  message="Loading district details..."
                  detail="AirWatch is requesting the latest district average for the selected station."
                />
              </div>
            } @else if (currentDetails(); as details) {
<<<<<<< HEAD
              <div class="mt-5 space-y-4">
                <div class="rounded-[1.5rem] border p-5 text-sm" [class]="getAqiSurfaceClass(details.aqi)">
                  <p>District: <span class="font-medium">{{ details.district }}</span></p>
                  <p>AQI: <span class="font-medium">{{ details.aqi | number: '1.0-0' }}</span></p>
                  <p>PM2.5: <span class="font-medium">{{ details.pm25 | number: '1.0-1' }}</span></p>
                  <p>PM10: <span class="font-medium">{{ details.pm10 | number: '1.0-1' }}</span></p>
                  <p>Risk level: <span class="font-medium">{{ getRiskLabel(details.aqi) }}</span></p>
                  <p>Updated: <span class="font-medium">{{ details.updatedAt | date: 'medium' }}</span></p>
                </div>
=======
              <div class="mt-5 space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                <p>District: <span class="font-medium text-white">{{ details.district }}</span></p>
                <p>AQI: <span class="font-medium text-white">{{ details.aqi | number: '1.0-0' }}</span></p>
                <p>PM2.5: <span class="font-medium text-white">{{ details.pm25 | number: '1.0-1' }}</span></p>
                <p>PM10: <span class="font-medium text-white">{{ details.pm10 | number: '1.0-1' }}</span></p>
                <p>Updated: <span class="font-medium text-white">{{ details.updatedAt | date: 'medium' }}</span></p>
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
              </div>
            } @else {
              <div class="mt-5 rounded-[1.5rem] border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-300">
                Select a station marker, then click <span class="font-semibold text-white">Load district details</span>
                to fetch a district-wide summary.
              </div>
            }
          </div>

          <div class="panel-light rounded-[2rem] p-6 text-slate-900">
            <p class="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Loaded stations</p>
            <div class="mt-4 space-y-3 max-h-[30rem] overflow-y-auto pr-1">
              @for (location of locations(); track location.id) {
                <button
                  type="button"
<<<<<<< HEAD
                  (click)="selectLocation(location, true)"
=======
                  (click)="selectLocation(location)"
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
                  class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-cyan-500 hover:bg-cyan-50"
                >
                  <div>
                    <p class="font-semibold text-slate-950">
                      {{ location.label }}
                    </p>
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-500">
                      {{ location.district }} • {{ location.source }}
                    </p>
                  </div>
<<<<<<< HEAD
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="getAqiBadgeClass(location.aqi)">
=======
                  <span class="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
                    AQI {{ location.aqi | number: '1.0-0' }}
                  </span>
                </button>
              } @empty {
                <p class="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  The API has not returned any fresh Almaty station markers yet.
                </p>
              }
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
})
<<<<<<< HEAD
export class MapPageComponent implements AfterViewInit {
  private readonly airQualityService = inject(AirQualityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>('mapHost');
=======
export class MapPageComponent {
  private readonly airQualityService = inject(AirQualityService);
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004

  districtFilter = '';
  sourceFilter = '';
  minAqiFilter: number | null = null;

  readonly locations = signal<MapLocation[]>([]);
  readonly selectedLocation = signal<MapLocation | null>(null);
  readonly currentDetails = signal<AirQualityRecord | null>(null);
  readonly loading = signal(false);
  readonly detailsLoading = signal(false);
  readonly error = signal('');
  readonly detailsError = signal('');

<<<<<<< HEAD
  readonly legendItems = [
    { label: 'Good', className: 'metric-good' },
    { label: 'Moderate', className: 'metric-moderate' },
    { label: 'Unhealthy', className: 'metric-unhealthy' },
    { label: 'Hazardous', className: 'metric-hazardous' },
  ];

  private map: L.Map | null = null;
  private markerLayer = L.layerGroup();

  constructor() {
    effect(() => {
      this.locations();
      this.selectedLocation();
      this.renderMarkers();
    });

    this.destroyRef.onDestroy(() => {
      this.map?.remove();
      this.map = null;
    });

    this.refreshMapData();
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.renderMarkers();
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

=======
  constructor() {
    this.refreshMapData();
  }

>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
  refreshMapData(): void {
    this.loading.set(true);
    this.error.set('');

    this.airQualityService.getMapData().subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.selectedLocation.set(locations[0] ?? null);
      },
      error: (error: Error) => {
        this.locations.set([]);
        this.selectedLocation.set(null);
        this.error.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    this.loading.set(true);
    this.error.set('');

    this.airQualityService
      .getMapData({
        district: this.districtFilter.trim() || undefined,
        source: this.sourceFilter.trim() || undefined,
        min_aqi: this.minAqiFilter ?? undefined,
      })
      .subscribe({
        next: (locations) => {
          this.locations.set(locations);
          this.selectedLocation.set(locations[0] ?? null);
        },
        error: (error: Error) => {
          this.locations.set([]);
          this.selectedLocation.set(null);
          this.error.set(error.message);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  clearFilters(): void {
    this.districtFilter = '';
    this.sourceFilter = '';
    this.minAqiFilter = null;
    this.refreshMapData();
  }

<<<<<<< HEAD
  selectLocation(location: MapLocation, recenter = false): void {
    this.selectedLocation.set(location);
    this.currentDetails.set(null);
    this.detailsError.set('');

    if (recenter && this.map) {
      this.map.flyTo([location.latitude, location.longitude], Math.max(this.map.getZoom(), 12), {
        animate: true,
        duration: 0.7,
      });
    }
=======
  selectLocation(location: MapLocation): void {
    this.selectedLocation.set(location);
    this.currentDetails.set(null);
    this.detailsError.set('');
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
  }

  loadSelectedDistrictDetails(): void {
    const location = this.selectedLocation();

    if (!location?.district) {
      this.detailsError.set('Select a station before loading district details.');
      return;
    }

    this.detailsLoading.set(true);
    this.detailsError.set('');

    this.airQualityService.getCurrentAirQuality(location.district).subscribe({
      next: (details) => this.currentDetails.set(details),
      error: (error: Error) => {
        this.currentDetails.set(null);
        this.detailsError.set(error.message);
        this.detailsLoading.set(false);
      },
      complete: () => this.detailsLoading.set(false),
    });
  }

<<<<<<< HEAD
  getAqiSurfaceClass(aqi: number): string {
    if (aqi <= 50) {
      return 'metric-good';
    }

    if (aqi <= 100) {
      return 'metric-moderate';
    }

    if (aqi <= 150) {
      return 'metric-unhealthy';
    }

    return 'metric-hazardous';
  }

  getAqiBadgeClass(aqi: number): string {
    if (aqi <= 50) {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (aqi <= 100) {
      return 'bg-amber-100 text-amber-700';
    }

    if (aqi <= 150) {
      return 'bg-orange-100 text-orange-700';
    }

    return 'bg-rose-100 text-rose-700';
  }

  getRiskLabel(aqi: number): string {
    if (aqi <= 50) {
      return 'Good';
    }

    if (aqi <= 100) {
      return 'Moderate';
    }

    if (aqi <= 150) {
      return 'Unhealthy';
    }

    return 'Hazardous';
  }

  private initializeMap(): void {
    if (this.map) {
      return;
    }

    this.map = L.map(this.mapHost().nativeElement, {
      zoomControl: true,
      attributionControl: true,
    }).setView([43.2389, 76.8897], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.markerLayer.addTo(this.map);
    this.map.invalidateSize();
  }

  private renderMarkers(): void {
    if (!this.map) {
      return;
    }

    this.markerLayer.clearLayers();

    const locations = this.locations();
    const selectedId = this.selectedLocation()?.id;

    for (const location of locations) {
      const marker = L.circleMarker([location.latitude, location.longitude], {
        radius: selectedId === location.id ? 11 : 9,
        color: '#ffffff',
        weight: 2,
        fillColor: this.getMarkerColor(location.aqi),
        fillOpacity: 0.9,
      });

      marker.bindPopup(
        `
          <div style="min-width: 180px;">
            <strong>${this.escapeHtml(location.label || 'Station')}</strong><br>
            <span>${this.escapeHtml(location.district || 'Almaty')}</span><br>
            <span>AQI ${Math.round(location.aqi)} • PM2.5 ${location.pm25.toFixed(1)} • PM10 ${location.pm10.toFixed(1)}</span>
          </div>
        `,
      );

      marker.on('click', () => this.selectLocation(location));
      marker.addTo(this.markerLayer);
    }

    if (locations.length) {
      const bounds = L.latLngBounds(
        locations.map((location) => [location.latitude, location.longitude] as [number, number]),
      );
      this.map.fitBounds(bounds.pad(0.12), { maxZoom: 13 });
    } else {
      this.map.setView([43.2389, 76.8897], 11);
    }
  }

  private getMarkerColor(aqi: number): string {
    if (aqi <= 50) {
      return '#22c55e';
    }

    if (aqi <= 100) {
      return '#f59e0b';
    }

    if (aqi <= 150) {
      return '#f97316';
    }

    return '#f43f5e';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
=======
  getLeft(location: MapLocation): number {
    const minLon = 76.73;
    const maxLon = 77.06;
    return this.clamp(((location.longitude - minLon) / (maxLon - minLon)) * 100, 8, 92);
  }

  getTop(location: MapLocation): number {
    const minLat = 43.14;
    const maxLat = 43.41;
    return this.clamp(((maxLat - location.latitude) / (maxLat - minLat)) * 100, 15, 88);
  }

  getMarkerClass(location: MapLocation): string {
    const base = this.selectedLocation()?.id === location.id ? 'ring-4 ring-slate-900/20 ' : '';

    if (location.aqi <= 50) {
      return `${base}bg-emerald-500`;
    }

    if (location.aqi <= 100) {
      return `${base}bg-amber-500`;
    }

    if (location.aqi <= 150) {
      return `${base}bg-orange-500`;
    }

    return `${base}bg-rose-500`;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
>>>>>>> 2ce35a74a2da3164577dbff8dbbd9e6365209004
  }
}
