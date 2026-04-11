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
    <section class="grid w-full gap-6 lg:grid-cols-[1.2fr_0.9fr]">
      <div class="panel-surface relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 lg:px-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(103,247,193,0.18),_transparent_32%)]"></div>
        <div class="relative">
          <p class="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-300">AirWatch</p>
          <h1 class="page-title mt-4 text-white">Monitor the air before the air monitors you.</h1>
          <p class="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            This Angular 21 frontend is prepared for a Django REST API and presents AQI, PM2.5,
            PM10, location, and trend data in a simple defense-ready interface.
          </p>

          <div class="mt-8 grid gap-4 md:grid-cols-3">
            <article class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p class="text-sm font-medium text-cyan-300">Real-time dashboard</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">
                Search cities, refresh readings, and load city history with API calls.
              </p>
            </article>
            <article class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p class="text-sm font-medium text-cyan-300">Map-ready data</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">
                Modular location rendering that can connect to Leaflet later without changing
                services.
              </p>
            </article>
            <article class="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p class="text-sm font-medium text-cyan-300">Student friendly</p>
              <p class="mt-2 text-sm leading-6 text-slate-300">
                Clean routing, JWT auth flow, and presentation-ready UI for the project defense.
              </p>
            </article>
          </div>

          <div class="mt-10 rounded-[1.75rem] border border-cyan-300/15 bg-slate-950/30 p-6">
            <p class="text-sm uppercase tracking-[0.28em] text-slate-400">Project team</p>
            <div class="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              <p>Abish Nuralim</p>
              <p>Shakirbek Amina</p>
              <p>Omarkhanov Sanzhar</p>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-light rounded-[2rem] px-6 py-8 text-slate-900 sm:px-8">
        <p class="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-700">JWT Sign In</p>
        <h2 class="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Login to AirWatch</h2>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Use your backend-issued credentials. The frontend stores the access token in localStorage
          and attaches it through an HTTP interceptor.
        </p>

        @if (mockAuthEnabled) {
          <div class="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
            <p class="font-semibold">Mock auth is enabled for demo mode</p>
            <p class="mt-2 leading-6">
              Login with <span class="font-semibold">{{ mockCredentials.identifier }}</span> and
              <span class="font-semibold">{{ mockCredentials.password }}</span>, or use the demo
              button below.
            </p>
          </div>
        }

        <div class="mt-6 space-y-5">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Username or email</span>
            <input
              [(ngModel)]="identifier"
              name="identifier"
              type="text"
              placeholder="student@example.com"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
            >
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              [(ngModel)]="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15"
            >
          </label>
        </div>

        @if (formError()) {
          <div class="mt-5">
            <app-error-alert title="Login failed" [message]="formError()" />
          </div>
        }

        <button
          type="button"
          (click)="login()"
          class="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {{ isSubmitting() ? 'Signing in...' : 'Login' }}
        </button>

        @if (mockAuthEnabled) {
          <button
            type="button"
            (click)="useDemoAccount()"
            class="mt-3 w-full rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
          >
            Use demo account
          </button>
        }

        <div class="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
          <p class="font-semibold text-slate-900">Demo flow</p>
          <p class="mt-2 leading-6">
            Successful login stores the JWT token, updates auth state, and redirects to
            <span class="font-semibold text-slate-900">/dashboard</span>.
          </p>
        </div>
      </div>
    </section>
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
    const password = this.password.trim();

    if (!identifier || !password) {
      this.formError.set('Please enter both your username or email and your password.');
      return;
    }

    const credentials: LoginRequest = {
      identifier,
      password,
    };

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
    this.password = this.mockCredentials.password;
    this.login();
  }
}
