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
    <div class="stack">

      <div class="page-header">
        <h1>Personalized Suggestions</h1>
        <p>Generate and save air quality recommendations for Almaty districts</p>
      </div>

      <!-- Build form -->
      <div class="card">
        <div class="card-body">
          <div class="card-subtitle">Build a suggestion</div>
          <div class="card-title" style="margin-bottom:16px">Suggestion form</div>

          <div class="grid-2" style="margin-bottom:14px">
            <div class="form-group">
              <label class="form-label">District</label>
              <input
                [(ngModel)]="form.district"
                name="district"
                type="text"
                placeholder="e.g. Бостандыкский"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Activity type</label>
              <select [(ngModel)]="form.activityType" name="activityType" class="form-control">
                <option value="walking">Walking</option>
                <option value="commute">Daily commute</option>
                <option value="outdoor-sport">Outdoor sport</option>
                <option value="family-time">Family time outside</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Sensitivity level</label>
              <select [(ngModel)]="form.sensitivityLevel" name="sensitivityLevel" class="form-control">
                <option value="low">Low sensitivity</option>
                <option value="medium">Medium sensitivity</option>
                <option value="high">High sensitivity</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Travel mode</label>
              <select [(ngModel)]="form.travelMode" name="travelMode" class="form-control">
                <option value="walking">Walking</option>
                <option value="public-transport">Public transport</option>
                <option value="car">Car</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Notes (optional)</label>
            <textarea
              [(ngModel)]="form.note"
              name="note"
              rows="2"
              placeholder="Optional context for your presentation"
              class="form-control"
            ></textarea>
          </div>

          <div class="btn-row">
            <button type="button" (click)="generateSuggestion()" class="btn btn-primary">
              {{ generating() ? 'Generating…' : 'Generate suggestion' }}
            </button>
            <button type="button" (click)="saveSuggestion()"       class="btn btn-secondary">Save suggestion</button>
            <button type="button" (click)="loadSavedSuggestions()" class="btn btn-secondary">Reload saved</button>
            <button type="button" (click)="resetForm()"            class="btn btn-secondary">Reset form</button>
          </div>
        </div>
      </div>

      @if (successMessage()) {
        <div class="alert alert-success">{{ successMessage() }}</div>
      }
      @if (error()) {
        <app-error-alert title="Suggestion request failed" [message]="error()" />
      }

      <div class="split-layout">

        <!-- Live preview -->
        <div class="card">
          <div class="card-body">
            <div class="card-subtitle">Live preview</div>
            <div class="card-title" style="margin-bottom:14px">Generated suggestion</div>

            @if (generating()) {
              <app-loading-state message="Generating recommendation…" />
            } @else if (preview(); as suggestion) {
              <div class="stack-sm">
                <div class="preview-card">
                  <div class="preview-header">
                    <div>
                      <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">
                        {{ suggestion.district }}
                      </div>
                      <h3 style="margin:0;font-size:16px;font-weight:700">{{ suggestion.summary }}</h3>
                    </div>
                    <span class="badge" [class]="'badge-' + suggestion.riskLevel">
                      {{ suggestion.riskLevel }}
                    </span>
                  </div>
                  <div class="grid-3">
                    <div class="metric-tile metric-good" style="text-align:center">
                      <div class="mt-label">AQI</div>
                      <div class="mt-value">{{ suggestion.currentAqi }}</div>
                    </div>
                    <div class="metric-tile metric-moderate" style="text-align:center">
                      <div class="mt-label">PM2.5</div>
                      <div class="mt-value">{{ suggestion.currentPm25 | number:'1.0-1' }}</div>
                    </div>
                    <div class="metric-tile metric-unhealthy" style="text-align:center">
                      <div class="mt-label">PM10</div>
                      <div class="mt-value">{{ suggestion.currentPm10 | number:'1.0-1' }}</div>
                    </div>
                  </div>
                </div>

                @for (tip of getSuggestionBullets(suggestion); track tip) {
                  <div class="advice-tip" style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius);padding:12px 14px;font-size:13px;line-height:1.6;color:var(--gray-700)">
                    {{ tip }}
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state">
                <strong>No preview yet</strong>
                <p>Fill in the form and click <strong>Generate suggestion</strong>.</p>
              </div>
            }
          </div>
        </div>

        <!-- Saved suggestions -->
        <div class="card">
          <div class="card-body">
            <div class="card-subtitle">Saved suggestions</div>
            <div class="card-title" style="margin-bottom:14px">Your saved cards</div>

            @if (loading()) {
              <app-loading-state message="Loading saved suggestions…" />
            } @else {
              <div class="stack-sm">
                @for (item of savedSuggestions(); track item.id) {
                  <div class="suggestion-card">
                    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
                      <div>
                        <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">
                          {{ item.district }}
                        </div>
                        <h3 style="margin:0;font-size:14px;font-weight:700">{{ item.summary }}</h3>
                      </div>
                      <span class="badge" [class]="'badge-' + item.riskLevel">{{ item.riskLevel }}</span>
                    </div>

                    <div class="suggestion-meta">
                      <div>Activity: <span>{{ item.activityType }}</span></div>
                      <div>Sensitivity: <span>{{ item.sensitivityLevel }}</span></div>
                      <div>Travel: <span>{{ item.travelMode }}</span></div>
                      <div>Saved: <span>{{ item.createdAt | date:'mediumDate' }}</span></div>
                      @if (item.note) {
                        <div>Note: <span>{{ item.note }}</span></div>
                      }
                    </div>

                    <button
                      type="button"
                      (click)="deleteSavedSuggestion(item.id)"
                      class="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>

                } @empty {
                  <div class="empty-state">
                    <strong>No saved suggestions</strong>
                    <p>Generate and save a recommendation to keep polished examples for your presentation.</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
})
export class CitiesPageComponent {
  private readonly airQualityService = inject(AirQualityService);
  private readonly citiesService = inject(CitiesService);

