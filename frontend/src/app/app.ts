import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <nav class="bg-blue-900 text-white px-6 py-4 flex items-center gap-3">
      <span class="text-xl font-bold">🌍 AirWatch</span>
      <span class="text-sm text-blue-300">Air Quality Monitor</span>
    </nav>
    <main class="min-h-screen bg-gray-100">
      <router-outlet />
    </main>
  `,
})
export class App {}