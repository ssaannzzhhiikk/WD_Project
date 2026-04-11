import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
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
    <section class="flex w-full flex-col gap-6">
      <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div class="panel-surface rounded-[2rem] px-6 py-8 sm:px-8">
          <p class="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">Almaty Dashboard</p>
          <div class="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 class="page-title text-white">Live district air quality across Almaty</h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                AirWatch now focuses only on Almaty. The metric colors below make the risk easy to
                read during a quick demo: green is better, yellow means caution, orange is worse,
                and red highlights unhealthy air.
              </p>
            </div>

            <div class="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 sm:grid-cols-3">
              <div>
                <p class="text-slate-400">Districts loaded</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ records().length }}</p>
              </div>
              <div>
                <p class="text-slate-400">City AQI</p>
                <p class="mt-2 text-2xl font-semibold text-white">
                  {{ citySummary()?.aqi || 0 | number: '1.0-0' }}
                </p>
              </div>
              <div>
                <p class="text-slate-400">Highest district AQI</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ highestAqi() | number: '1.0-0' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-light rounded-[2rem] px-6 py-8 text-slate-900">
          <p class="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-700">District filter</p>
          <label class="mt-5 block">
            <span class="mb-2 block text-sm font-medium text-slate-700">District</span>
            <input
              [(ngModel)]="districtQuery"
              name="districtQuery"
              type="text"
              placeholder="Type a district name, for example Bostandyk"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
            >
          </label>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              (click)="loadDashboardData()"
              class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Load Almaty snapshot
            </button>
            <button
              type="button"
              (click)="refreshDashboard()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Refresh board
            </button>
            <button
              type="button"
              (click)="focusDistrict()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Focus district
            </button>
            <button
              type="button"
              (click)="clearSearch()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Clear filter
            </button>
          </div>
        </div>
      </div>

      @if (error()) {
        <app-error-alert title="Dashboard request failed" [message]="error()" />
      }

      @if (loading()) {
        <app-loading-state
          message="Loading Almaty dashboard..."
          detail="AirWatch is requesting city averages and district-level PM2.5 and PM10 data from the Almaty Air Initiative API."
        />
      } @else {
        <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div class="space-y-6">
            @if (citySummary(); as summary) {
              <article class="panel-light rounded-[1.75rem] p-6 text-slate-900">
                <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">City-wide snapshot</p>
                    <h2 class="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Almaty, Kazakhstan</h2>
                    <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      {{ summary.note }}
                    </p>
                  </div>

                  <div class="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Updated</p>
                    <p class="mt-2 text-sm font-semibold">{{ summary.updatedAt | date: 'medium' }}</p>
                  </div>
                </div>

                <div class="mt-5 grid gap-3 sm:grid-cols-4">
                  <div class="rounded-2xl border p-4" [class]="getAqiSurfaceClass(summary.aqi)">
                    <p class="text-xs uppercase tracking-[0.24em]">AQI</p>
                    <p class="mt-2 text-2xl font-semibold">{{ summary.aqi | number: '1.0-0' }}</p>
                    <p class="mt-1 text-xs font-medium uppercase tracking-[0.18em]">
                      {{ getRiskLabel(summary.aqi) }}
                    </p>
                  </div>
                  <div class="rounded-2xl border p-4" [class]="getPm25SurfaceClass(summary.pm25)">
                    <p class="text-xs uppercase tracking-[0.24em]">PM2.5</p>
                    <p class="mt-2 text-2xl font-semibold">{{ summary.pm25 | number: '1.0-1' }}</p>
                    <p class="mt-1 text-xs font-medium uppercase tracking-[0.18em]">
                      {{ getPm25Label(summary.pm25) }}
                    </p>
                  </div>
                  <div class="rounded-2xl border p-4" [class]="getPm10SurfaceClass(summary.pm10)">
                    <p class="text-xs uppercase tracking-[0.24em]">PM10</p>
                    <p class="mt-2 text-2xl font-semibold">{{ summary.pm10 | number: '1.0-1' }}</p>
                    <p class="mt-1 text-xs font-medium uppercase tracking-[0.18em]">
                      {{ getPm10Label(summary.pm10) }}
                    </p>
                  </div>
                  <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
                    <p class="text-xs uppercase tracking-[0.24em]">Stations</p>
                    <p class="mt-2 text-2xl font-semibold">{{ summary.stationCount || 0 }}</p>
                    <p class="mt-1 text-xs font-medium uppercase tracking-[0.18em]">Reporting</p>
                  </div>
                </div>

                <div class="mt-5 flex flex-wrap gap-2">
                  @for (item of legendItems; track item.label) {
                    <span class="metric-chip" [class]="item.className">{{ item.label }}</span>
                  }
                </div>
              </article>
            }

            <div class="grid gap-4 md:grid-cols-2">
              @for (record of records(); track record.id) {
                <article class="panel-light rounded-[1.75rem] p-6 text-slate-900">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                        {{ record.city }}
                      </p>
                      <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        {{ record.district }}
                      </h2>
                    </div>

                    <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]" [class]="getStatusClass(record.status)">
                      {{ record.status }}
                    </span>
                  </div>

                  <div class="mt-5 grid grid-cols-3 gap-3">
                    <div class="rounded-2xl border p-4" [class]="getAqiSurfaceClass(record.aqi)">
                      <p class="text-xs uppercase tracking-[0.24em]">AQI</p>
                      <p class="mt-2 text-2xl font-semibold">{{ record.aqi | number: '1.0-0' }}</p>
                    </div>
                    <div class="rounded-2xl border p-4" [class]="getPm25SurfaceClass(record.pm25)">
                      <p class="text-xs uppercase tracking-[0.24em]">PM2.5</p>
                      <p class="mt-2 text-2xl font-semibold">{{ record.pm25 | number: '1.0-1' }}</p>
                    </div>
                    <div class="rounded-2xl border p-4" [class]="getPm10SurfaceClass(record.pm10)">
                      <p class="text-xs uppercase tracking-[0.24em]">PM10</p>
                      <p class="mt-2 text-2xl font-semibold">{{ record.pm10 | number: '1.0-1' }}</p>
                    </div>
                  </div>

                  <div class="mt-5 space-y-2 text-sm text-slate-600">
                    <p>Risk level: <span class="font-medium text-slate-900">{{ getRiskLabel(record.aqi) }}</span></p>
                    <p>Source: <span class="font-medium text-slate-900">{{ record.source }}</span></p>
                    <p>Stations: <span class="font-medium text-slate-900">{{ record.stationCount || 0 }}</span></p>
                    @if (record.note) {
                      <p>{{ record.note }}</p>
                    }
                  </div>

                  <button
                    type="button"
                    (click)="loadDistrictAdvice(record.district || '')"
                    class="mt-5 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Load district advice
                  </button>
                </article>
              } @empty {
                <div class="panel-light rounded-[1.75rem] p-8 text-slate-700 md:col-span-2">
                  <p class="text-lg font-semibold text-slate-900">No district records yet</p>
                  <p class="mt-2 text-sm leading-6">
                    Click <span class="font-semibold">Load Almaty snapshot</span> to request the
                    latest district values from the live API.
                  </p>
                </div>
              }
            </div>
          </div>

          <aside class="panel-surface rounded-[1.75rem] px-6 py-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Advice panel</p>
                <h2 class="mt-2 text-2xl font-semibold text-white">
                  {{ adviceRecord()?.district || 'Choose a district' }}
                </h2>
              </div>
              @if (adviceRecord()?.district) {
                <button
                  type="button"
                  (click)="loadDistrictAdvice(adviceRecord()?.district || '')"
                  class="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Reload advice
                </button>
              }
            </div>

            @if (adviceError()) {
              <div class="mt-5">
                <app-error-alert title="Advice request failed" [message]="adviceError()" />
              </div>
            }

            @if (adviceLoading()) {
              <div class="mt-5">
                <app-loading-state
                  message="Loading district advice..."
                  detail="AirWatch is requesting the latest district summary to generate presentation-ready suggestions."
                />
              </div>
            } @else if (adviceRecord(); as advice) {
              <div class="mt-5 space-y-4">
                <div class="rounded-[1.5rem] border p-5 text-sm" [class]="getAqiSurfaceClass(advice.aqi)">
                  <p>District AQI: <span class="font-medium">{{ advice.aqi | number: '1.0-0' }}</span></p>
                  <p>PM2.5: <span class="font-medium">{{ advice.pm25 | number: '1.0-1' }}</span></p>
                  <p>PM10: <span class="font-medium">{{ advice.pm10 | number: '1.0-1' }}</span></p>
                  <p>Risk level: <span class="font-medium">{{ getRiskLabel(advice.aqi) }}</span></p>
                  <p>Updated: <span class="font-medium">{{ advice.updatedAt | date: 'medium' }}</span></p>
                </div>

                <div class="space-y-3">
                  @for (tip of getAdvicePoints(advice); track tip) {
                    <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                      {{ tip }}
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="mt-5 rounded-2xl border border-dashed border-white/15 p-5 text-sm leading-6 text-slate-300">
                Pick a district card and click <span class="font-semibold text-white">Load district advice</span>
                to generate simple health and activity suggestions for Almaty residents.
              </div>
            }
          </aside>
        </div>
      }
    </section>
  `,
})
export class DashboardPageComponent {
  private readonly airQualityService = inject(AirQualityService);

  districtQuery = '';

  readonly citySummary = signal<AirQualityRecord | null>(null);
  readonly records = signal<AirQualityRecord[]>([]);
  readonly adviceRecord = signal<AirQualityRecord | null>(null);
  readonly loading = signal(false);
  readonly adviceLoading = signal(false);
  readonly error = signal('');
  readonly adviceError = signal('');

  readonly legendItems = [
    { label: 'Good', className: 'metric-good' },
    { label: 'Moderate', className: 'metric-moderate' },
    { label: 'Unhealthy', className: 'metric-unhealthy' },
    { label: 'Hazardous', className: 'metric-hazardous' },
  ];

  readonly highestAqi = computed(() => {
    const items = this.records();
    return items.length ? Math.max(...items.map((item) => item.aqi)) : 0;
  });

  constructor() {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      summary: this.airQualityService.getCitySummary(),
      districts: this.airQualityService.getAirQualityList({
        district: this.districtQuery.trim() || undefined,
      }),
    }).subscribe({
      next: ({ summary, districts }) => {
        this.citySummary.set(summary);
        this.records.set(districts);
      },
      error: (error: Error) => {
        this.citySummary.set(null);
        this.records.set([]);
        this.error.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  focusDistrict(): void {
    if (!this.districtQuery.trim()) {
      this.error.set('Enter an Almaty district name before filtering.');
      return;
    }

    this.loadDashboardData();
  }

  clearSearch(): void {
    this.districtQuery = '';
    this.adviceRecord.set(null);
    this.adviceError.set('');
    this.loadDashboardData();
  }

  loadDistrictAdvice(district: string): void {
    if (!district.trim()) {
      this.adviceError.set('Select a district before loading advice.');
      return;
    }

    this.adviceLoading.set(true);
    this.adviceError.set('');

    this.airQualityService.getCurrentAirQuality(district).subscribe({
      next: (record) => this.adviceRecord.set(record),
      error: (error: Error) => {
        this.adviceRecord.set(null);
        this.adviceError.set(error.message);
        this.adviceLoading.set(false);
      },
      complete: () => this.adviceLoading.set(false),
    });
  }

  getAdvicePoints(record: AirQualityRecord): string[] {
    if (record.aqi <= 50) {
      return [
        'Air quality is relatively comfortable for walking classes, light outdoor exercise, and commuting with windows open.',
        'This is a good time to recommend park visits or short outdoor breaks for students.',
        'Keep checking the dashboard because morning and evening pollution in Almaty can shift quickly.',
      ];
    }

    if (record.aqi <= 100) {
      return [
        'Most people can stay active outside, but sensitive groups should keep workouts shorter and avoid roads with heavy traffic.',
        'For presentations, recommend choosing courtyards, parks, or indoor exercise over roadside activity.',
        'Masks are optional here, but helpful for students with asthma or allergy symptoms.',
      ];
    }

    if (record.aqi <= 150) {
      return [
        'Reduce long outdoor exercise and move sports or group meetings indoors where possible.',
        'Sensitive residents should limit exposure, especially in the morning and evening when pollution often feels worse.',
        'Use public transport or short direct routes to reduce total exposure time in this district.',
      ];
    }

    return [
      'Air quality is unhealthy right now. Recommend indoor activity, closed windows, and fewer non-essential outdoor trips.',
      'For high-risk groups, an N95-style mask and shorter commutes are the safest presentation-ready suggestion.',
      'This district should be flagged as a priority area for alerts and extra monitoring.',
    ];
  }

  getStatusClass(status: AirQualityRecord['status']): string {
    switch (status) {
      case 'good':
        return 'bg-emerald-100 text-emerald-700';
      case 'moderate':
        return 'bg-amber-100 text-amber-700';
      case 'unhealthy':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-rose-100 text-rose-700';
    }
  }

  getAqiSurfaceClass(aqi: number): string {
    return this.getMetricClassByAqi(aqi);
  }

  getPm25SurfaceClass(pm25: number): string {
    if (pm25 <= 12) {
      return 'metric-good';
    }

    if (pm25 <= 35.4) {
      return 'metric-moderate';
    }

    if (pm25 <= 55.4) {
      return 'metric-unhealthy';
    }

    return 'metric-hazardous';
  }

  getPm10SurfaceClass(pm10: number): string {
    if (pm10 <= 54) {
      return 'metric-good';
    }

    if (pm10 <= 154) {
      return 'metric-moderate';
    }

    if (pm10 <= 254) {
      return 'metric-unhealthy';
    }

    return 'metric-hazardous';
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

  getPm25Label(pm25: number): string {
    if (pm25 <= 12) {
      return 'Low';
    }

    if (pm25 <= 35.4) {
      return 'Elevated';
    }

    if (pm25 <= 55.4) {
      return 'High';
    }

    return 'Very High';
  }

  getPm10Label(pm10: number): string {
    if (pm10 <= 54) {
      return 'Low';
    }

    if (pm10 <= 154) {
      return 'Elevated';
    }

    if (pm10 <= 254) {
      return 'High';
    }

    return 'Very High';
  }

  private getMetricClassByAqi(aqi: number): string {
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
}