  readonly savedSuggestions = signal<SavedSuggestion[]>([]);
  readonly preview          = signal<SuggestionPreview | null>(null);
  readonly loading          = signal(false);
  readonly generating       = signal(false);
  readonly error            = signal('');
  readonly successMessage   = signal('');

  form: SuggestionRequest = this.createEmptyForm();

  constructor() { this.loadSavedSuggestions(); }

  loadSavedSuggestions(): void {
    this.loading.set(true);
    this.error.set('');
    this.citiesService.getSavedSuggestions().subscribe({
      next: (items) => this.savedSuggestions.set(items),
      error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
      complete: () => this.loading.set(false),
    });
  }

  generateSuggestion(): void {
    if (!this.form.district.trim()) { this.error.set('Choose an Almaty district before generating a suggestion.'); return; }
    this.generating.set(true);
    this.error.set('');
    this.successMessage.set('');
    this.airQualityService.getCurrentAirQuality(this.form.district.trim()).subscribe({
      next: (record) => this.preview.set(this.buildPreview(record)),
      error: (error: Error) => { this.preview.set(null); this.error.set(error.message); this.generating.set(false); },
      complete: () => this.generating.set(false),
    });
  }

  saveSuggestion(): void {
    const preview = this.preview();
    if (!preview) { this.error.set('Generate a suggestion before saving it.'); return; }
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
      case 'good':      return 'bg-emerald-100 text-emerald-700';
      case 'moderate':  return 'bg-amber-100 text-amber-700';
      case 'unhealthy': return 'bg-orange-100 text-orange-700';
      default:          return 'bg-rose-100 text-rose-700';
    }
  }

  private buildPreview(record: AirQualityRecord): SuggestionPreview {
    return {
      district:         record.district || this.form.district.trim(),
      activityType:     this.form.activityType,
      sensitivityLevel: this.form.sensitivityLevel,
      travelMode:       this.form.travelMode,
      note:             this.form.note?.trim() || '',
      summary:          this.composeSummary(record),
      riskLevel:        record.status,
      currentAqi:       record.aqi,
      currentPm25:      record.pm25,
      currentPm10:      record.pm10,
    };
  }

  private composeSummary(record: AirQualityRecord): string {
    if (record.aqi <= 50)  return `Good conditions for ${this.form.activityType.replace('-', ' ')} in ${record.district}`;
    if (record.aqi <= 100) return `Moderate air quality: plan ${this.form.activityType.replace('-', ' ')} carefully in ${record.district}`;
    if (record.aqi <= 150) return `Reduce outdoor ${this.form.activityType.replace('-', ' ')} in ${record.district}`;
    return `Prefer indoor plans and short trips in ${record.district}`;
  }

  private createEmptyForm(): SuggestionRequest {
    return { district: '', activityType: 'walking', sensitivityLevel: 'medium', travelMode: 'public-transport', note: '' };
  }
}
