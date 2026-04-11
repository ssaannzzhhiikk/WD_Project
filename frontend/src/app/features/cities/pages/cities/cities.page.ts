import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  AirQualityRecord,
  SavedSuggestion,
  SuggestionRequest,
} from '../../../../core/models/api.models';
import { AirQualityService } from '../../../../core/services/air-quality.service';
import { CitiesService } from '../../../../core/services/cities.service';
import { ErrorAlertComponent } from '../../../../shared/components/error-alert/error-alert.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';

type SuggestionPreview = Omit<SavedSuggestion, 'id' | 'createdAt' | 'updatedAt'>;

@Component({
  selector: 'app-cities-page',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, ErrorAlertComponent, LoadingStateComponent],
  template: `
    <section class="flex w-full flex-col gap-6">
      <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div class="panel-surface rounded-[2rem] px-6 py-8 sm:px-8">
          <p class="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">Suggestions</p>
          <h1 class="page-title mt-4 text-white">Personalized Almaty air quality advice</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Generate simple recommendations for residents based on the selected Almaty district,
            current pollution, activity type, and sensitivity level. Save the best suggestion cards
            locally for your defense presentation.
          </p>
        </div>

        <div class="panel-light rounded-[2rem] px-6 py-8 text-slate-900">
          <p class="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-700">Build a suggestion</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">District</span>
              <input
                [(ngModel)]="form.district"
                name="district"
                type="text"
                placeholder="Copy a district label, for example Бостандыкский"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              >
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Activity type</span>
              <select
                [(ngModel)]="form.activityType"
                name="activityType"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              >
                <option value="walking">Walking</option>
                <option value="commute">Daily commute</option>
                <option value="outdoor-sport">Outdoor sport</option>
                <option value="family-time">Family time outside</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Sensitivity</span>
              <select
                [(ngModel)]="form.sensitivityLevel"
                name="sensitivityLevel"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              >
                <option value="low">Low sensitivity</option>
                <option value="medium">Medium sensitivity</option>
                <option value="high">High sensitivity</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Travel mode</span>
              <select
                [(ngModel)]="form.travelMode"
                name="travelMode"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
              >
                <option value="walking">Walking</option>
                <option value="public-transport">Public transport</option>
                <option value="car">Car</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
          </div>

          <label class="mt-4 block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Presentation note</span>
            <textarea
              [(ngModel)]="form.note"
              name="note"
              rows="3"
              placeholder="Optional context for your presentation or user story"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
            ></textarea>
          </label>

          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              (click)="generateSuggestion()"
              class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {{ generating() ? 'Generating...' : 'Generate suggestion' }}
            </button>
            <button
              type="button"
              (click)="saveSuggestion()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Save suggestion
            </button>
            <button
              type="button"
              (click)="loadSavedSuggestions()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Reload saved suggestions
            </button>
            <button
              type="button"
              (click)="resetForm()"
              class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            >
              Reset form
            </button>
          </div>
        </div>
      </div>

      @if (successMessage()) {
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-900">
          {{ successMessage() }}
        </div>
      }

      @if (error()) {
        <app-error-alert title="Suggestion request failed" [message]="error()" />
      }

      <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div class="panel-light rounded-[2rem] p-6 text-slate-900">
          <p class="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Live preview</p>

          @if (generating()) {
            <div class="mt-5">
              <app-loading-state
                message="Generating recommendation..."
                detail="AirWatch is requesting the latest district values before composing a recommendation."
              />
            </div>
          } @else if (preview(); as suggestion) {
            <div class="mt-5 space-y-4">
              <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                      {{ suggestion.district }}
                    </p>
                    <h2 class="mt-2 text-2xl font-semibold text-slate-950">
                      {{ suggestion.summary }}
                    </h2>
                  </div>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]" [class]="getStatusClass(suggestion.riskLevel)">
                    {{ suggestion.riskLevel }}
                  </span>
                </div>

                <div class="mt-5 grid gap-3 sm:grid-cols-3">
                  <div class="rounded-2xl bg-slate-950 p-4 text-white">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-400">AQI</p>
                    <p class="mt-2 text-2xl font-semibold">{{ suggestion.currentAqi }}</p>
                  </div>
                  <div class="rounded-2xl bg-cyan-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-500">PM2.5</p>
                    <p class="mt-2 text-2xl font-semibold">{{ suggestion.currentPm25 | number: '1.0-1' }}</p>
                  </div>
                  <div class="rounded-2xl bg-amber-50 p-4">
                    <p class="text-xs uppercase tracking-[0.24em] text-slate-500">PM10</p>
                    <p class="mt-2 text-2xl font-semibold">{{ suggestion.currentPm10 | number: '1.0-1' }}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                @for (tip of getSuggestionBullets(suggestion); track tip) {
                  <div class="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                    {{ tip }}
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="mt-5 rounded-2xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-600">
              Fill in the form, then click <span class="font-semibold text-slate-900">Generate suggestion</span>
              to create a district-specific recommendation card.
            </div>
          }
        </div>

        <div class="panel-light rounded-[2rem] p-6 text-slate-900">
          <p class="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Saved suggestions</p>

          @if (loading()) {
            <div class="mt-5">
              <app-loading-state
                message="Loading saved suggestions..."
                detail="Saved recommendation cards are being loaded from local storage."
              />
            </div>
          } @else {
            <div class="mt-4 grid gap-4 md:grid-cols-2">
              @for (item of savedSuggestions(); track item.id) {
                <article class="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                        {{ item.district }}
                      </p>
                      <h2 class="mt-2 text-xl font-semibold text-slate-950">{{ item.summary }}</h2>
                    </div>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]" [class]="getStatusClass(item.riskLevel)">
                      {{ item.riskLevel }}
                    </span>
                  </div>

                  <div class="mt-4 space-y-2 text-sm text-slate-600">
                    <p>Activity: <span class="font-medium text-slate-900">{{ item.activityType }}</span></p>
                    <p>Sensitivity: <span class="font-medium text-slate-900">{{ item.sensitivityLevel }}</span></p>
                    <p>Travel mode: <span class="font-medium text-slate-900">{{ item.travelMode }}</span></p>
                    <p>Created: <span class="font-medium text-slate-900">{{ item.createdAt | date: 'mediumDate' }}</span></p>
                    @if (item.note) {
                      <p>Note: <span class="font-medium text-slate-900">{{ item.note }}</span></p>
                    }
                  </div>

                  <button
                    type="button"
                    (click)="deleteSavedSuggestion(item.id)"
                    class="mt-5 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    Delete suggestion
                  </button>
                </article>
              } @empty {
                <div class="rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-sm leading-6 text-slate-600 md:col-span-2">
                  Generate and save a recommendation to keep a few polished examples ready for your presentation.
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class CitiesPageComponent {
  private readonly airQualityService = inject(AirQualityService);
  private readonly citiesService = inject(CitiesService);

  readonly savedSuggestions = signal<SavedSuggestion[]>([]);
  readonly preview = signal<SuggestionPreview | null>(null);
  readonly loading = signal(false);
  readonly generating = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  form: SuggestionRequest = this.createEmptyForm();

  constructor() {
    this.loadSavedSuggestions();
  }

  loadSavedSuggestions(): void {
    this.loading.set(true);
    this.error.set('');
    this.citiesService.getSavedSuggestions().subscribe({
      next: (items) => this.savedSuggestions.set(items),
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  generateSuggestion(): void {
    if (!this.form.district.trim()) {
      this.error.set('Choose an Almaty district before generating a suggestion.');
      return;
    }

    this.generating.set(true);
    this.error.set('');
    this.successMessage.set('');

    this.airQualityService.getCurrentAirQuality(this.form.district.trim()).subscribe({
      next: (record) => this.preview.set(this.buildPreview(record)),
      error: (error: Error) => {
        this.preview.set(null);
        this.error.set(error.message);
        this.generating.set(false);
      },
      complete: () => this.generating.set(false),
    });
  }

  saveSuggestion(): void {
    const preview = this.preview();

    if (!preview) {
      this.error.set('Generate a suggestion before saving it.');
      return;
    }

    this.error.set('');
    this.successMessage.set('');

    this.citiesService.addSavedSuggestion(preview).subscribe({
      next: (savedItem) => {
        this.savedSuggestions.update((items) => [savedItem, ...items]);
        this.successMessage.set(`Saved a suggestion for ${savedItem.district}.`);
      },
    });
  }

  deleteSavedSuggestion(id: number): void {
    this.error.set('');
    this.successMessage.set('');

    this.citiesService.deleteSavedSuggestion(id).subscribe({
      next: () => {
        this.savedSuggestions.update((items) => items.filter((item) => item.id !== id));
        this.successMessage.set('Saved suggestion removed successfully.');
      },
    });
  }

  resetForm(): void {
    this.form = this.createEmptyForm();
    this.preview.set(null);
    this.error.set('');
    this.successMessage.set('');
  }

  getSuggestionBullets(preview: SuggestionPreview): string[] {
    const sensitivityMessage =
      preview.sensitivityLevel === 'high'
        ? 'Because this user is highly sensitive, the advice should prioritize shorter exposure and cleaner indoor alternatives.'
        : preview.sensitivityLevel === 'medium'
          ? 'A moderate-sensitivity user can still go outside, but should avoid long exposure near busy roads.'
          : 'A low-sensitivity user can be more flexible, but should still avoid needless exposure when pollution rises.';

    const travelMessage =
      preview.travelMode === 'walking'
        ? 'Walking routes should favor side streets, parks, and shorter direct paths instead of heavy traffic corridors.'
        : preview.travelMode === 'public-transport'
          ? 'Public transport is a good choice here because it shortens time spent in open traffic compared with a long outdoor route.'
          : preview.travelMode === 'car'
            ? 'For car trips, keep windows closed and avoid unnecessary idling in traffic hot spots.'
            : 'A mixed travel plan works best if outdoor exposure is kept short during the most polluted hours.';

    return [sensitivityMessage, travelMessage, preview.note || 'This recommendation can be presented as a student-friendly daily guidance card for Almaty residents.'];
  }

  getStatusClass(status: SavedSuggestion['riskLevel']): string {
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

  private buildPreview(record: AirQualityRecord): SuggestionPreview {
    return {
      district: record.district || this.form.district.trim(),
      activityType: this.form.activityType,
      sensitivityLevel: this.form.sensitivityLevel,
      travelMode: this.form.travelMode,
      note: this.form.note?.trim() || '',
      summary: this.composeSummary(record),
      riskLevel: record.status,
      currentAqi: record.aqi,
      currentPm25: record.pm25,
      currentPm10: record.pm10,
    };
  }

  private composeSummary(record: AirQualityRecord): string {
    if (record.aqi <= 50) {
      return `Good conditions for ${this.form.activityType.replace('-', ' ')} in ${record.district}`;
    }

    if (record.aqi <= 100) {
      return `Moderate air quality: plan ${this.form.activityType.replace('-', ' ')} carefully in ${record.district}`;
    }

    if (record.aqi <= 150) {
      return `Reduce outdoor ${this.form.activityType.replace('-', ' ')} in ${record.district}`;
    }

    return `Prefer indoor plans and short trips in ${record.district}`;
  }

  private createEmptyForm(): SuggestionRequest {
    return {
      district: '',
      activityType: 'walking',
      sensitivityLevel: 'medium',
      travelMode: 'public-transport',
      note: '',
    };
  }
}
