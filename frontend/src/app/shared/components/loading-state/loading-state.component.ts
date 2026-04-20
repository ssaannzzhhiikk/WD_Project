import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="loading-box">
      <div class="spinner"></div>
      <div class="loading-msg">{{ message() }}</div>
      @if (detail()) {
        <div class="loading-detail">{{ detail() }}</div>
      }
    </div>
  `,
})
export class LoadingStateComponent {
  readonly message = input('Loading…');
  readonly detail  = input('');
}
