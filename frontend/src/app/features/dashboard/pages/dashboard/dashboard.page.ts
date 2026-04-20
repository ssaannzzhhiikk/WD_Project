import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AirQualityRecord } from '../../../../core/models/api.models';
import { AirQualityService } from '../../../../core/services/air-quality.service';
import { ErrorAlertComponent } from '../../../../shared/components/error-alert/error-alert.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, ErrorAlertComponent, LoadingStateComponent],
  template: `
    <div class="stack">

      <!-- Page header -->
      <div class="page-header">
        <h1>Almaty Air Quality Dashboard</h1>
        <p>Real-time AQI, PM2.5 and PM10 readings across Almaty districts</p>
      </div>

      <!-- Stats bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-label">Districts loaded</div>
          <div class="stat-value">{{ records().length }}</div>
          <div class="stat-sub">districts</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">City AQI</div>
          <div class="stat-value">{{ citySummary()?.aqi || 0 | number:'1.0-0' }}</div>
          <div class="stat-sub">average</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Highest district AQI</div>
          <div class="stat-value">{{ highestAqi() | number:'1.0-0' }}</div>
          <div class="stat-sub">peak</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Stations</div>
          <div class="stat-value">{{ citySummary()?.stationCount || 0 }}</div>
          <div class="stat-sub">reporting</div>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="form-group" style="flex:1;min-width:200px">
          <label class="form-label">Filter by district</label>
          <input
            [(ngModel)]="districtQuery"
            name="districtQuery"
            type="text"
            placeholder="e.g. Bostandyk"
            class="form-control"
          />
        </div>
        <div class="btn-row">
          <button type="button" (click)="loadDashboardData()" class="btn btn-primary">Load snapshot</button>
          <button type="button" (click)="refreshDashboard()"  class="btn btn-secondary">Refresh</button>
          <button type="button" (click)="focusDistrict()"     class="btn btn-secondary">Apply filter</button>
          <button type="button" (click)="clearSearch()"       class="btn btn-secondary">Clear</button>
        </div>
      </div>

      @if (error()) {
        <app-error-alert title="Dashboard request failed" [message]="error()" />
      }

      @if (loading()) {
        <app-loading-state message="Loading Almaty dashboard…" detail="Requesting city averages and district-level data." />
      } @else {

        <div class="sidebar-layout">

          <!-- Main content -->
          <div class="stack">

            <!-- City summary -->
            @if (citySummary(); as summary) {
              <div class="card">
                <div class="card-body">
                  <div class="flex-between" style="margin-bottom:14px">
                    <div>
                      <div class="card-subtitle">City-wide snapshot</div>
                      <div class="card-title">Almaty, Kazakhstan</div>
                      <p style="margin:6px 0 0;font-size:13px;color:var(--gray-500)">{{ summary.note }}</p>
                    </div>
                    <div style="font-size:12px;color:var(--gray-500);text-align:right;flex-shrink:0">
                      <div style="font-weight:600;color:var(--gray-700)">Last updated</div>
                      {{ summary.updatedAt | date:'medium' }}
                    </div>
                  </div>

                  <div class="grid-4">
                    <div class="metric-tile" [class]="getAqiSurfaceClass(summary.aqi)">
                      <div class="mt-label">AQI</div>
                      <div class="mt-value">{{ summary.aqi | number:'1.0-0' }}</div>
                      <div class="mt-sub">{{ getRiskLabel(summary.aqi) }}</div>
                    </div>
                    <div class="metric-tile" [class]="getPm25SurfaceClass(summary.pm25)">
                      <div class="mt-label">PM2.5</div>
                      <div class="mt-value">{{ summary.pm25 | number:'1.0-1' }}</div>
                      <div class="mt-sub">{{ getPm25Label(summary.pm25) }}</div>
                    </div>
                    <div class="metric-tile" [class]="getPm10SurfaceClass(summary.pm10)">
                      <div class="mt-label">PM10</div>
                      <div class="mt-value">{{ summary.pm10 | number:'1.0-1' }}</div>
                      <div class="mt-sub">{{ getPm10Label(summary.pm10) }}</div>
                    </div>
                    <div class="metric-tile metric-good">
                      <div class="mt-label">Stations</div>
                      <div class="mt-value">{{ summary.stationCount || 0 }}</div>
                      <div class="mt-sub">Reporting</div>
                    </div>
                  </div>

                  <div class="legend" style="margin-top:14px">
                    @for (item of legendItems; track item.label) {
                      <span class="legend-chip" [class]="item.className">{{ item.label }}</span>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- District cards -->
            <div class="grid-cards">
              @for (record of records(); track record.id) {
                <div class="district-card">
                  <div class="dc-header">
                    <div>
                      <div class="dc-city">{{ record.city }}</div>
                      <div class="dc-name">{{ record.district }}</div>
                    </div>
                    <span class="badge" [class]="'badge-' + record.status">{{ record.status }}</span>
                  </div>

                  <div class="dc-metrics">
                    <div class="metric-tile" [class]="getAqiSurfaceClass(record.aqi)">
                      <div class="mt-label">AQI</div>
                      <div class="mt-value">{{ record.aqi | number:'1.0-0' }}</div>
                    </div>
                    <div class="metric-tile" [class]="getPm25SurfaceClass(record.pm25)">
                      <div class="mt-label">PM2.5</div>
                      <div class="mt-value">{{ record.pm25 | number:'1.0-1' }}</div>
                    </div>
                    <div class="metric-tile" [class]="getPm10SurfaceClass(record.pm10)">
                      <div class="mt-label">PM10</div>
                      <div class="mt-value">{{ record.pm10 | number:'1.0-1' }}</div>
                    </div>
                  </div>

                  <div class="dc-meta">
                    <div>Risk: <span>{{ getRiskLabel(record.aqi) }}</span></div>
                    <div>Source: <span>{{ record.source }}</span></div>
                    <div>Stations: <span>{{ record.stationCount || 0 }}</span></div>
                    @if (record.note) {
                      <div style="color:var(--gray-600)">{{ record.note }}</div>
                    }
                  </div>

                  <div class="dc-action">
                    <button
                      type="button"
                      (click)="loadDistrictAdvice(record.district || '')"
                      class="btn btn-primary btn-sm"
                      style="width:100%"
                    >
                      Load advice
                    </button>
                  </div>
                </div>

              } @empty {
                <div class="empty-state" style="grid-column:1/-1">
                  <strong>No district records yet</strong>
                  <p>Click <strong>Load snapshot</strong> to fetch the latest district values.</p>
                </div>
              }
            </div>

          </div>

          <!-- Advice sidebar -->
          <aside class="advice-sidebar" style="background:white" >
            <div class="flex-between" style="margin-bottom:12px">
              <div>
                <div class="card-subtitle" style="color:black">Advice panel</div>
                <h2 style="margin:0;font-size:17px;font-weight:700;color:black">
                  {{ adviceRecord()?.district || 'Choose a district' }}
                </h2>
              </div>
              @if (adviceRecord()?.district) {
                <button
                  type="button"
                  (click)="loadDistrictAdvice(adviceRecord()?.district || '')"
                  class="btn btn-sm"
                  style="background:rgba(255,255,255,0.1);color:black; border:1px solid"
                >
                  Reload
                </button>
              }
            </div>

            @if (adviceError()) {
              <div class="alert alert-error" style="margin-bottom:12px">
                <div class="alert-title">Advice failed</div>
                <div class="alert-msg">{{ adviceError() }}</div>
              </div>
            }

            @if (adviceLoading()) {
              <app-loading-state message="Loading advice…" />
            } @else if (adviceRecord(); as advice) {
              <div class="stack-sm">
                <div class="advice-metric" style="color:black" >AQI <span style="color:black" >{{ advice.aqi | number:'1.0-0' }} — {{ getRiskLabel(advice.aqi) }}</span></div>
                <div class="advice-metric" style="color:black" >PM2.5 <span style="color:black" >{{ advice.pm25 | number:'1.0-1' }}</span></div>
                <div class="advice-metric" style="color:black" >PM10 <span style="color:black" >{{ advice.pm10 | number:'1.0-1' }}</span></div>
                <div class="advice-metric" style="color:black" >Updated <span style="color:black" >{{ advice.updatedAt | date:'shortTime' }}</span></div>
                <hr style="color:black ;border:none;border-top:1px solid rgba(255,255,255,0.1);margin:4px 0" />
                @for (tip of getAdvicePoints(advice); track tip) {
                  <div class="advice-tip" style="color:black">{{ tip }}</div>
                }
              </div>
            } @else {
              <div style=" color:black; font-size:13px;line-height:1.6;border:1px dashed rgba(255,255,255,0.15);border-radius:8px;padding:16px">
                Pick a district card and click <strong style="color:black">Load advice</strong> to see health recommendations.
              </div>
            }
          </aside>

        </div>
      }
    </div>
  `,
})
export class DashboardPageComponent {
  private readonly airQualityService = inject(AirQualityService);

