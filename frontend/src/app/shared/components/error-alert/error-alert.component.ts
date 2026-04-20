import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  template: `
    <div class="alert alert-error">
      <div class="alert-title">{{ title() }}</div>
      @if (message()) {
        <div class="alert-msg">{{ message() }}</div>
      }
    </div>
  `,
})
export class ErrorAlertComponent {
  readonly title   = input('Something went wrong');
  readonly message = input('');
  readonly compact = input(false);
}
