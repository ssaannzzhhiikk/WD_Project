import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SavedSuggestion } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CitiesService {
  private readonly storageKey = 'airwatch.almaty.saved-suggestions';

  getSavedSuggestions(): Observable<SavedSuggestion[]> {
    return of(this.readSuggestions());
  }

  addSavedSuggestion(data: Omit<SavedSuggestion, 'id' | 'createdAt' | 'updatedAt'>): Observable<SavedSuggestion> {
    const suggestions = this.readSuggestions();
    const nextItem: SavedSuggestion = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.writeSuggestions([nextItem, ...suggestions]);
    return of(nextItem);
  }

  deleteSavedSuggestion(id: number): Observable<void> {
    const suggestions = this.readSuggestions().filter((item) => item.id !== id);
    this.writeSuggestions(suggestions);
    return of(void 0);
  }

  private readSuggestions(): SavedSuggestion[] {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return [];
    }

    try {
      return JSON.parse(rawValue) as SavedSuggestion[];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private writeSuggestions(items: SavedSuggestion[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