  districtQuery = '';

  readonly citySummary   = signal<AirQualityRecord | null>(null);
  readonly records       = signal<AirQualityRecord[]>([]);
  readonly adviceRecord  = signal<AirQualityRecord | null>(null);
  readonly loading       = signal(false);
  readonly adviceLoading = signal(false);
  readonly error         = signal('');
  readonly adviceError   = signal('');

  readonly legendItems = [
    { label: 'Good',      className: 'legend-chip metric-good' },
    { label: 'Moderate',  className: 'legend-chip metric-moderate' },
    { label: 'Unhealthy', className: 'legend-chip metric-unhealthy' },
    { label: 'Hazardous', className: 'legend-chip metric-hazardous' },
  ];

  readonly highestAqi = computed(() => {
    const items = this.records();
    return items.length ? Math.max(...items.map((i) => i.aqi)) : 0;
  });

  constructor() { this.loadDashboardData(); }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      summary:   this.airQualityService.getCitySummary(),
      districts: this.airQualityService.getAirQualityList({ district: this.districtQuery.trim() || undefined }),
    }).subscribe({
      next: ({ summary, districts }) => { this.citySummary.set(summary); this.records.set(districts); },
      error: (error: Error) => {
        this.citySummary.set(null);
        this.records.set([]);
        this.error.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  refreshDashboard(): void { this.loadDashboardData(); }

  focusDistrict(): void {
    if (!this.districtQuery.trim()) { this.error.set('Enter an Almaty district name before filtering.'); return; }
    this.loadDashboardData();
  }

  clearSearch(): void {
    this.districtQuery = '';
    this.adviceRecord.set(null);
    this.adviceError.set('');
    this.loadDashboardData();
  }

  loadDistrictAdvice(district: string): void {
    if (!district.trim()) { this.adviceError.set('Select a district first.'); return; }
    this.adviceLoading.set(true);
    this.adviceError.set('');
    this.airQualityService.getCurrentAirQuality(district).subscribe({
      next: (record) => this.adviceRecord.set(record),
      error: (error: Error) => { this.adviceRecord.set(null); this.adviceError.set(error.message); this.adviceLoading.set(false); },
      complete: () => this.adviceLoading.set(false),
    });
  }

  getAdvicePoints(record: AirQualityRecord): string[] {
    if (record.aqi <= 50)  return [
      'Air quality is comfortable for walking, outdoor exercise, and commuting with windows open.',
      'Good time to recommend park visits or short outdoor breaks.',
      'Keep checking — morning and evening pollution can shift quickly.',
    ];
    if (record.aqi <= 100) return [
      'Most people can stay active outside, but sensitive groups should keep workouts shorter.',
      'Masks are optional but helpful for students with asthma or allergy symptoms.',
      'Avoid long stays near roads with heavy traffic.',
    ];
    if (record.aqi <= 150) return [
      'Reduce long outdoor exercise and move activities indoors where possible.',
      'Sensitive residents should limit exposure, especially morning and evening.',
      'Use public transport or short direct routes to reduce total exposure time.',
    ];
    return [
      'Air quality is unhealthy. Recommend indoor activity and closed windows.',
      'For high-risk groups, an N95-style mask and shorter commutes are safest.',
      'This district should be flagged as a priority area for alerts.',
    ];
  }

  getStatusClass(status: AirQualityRecord['status']): string {
    switch (status) {
      case 'good':      return 'bg-emerald-100 text-emerald-700';
      case 'moderate':  return 'bg-amber-100 text-amber-700';
      case 'unhealthy': return 'bg-orange-100 text-orange-700';
      default:          return 'bg-rose-100 text-rose-700';
    }
  }

  getAqiSurfaceClass(aqi: number): string {
    if (aqi <= 50)  return 'metric-good';
    if (aqi <= 100) return 'metric-moderate';
    if (aqi <= 150) return 'metric-unhealthy';
    return 'metric-hazardous';
  }

  getPm25SurfaceClass(pm25: number): string {
    if (pm25 <= 12)   return 'metric-good';
    if (pm25 <= 35.4) return 'metric-moderate';
    if (pm25 <= 55.4) return 'metric-unhealthy';
    return 'metric-hazardous';
  }

  getPm10SurfaceClass(pm10: number): string {
    if (pm10 <= 54)  return 'metric-good';
    if (pm10 <= 154) return 'metric-moderate';
    if (pm10 <= 254) return 'metric-unhealthy';
    return 'metric-hazardous';
  }

  getRiskLabel(aqi: number): string {
    if (aqi <= 50)  return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    return 'Hazardous';
  }

  getPm25Label(pm25: number): string {
    if (pm25 <= 12)   return 'Low';
    if (pm25 <= 35.4) return 'Elevated';
    if (pm25 <= 55.4) return 'High';
    return 'Very High';
  }

  getPm10Label(pm10: number): string {
    if (pm10 <= 54)  return 'Low';
    if (pm10 <= 154) return 'Elevated';
    if (pm10 <= 254) return 'High';
    return 'Very High';
  }
}
