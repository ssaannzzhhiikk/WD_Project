from django.contrib import admin

from .models import AirQualityHistoryPoint, AirQualityRecord, MapLocation


@admin.register(AirQualityRecord)
class AirQualityRecordAdmin(admin.ModelAdmin):
    list_display = ('district_name', 'aqi', 'pm25', 'pm10', 'source', 'timestamp')
    list_filter = ('source', 'district_name')
    search_fields = ('district_name', 'source')


@admin.register(AirQualityHistoryPoint)
class AirQualityHistoryPointAdmin(admin.ModelAdmin):
    list_display = ('record', 'aqi', 'value', 'timestamp')
    list_filter = ('record__district_name',)


@admin.register(MapLocation)
class MapLocationAdmin(admin.ModelAdmin):
    list_display = ('station_name', 'record', 'latitude', 'longitude', 'source')
    search_fields = ('station_name', 'record__district_name')
