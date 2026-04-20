import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="navbar-inner">
        <a routerLink="/dashboard" class="navbar-brand">
          <div class="navbar-logo">AW</div>
          <div>
            <div>AirWatch</div>
            <div style="font-size:12px;font-weight:400;color:var(--gray-500)">Almaty Air Quality</div>
          </div>
        </a>

        <div class="navbar-right">
          @if (isAuthenticated()) {
            <nav class="navbar-nav" style="display:none" [style.display]="'flex'">
              <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-link">Dashboard</a>
              <a routerLink="/map"       routerLinkActive="active-link" class="nav-link">Map</a>
              <a routerLink="/cities"    routerLinkActive="active-link" class="nav-link">Suggestions</a>
            </nav>

            <div class="navbar-user">
              <strong>{{ currentUser()?.fullName || 'Student User' }}</strong>
              {{ currentUser()?.role || 'viewer' }}
            </div>

            <button type="button" (click)="logout()" class="btn btn-secondary btn-sm">
              {{ loggingOut() ? 'Signing out…' : 'Logout' }}
            </button>
          } @else {
            <a routerLink="/login" class="btn btn-primary btn-sm">Login</a>
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
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.authService.logout().subscribe({
      next: () => { this.loggingOut.set(false); void this.router.navigate(['/login']); },
      error: () => { this.loggingOut.set(false); void this.router.navigate(['/login']); },
    });
  }
}
