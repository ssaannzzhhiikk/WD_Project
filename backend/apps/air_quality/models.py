from django.db import models
from django.utils import timezone


class AirQualityRecordQuerySet(models.QuerySet):
    def filtered(self, district: str | None = None, min_aqi: int | None = None):
        queryset = self
        if district:
            queryset = queryset.filter(district_name__icontains=district)
        if min_aqi is not None:
            queryset = queryset.filter(aqi__gte=min_aqi)
        return queryset

    def latest_first(self):
        return self.order_by('-timestamp', '-aqi')


class AirQualityRecord(models.Model):
    city = models.CharField(max_length=120, default='Almaty')
    country = models.CharField(max_length=120, default='Kazakhstan')
    district_name = models.CharField(max_length=120, db_index=True)
    aqi = models.PositiveIntegerField()
    pm25 = models.DecimalField(max_digits=6, decimal_places=2)
    pm10 = models.DecimalField(max_digits=6, decimal_places=2)
    no2 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    source = models.CharField(max_length=120)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=43.238949)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=76.889709)
    station_count = models.PositiveIntegerField(default=1)
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AirQualityRecordQuerySet.as_manager()

    class Meta:
        ordering = ['-timestamp', '-aqi']

    def __str__(self) -> str:
        return f'{self.district_name} ({self.aqi})'


class AirQualityHistoryPoint(models.Model):
    record = models.ForeignKey(
        AirQualityRecord,
        on_delete=models.CASCADE,
        related_name='history_points',
    )
    value = models.DecimalField(max_digits=6, decimal_places=2)
    aqi = models.PositiveIntegerField()
    pm25 = models.DecimalField(max_digits=6, decimal_places=2)
    pm10 = models.DecimalField(max_digits=6, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self) -> str:
        return f'{self.record.district_name} @ {self.timestamp:%Y-%m-%d %H:%M}'


class MapLocation(models.Model):
    record = models.ForeignKey(
        AirQualityRecord,
        on_delete=models.CASCADE,
        related_name='map_locations',
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    station_name = models.CharField(max_length=150)
    source = models.CharField(max_length=120, blank=True)
    no2 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['station_name']

    def __str__(self) -> str:
        return self.station_name
