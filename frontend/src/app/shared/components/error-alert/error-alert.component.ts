import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  template: `
    <div
      class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-900 shadow-sm"
      [class.py-3]="compact()"
    >
      <p class="font-semibold">{{ title() }}</p>
      @if (message()) {
        <p class="mt-1 text-sm leading-6 text-rose-800">{{ message() }}</p>
      }
    </div>
  `,
})
export class ErrorAlertComponent {
  readonly title = input('Something went wrong');
  readonly message = input('');
  readonly compact = input(false);
}
