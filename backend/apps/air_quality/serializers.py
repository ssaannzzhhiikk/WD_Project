from rest_framework import serializers

from .models import AirQualityHistoryPoint, AirQualityRecord, MapLocation


class AirQualityRecordSerializer(serializers.ModelSerializer):
    district = serializers.CharField(source='district_name', read_only=True)
    updatedAt = serializers.DateTimeField(source='timestamp', read_only=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, read_only=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, read_only=True)
    stationCount = serializers.IntegerField(source='station_count', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = AirQualityRecord
        fields = (
            'id',
            'city',
            'country',
            'district',
            'district_name',
            'aqi',
            'pm25',
            'pm10',
            'no2',
            'updatedAt',
            'source',
            'latitude',
            'longitude',
            'stationCount',
            'status',
            'note',
        )

    def get_status(self, obj):
        if obj.aqi <= 50:
            return 'good'
        if obj.aqi <= 100:
            return 'moderate'
        if obj.aqi <= 150:
            return 'unhealthy'
        return 'hazardous'


class AirQualityHistorySerializer(serializers.ModelSerializer):
    label = serializers.CharField(source='record.district_name', read_only=True)

    class Meta:
        model = AirQualityHistoryPoint
        fields = ('timestamp', 'aqi', 'pm25', 'pm10', 'label', 'value')


class MapLocationSerializer(serializers.ModelSerializer):
    city = serializers.CharField(source='record.city', read_only=True)
    country = serializers.CharField(source='record.country', read_only=True)
    district = serializers.CharField(source='record.district_name', read_only=True)
    aqi = serializers.IntegerField(source='record.aqi', read_only=True)
    pm25 = serializers.DecimalField(source='record.pm25', max_digits=6, decimal_places=2, read_only=True)
    pm10 = serializers.DecimalField(source='record.pm10', max_digits=6, decimal_places=2, read_only=True)
    updatedAt = serializers.DateTimeField(source='record.timestamp', read_only=True)
    label = serializers.CharField(source='station_name', read_only=True)

    class Meta:
        model = MapLocation
        fields = (
            'id',
            'city',
            'country',
            'district',
            'latitude',
            'longitude',
            'aqi',
            'pm25',
            'pm10',
            'no2',
            'updatedAt',
            'label',
            'source',
        )


class HistoryQuerySerializer(serializers.Serializer):
    district = serializers.CharField(required=False, allow_blank=True)
    min_aqi = serializers.IntegerField(required=False, min_value=0)
