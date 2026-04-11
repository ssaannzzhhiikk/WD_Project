import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  getMessage(error: unknown, fallbackMessage = 'Something went wrong. Please try again.'): string {
    if (!(error instanceof HttpErrorResponse)) {
      return error instanceof Error ? error.message : fallbackMessage;
    }

    if (error.error && typeof error.error === 'object') {
      const apiError = error.error as ApiErrorResponse;

      if (typeof apiError.detail === 'string' && apiError.detail.trim()) {
        return apiError.detail;
      }

      if (typeof apiError.message === 'string' && apiError.message.trim()) {
        return apiError.message;
      }

      if (apiError.errors) {
        return Object.values(apiError.errors)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .join(' ');
      }
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    switch (error.status) {
      case 0:
        return 'AirWatch could not reach the API server. Check the backend URL and try again.';
      case 400:
        return 'The request was rejected. Please review the form values and try again.';
      case 401:
        return 'Your session expired. Please sign in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'The server reported an internal error. Please try again in a moment.';
      default:
        return fallbackMessage;
    }
  }
}
