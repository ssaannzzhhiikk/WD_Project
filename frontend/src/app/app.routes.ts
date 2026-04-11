import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard/dashboard.page').then(
        (m) => m.DashboardPageComponent,
      ),
  },
  {
    path: 'map',
    canActivate: [authGuard],
    loadComponent: () => import('./features/map/pages/map/map.page').then((m) => m.MapPageComponent),
  },
  {
    path: 'cities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cities/pages/cities/cities.page').then((m) => m.CitiesPageComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
