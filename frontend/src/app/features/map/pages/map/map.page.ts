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
    <div class="stack">

      <div class="page-header">
        <h1>Station Map</h1>
        <p>Live Almaty monitoring stations — color coded by air quality</p>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="form-group" style="flex:1;min-width:160px">
          <label class="form-label">District</label>
          <input
            [(ngModel)]="districtFilter"
            name="districtFilter"
            type="text"
            placeholder="e.g. Bostandyk"
            class="form-control"
          />
        </div>
        <div class="form-group" style="flex:1;min-width:160px">
          <label class="form-label">Source</label>
          <input
            [(ngModel)]="sourceFilter"
            name="sourceFilter"
            type="text"
            placeholder="airgradient or clarity"
            class="form-control"
          />
        </div>
        <div class="form-group" style="width:140px">
          <label class="form-label">Min AQI</label>
          <input
            [(ngModel)]="minAqiFilter"
            name="minAqiFilter"
            type="number"
            min="0"
            placeholder="60"
            class="form-control"
          />
        </div>
        <div class="btn-row" style="align-self:flex-end">
          <button type="button" (click)="refreshMapData()" class="btn btn-primary">Refresh</button>
          <button type="button" (click)="applyFilters()"   class="btn btn-secondary">Apply filters</button>
          <button type="button" (click)="clearFilters()"   class="btn btn-secondary">Clear</button>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend">
        @for (item of legendItems; track item.label) {
          <span class="legend-chip" [class]="item.className">{{ item.label }}</span>
        }
      </div>

      @if (error()) {
        <app-error-alert title="Map request failed" [message]="error()" />
      }

      <div class="sidebar-layout" style="grid-template-columns:1fr 320px">

        <!-- Map -->
        <div class="stack-sm">
          <div class="map-wrapper" style="position:relative">
            <div #mapHost style="height:480px;width:100%"></div>

            @if (loading()) {
              <div style="position:absolute;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.85);border-radius:var(--radius-lg)">
                <app-loading-state message="Loading station map…" />
              </div>
            }

            @if (!loading() && !locations().length) {
              <div style="position:absolute;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.9);border-radius:var(--radius-lg)">
                <div class="empty-state" style="border:none">
                  <strong>No stations found</strong>
                  <p>Adjust filters and try again.</p>
                </div>
              </div>
            }
          </div>

          <!-- Station list -->
          <div class="card">
            <div class="card-body">
              <div class="card-subtitle">Loaded stations</div>
              <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto">
                @for (location of locations(); track location.id) {
                  <button
                    type="button"
                    (click)="selectLocation(location, true)"
                    class="station-item"
                    style="width:100%;background:none;cursor:pointer;text-align:left"
                  >
                    <div>
                      <div class="station-name">{{ location.label }}</div>
                      <div class="station-meta">{{ location.district }} · {{ location.source }}</div>
                    </div>
                    <span class="badge" [class]="getAqiBadgeClass(location.aqi)">
                      AQI {{ location.aqi | number:'1.0-0' }}
                    </span>
                  </button>
                } @empty {
                  <p style="font-size:13px;color:var(--gray-500);padding:8px 0">
                    No station data yet. Click <strong>Refresh</strong> to load.
                  </p>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Detail panel -->
        <aside class="advice-sidebar" style="background:white">
          <div class="flex-between" style="margin-bottom:14px;">
            <div>
              <div class="card-subtitle" style="">Selected station</div>
              <h2 style="margin:4px 0 0;font-size:17px;font-weight:700;color:black">
                {{ selectedLocation()?.label || 'Choose a marker' }}
              </h2>
            </div>
            @if (selectedLocation()) {
              <button
                type="button"
                (click)="loadSelectedDistrictDetails()"
                class="btn btn-sm"
                style="background:rgba(255,255,255,0.1);color:black;border-color:rgba(255,255,255,0.2);flex-shrink:0"
              >
                Load details
              </button>
            }
          </div>

          @if (detailsError()) {
            <div class="alert alert-error" style="margin-bottom:12px">
              <div class="alert-title">Detail request failed</div>
              <div class="alert-msg">{{ detailsError() }}</div>
            </div>
          }

          @if (detailsLoading()) {
            <app-loading-state message="Loading district details…" />
          } @else if (currentDetails(); as details) {
            <div class="stack-sm">
              <div class="advice-metric" style="color:black">District <span>{{ details.district }}</span></div>
              <div class="advice-metric" style="color:black">AQI <span>{{ details.aqi | number:'1.0-0' }} — {{ getRiskLabel(details.aqi) }}</span></div>
              <div class="advice-metric" style="color:black">PM2.5 <span>{{ details.pm25 | number:'1.0-1' }}</span></div>
              <div class="advice-metric" style="color:black" >PM10 <span>{{ details.pm10 | number:'1.0-1' }}</span></div>
              <div class="advice-metric" style="color:black">Updated <span>{{ details.updatedAt | date:'shortTime' }}</span></div>
            </div>
          } @else {
            <div style="font-size:13px;color:black;line-height:1.6;border:1px dashed rgba(255,255,255,0.15);border-radius:8px;padding:16px">
              Click a marker on the map or a station in the list, then click
              <strong style="color:black">Load details</strong>
              to see district readings.
            </div>
          }
        </aside>

      </div>
    </div>
  `,
})
export class MapPageComponent implements AfterViewInit {
  private readonly airQualityService = inject(AirQualityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>('mapHost');

  districtFilter = '';
  sourceFilter = '';
  minAqiFilter: number | null = null;

  readonly locations        = signal<MapLocation[]>([]);
  readonly selectedLocation = signal<MapLocation | null>(null);
  readonly currentDetails   = signal<AirQualityRecord | null>(null);
  readonly loading          = signal(false);
  readonly detailsLoading   = signal(false);
  readonly error            = signal('');
  readonly detailsError     = signal('');

  readonly legendItems = [
    { label: 'Good',      className: 'legend-chip metric-good' },
    { label: 'Moderate',  className: 'legend-chip metric-moderate' },
    { label: 'Unhealthy', className: 'legend-chip metric-unhealthy' },
    { label: 'Hazardous', className: 'legend-chip metric-hazardous' },
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
      source:   this.sourceFilter.trim() || undefined,
      min_aqi:  this.minAqiFilter ?? undefined,
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
    this.sourceFilter   = '';
    this.minAqiFilter   = null;
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
    if (aqi <= 50)  return 'metric-good';
    if (aqi <= 100) return 'metric-moderate';
    if (aqi <= 150) return 'metric-unhealthy';
    return 'metric-hazardous';
  }

  getAqiBadgeClass(aqi: number): string {
    if (aqi <= 50)  return 'badge-good';
    if (aqi <= 100) return 'badge-moderate';
    if (aqi <= 150) return 'badge-unhealthy';
    return 'badge-hazardous';
  }

  getRiskLabel(aqi: number): string {
    if (aqi <= 50)  return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    return 'Hazardous';
  }

  private initializeMap(): void {
    if (this.map) return;

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
    if (!this.map) return;

    this.markerLayer.clearLayers();
    const locations   = this.locations();
    const selectedId  = this.selectedLocation()?.id;

    for (const location of locations) {
      const marker = L.circleMarker([location.latitude, location.longitude], {
        radius:      selectedId === location.id ? 11 : 9,
        color:       '#ffffff',
        weight:      2,
        fillColor:   this.getMarkerColor(location.aqi),
        fillOpacity: 0.9,
      });

      marker.bindPopup(`
        <div style="min-width:180px;font-size:13px">
          <strong style="display:block;margin-bottom:4px">${this.escapeHtml(location.label || 'Station')}</strong>
          <span style="color:#64748b">${this.escapeHtml(location.district || 'Almaty')}</span><br>
          AQI ${Math.round(location.aqi)} · PM2.5 ${location.pm25.toFixed(1)} · PM10 ${location.pm10.toFixed(1)}
        </div>
      `);

      marker.on('click', () => this.selectLocation(location));
      marker.addTo(this.markerLayer);
    }

    if (locations.length) {
      const bounds = L.latLngBounds(
        locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]),
      );
      this.map.fitBounds(bounds.pad(0.12), { maxZoom: 13 });
    } else {
      this.map.setView([43.2389, 76.8897], 11);
    }
  }

  private getMarkerColor(aqi: number): string {
    if (aqi <= 50)  return '#22c55e';
    if (aqi <= 100) return '#f59e0b';
    if (aqi <= 150) return '#f97316';
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
