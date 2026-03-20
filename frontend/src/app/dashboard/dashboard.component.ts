import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { AirQualityService, Location } from '../../app/services/air-quality.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html', // or keep inline template
})
export class DashboardComponent implements OnInit {
  private aqService = inject(AirQualityService);
  private cdr = inject(ChangeDetectorRef);  // 👈 key fix

  locations: Location[] = [];
  loading = true;

  get monitorCount() { return this.locations.filter(l => l.isMonitor).length; }
  get sensorCount()  { return this.locations.filter(l => !l.isMonitor).length; }

  ngOnInit() {
    this.aqService.getLocations().subscribe({
      next: (res) => {
        this.locations = res.results ?? [];
        this.loading = false;
        this.cdr.detectChanges();  // 👈 forces UI to update
      },
      error: (err) => {
        console.error('API error:', err);
        this.loading = false;
        this.cdr.detectChanges();  // 👈 also here so loading spinner goes away
      },
    });
  }
}