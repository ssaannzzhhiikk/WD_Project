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
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
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
            This page now uses a real map. Station dots stay color-coded by air quality so it is
            easier to see which areas are safer and which ones need attention.
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
                placeholder="For example Bostandyk"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Source</span>
              <input
                [(ngModel)]="sourceFilter"
                name="sourceFilter"
                type="text"
                placeholder="airgradient or clarity"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              />
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
              />
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

          <div class="mt-5 flex flex-wrap gap-2">
            @for (item of legendItems; track item.label) {
              <span class="metric-chip" [class]="item.className">{{ item.label }}</span>
            }
          </div>
        </div>
      </div>

      @if (error()) {
        <app-error-alert title="Map request failed" [message]="error()" />
      }

      <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div class="panel-light rounded-[2rem] p-4 text-slate-900 sm:p-6">
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
              <div class="mt-5 space-y-4">
                <div class="rounded-[1.5rem] border p-5 text-sm" [class]="getAqiSurfaceClass(details.aqi)">
                  <p>District: <span class="font-medium">{{ details.district }}</span></p>
                  <p>AQI: <span class="font-medium">{{ details.aqi | number: '1.0-0' }}</span></p>
                  <p>PM2.5: <span class="font-medium">{{ details.pm25 | number: '1.0-1' }}</span></p>
                  <p>PM10: <span class="font-medium">{{ details.pm10 | number: '1.0-1' }}</span></p>
                  <p>Risk level: <span class="font-medium">{{ getRiskLabel(details.aqi) }}</span></p>
                  <p>Updated: <span class="font-medium">{{ details.updatedAt | date: 'medium' }}</span></p>
                </div>
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
                  (click)="selectLocation(location, true)"
                  class="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-cyan-500 hover:bg-cyan-50"
                >
                  <div>
                    <p class="font-semibold text-slate-950">{{ location.label }}</p>
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-500">
                      {{ location.district }} • {{ location.source }}
                    </p>
                  </div>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="getAqiBadgeClass(location.aqi)">
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
export class MapPageComponent implements AfterViewInit {
  private readonly airQualityService = inject(AirQualityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>('mapHost');

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

    this.airQualityService.getMapData({
      district: this.districtFilter.trim() || undefined,
      source: this.sourceFilter.trim() || undefined,
      min_aqi: this.minAqiFilter ?? undefined,
    }).subscribe({
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
  }
}
