import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="panel-light flex min-h-48 flex-col items-center justify-center rounded-3xl px-6 py-10 text-center text-slate-700">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500"></div>
      <p class="mt-4 text-lg font-semibold">{{ message() }}</p>
      @if (detail()) {
        <p class="mt-2 max-w-md text-sm text-slate-500">{{ detail() }}</p>
      }
    </div>
  `,
})
export class LoadingStateComponent {
  readonly message = input('Loading AirWatch data...');
  readonly detail = input('');
}
