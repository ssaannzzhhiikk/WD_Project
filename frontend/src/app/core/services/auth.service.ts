import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, delay, of, tap, throwError } from 'rxjs';
import { API_ENDPOINTS, buildApiUrl } from '../config/api-endpoints';
import { LoginRequest, LoginResponse, User } from '../models/api.models';
import { ApiErrorService } from './api-error.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiErrorService = inject(ApiErrorService);

  private readonly accessTokenKey = 'airwatch.access_token';
  private readonly refreshTokenKey = 'airwatch.refresh_token';
  private readonly userKey = 'airwatch.user';

  private readonly accessTokenSignal = signal<string | null>(this.readStorage(this.accessTokenKey));
  private readonly currentUserSignal = signal<User | null>(this.readUser());

  readonly isAuthenticatedSignal = computed(() => !!this.accessTokenSignal());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly mockAuthEnabled = environment.mockAuth;
  readonly mockCredentials = environment.mockCredentials;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    if (this.mockAuthEnabled) {
      return this.loginWithMockAuth(credentials);
    }

    return this.http.post<LoginResponse>(buildApiUrl(API_ENDPOINTS.auth.login), credentials).pipe(
      tap((response) => this.setSession(response)),
      catchError((error) =>
        throwError(
          () =>
            new Error(
              this.apiErrorService.getMessage(
                error,
                'Unable to sign in right now. Please check your credentials and try again.',
              ),
            ),
        ),
      ),
    );
  }

  logout(): Observable<void> {
    if (this.mockAuthEnabled) {
      return of(void 0).pipe(
        delay(150),
        tap(() => this.clearSession()),
      );
    }

    const logoutRequest$ = this.getToken()
      ? this.http.post<void>(buildApiUrl(API_ENDPOINTS.auth.logout), {})
      : of(void 0);

    return logoutRequest$.pipe(
      catchError(() => of(void 0)),
      tap(() => this.clearSession()),
    );
  }

  getToken(): string | null {
    return this.accessTokenSignal();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  handleUnauthorized(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private loginWithMockAuth(credentials: LoginRequest): Observable<LoginResponse> {
    const normalizedIdentifier = credentials.identifier.trim().toLowerCase();
    const expectedIdentifier = this.mockCredentials.identifier.trim().toLowerCase();
    const identifierMatches =
      normalizedIdentifier === expectedIdentifier || normalizedIdentifier === 'demo';
    const passwordMatches = credentials.password === this.mockCredentials.password;

    if (!identifierMatches || !passwordMatches) {
      return throwError(
        () =>
          new Error(
            `Mock auth is enabled. Use ${this.mockCredentials.identifier} / ${this.mockCredentials.password}.`,
          ),
      );
    }

    const response: LoginResponse = {
      access: 'mock-airwatch-access-token',
      refresh: 'mock-airwatch-refresh-token',
      user: {
        id: 1,
        username: 'demo',
        email: this.mockCredentials.identifier,
        fullName: 'Demo AirWatch User',
        role: 'student',
      },
    };

    return of(response).pipe(
      delay(350),
      tap((mockResponse) => this.setSession(mockResponse)),
    );
  }

  private setSession(response: LoginResponse): void {
    localStorage.setItem(this.accessTokenKey, response.access);

    if (response.refresh) {
      localStorage.setItem(this.refreshTokenKey, response.refresh);
    }

    localStorage.setItem(this.userKey, JSON.stringify(response.user));

    this.accessTokenSignal.set(response.access);
    this.currentUserSignal.set(response.user);
  }

  private readStorage(key: string): string | null {
    return localStorage.getItem(key);
  }

  private readUser(): User | null {
    const storedUser = this.readStorage(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
