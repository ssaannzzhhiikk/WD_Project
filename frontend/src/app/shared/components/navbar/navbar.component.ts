import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a routerLink="/dashboard" class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-xl">
            AW
          </div>
          <div>
            <p class="text-lg font-semibold tracking-tight text-white">AirWatch</p>
            <p class="text-sm text-slate-300">Almaty air quality and smart daily suggestions</p>
          </div>
        </a>

        <div class="flex items-center gap-3">
          @if (isAuthenticated()) {
            <nav class="hidden items-center gap-2 md:flex">
              <a
                routerLink="/dashboard"
                routerLinkActive="bg-white/15 text-white"
                class="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Dashboard
              </a>
              <a
                routerLink="/map"
                routerLinkActive="bg-white/15 text-white"
                class="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Map
              </a>
              <a
                routerLink="/cities"
                routerLinkActive="bg-white/15 text-white"
                class="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Suggestions
              </a>
            </nav>

            <div class="hidden text-right md:block">
              <p class="text-sm font-medium text-white">{{ currentUser()?.fullName || 'Student User' }}</p>
              <p class="text-xs uppercase tracking-[0.22em] text-cyan-300">
                {{ currentUser()?.role || 'viewer' }}
              </p>
            </div>

            <button
              type="button"
              (click)="logout()"
              class="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {{ loggingOut() ? 'Signing out...' : 'Logout' }}
            </button>
          } @else {
            <a
              routerLink="/login"
              class="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
            >
              Login
            </a>
          }
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticatedSignal;
  readonly loggingOut = signal(false);

  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => {
        this.loggingOut.set(false);
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.loggingOut.set(false);
        void this.router.navigate(['/login']);
      },
    });
  }
}
