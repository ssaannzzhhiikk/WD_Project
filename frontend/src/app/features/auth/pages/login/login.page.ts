import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorAlertComponent } from '../../../../shared/components/error-alert/error-alert.component';
import { LoginRequest } from '../../../../core/models/api.models';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, ErrorAlertComponent],
  template: `
    <div class="login-shell">
      <div class="login-box">

        <div class="login-header">
          <div class="login-logo">AW</div>
          <h1>Sign in to AirWatch</h1>
          <p>Almaty air quality monitoring dashboard</p>
        </div>

        <div class="card">
          <div class="card-body-lg stack-sm">

            @if (mockAuthEnabled) {
              <div class="mock-info">
                <strong>Demo mode enabled</strong>
                Login with <strong>{{ mockCredentials.identifier }}</strong> /
                <strong>{{ mockCredentials.password }}</strong>
              </div>
            }

            <div class="form-group">
              <label class="form-label" for="identifier">Username or email</label>
              <input
                id="identifier"
                [(ngModel)]="identifier"
                name="identifier"
                type="text"
                placeholder="student@example.com"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input
                id="password"
                [(ngModel)]="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                class="form-control"
              />
            </div>

            @if (formError()) {
              <app-error-alert title="Login failed" [message]="formError()" />
            }

            <button
              type="button"
              (click)="login()"
              class="btn btn-primary"
              style="width:100%;margin-top:4px"
              [disabled]="isSubmitting()"
            >
              {{ isSubmitting() ? 'Signing in…' : 'Login' }}
            </button>

            @if (mockAuthEnabled) {
              <div class="login-divider">or</div>
              <button
                type="button"
                (click)="useDemoAccount()"
                class="btn btn-secondary"
                style="width:100%"
              >
                Use demo account
              </button>
            }

            <p style="font-size:13px;color:var(--gray-500);margin:4px 0 0;text-align:center">
              Login stores a JWT token and redirects to the dashboard.
            </p>

          </div>
        </div>

        <div style="margin-top:24px;display:grid;gap:12px;grid-template-columns:repeat(3,1fr)">
          <div class="card" style="text-align:center">
            <div class="card-body" style="padding:14px">
              <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px">Dashboard</div>
              <div style="font-size:12px;color:var(--gray-500)">Live AQI &amp; district data</div>
            </div>
          </div>
          <div class="card" style="text-align:center">
            <div class="card-body" style="padding:14px">
              <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px">Map</div>
              <div style="font-size:12px;color:var(--gray-500)">Station overview</div>
            </div>
          </div>
          <div class="card" style="text-align:center">
            <div class="card-body" style="padding:14px">
              <div style="font-size:12px;font-weight:700;color:var(--blue);margin-bottom:4px">Suggestions</div>
              <div style="font-size:12px;color:var(--gray-500)">Personalized advice</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  identifier = '';
  password = '';

  readonly isSubmitting = signal(false);
  readonly formError = signal('');
  readonly mockAuthEnabled = this.authService.mockAuthEnabled;
  readonly mockCredentials = this.authService.mockCredentials;

  constructor() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  login(): void {
    const identifier = this.identifier.trim();
    const password   = this.password.trim();

    if (!identifier || !password) {
      this.formError.set('Please enter both your username or email and your password.');
      return;
    }

    const credentials: LoginRequest = { identifier, password };

    this.isSubmitting.set(true);
    this.formError.set('');

    this.authService.login(credentials).subscribe({
      next: () => {
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/dashboard';
        void this.router.navigateByUrl(redirectTo);
      },
      error: (error: Error) => {
        this.formError.set(error.message);
        this.isSubmitting.set(false);
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

  useDemoAccount(): void {
    this.identifier = this.mockCredentials.identifier;
    this.password   = this.mockCredentials.password;
    this.login();
  }
}
