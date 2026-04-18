from django.db.models import Prefetch
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AirQualityHistoryPoint, AirQualityRecord, MapLocation
from .serializers import (
    AirQualityHistorySerializer,
    AirQualityRecordSerializer,
    HistoryQuerySerializer,
    MapLocationSerializer,
)


class AirQualityDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query_serializer = HistoryQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        district = query_serializer.validated_data.get('district')
        min_aqi = query_serializer.validated_data.get('min_aqi')
        ordering = request.query_params.get('ordering', '-aqi')
        ordering = ordering if ordering in {'aqi', '-aqi', 'timestamp', '-timestamp'} else '-aqi'

        queryset = AirQualityRecord.objects.filtered(district=district, min_aqi=min_aqi).order_by(ordering, '-timestamp')
        return Response(AirQualityRecordSerializer(queryset, many=True).data)


class AirQualityCurrentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        district = request.query_params.get('city') or request.query_params.get('district')
        queryset = AirQualityRecord.objects.filtered(district=district).latest_first()
        record = queryset.first()
        if record is None:
            return Response({'error': 'No air quality record found.'}, status=404)
        return Response(AirQualityRecordSerializer(record).data)


class MapDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query_serializer = HistoryQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)

        district = query_serializer.validated_data.get('district')
        min_aqi = query_serializer.validated_data.get('min_aqi')
        source = request.query_params.get('source')
        ordering = request.query_params.get('ordering', '-record__aqi')
        allowed_ordering = {'record__aqi', '-record__aqi', 'station_name', '-station_name'}
        ordering = ordering if ordering in allowed_ordering else '-record__aqi'

        record_queryset = AirQualityRecord.objects.filtered(district=district, min_aqi=min_aqi)
        locations = MapLocation.objects.select_related('record').filter(record__in=record_queryset)
        if source:
            locations = locations.filter(source__icontains=source)
        locations = locations.order_by(ordering)

        return Response(MapLocationSerializer(locations, many=True).data)


class AirQualityHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, district=None):
        district = district or request.query_params.get('city') or request.query_params.get('district')
        if not district:
            return Response({'error': 'District is required.'}, status=400)

        points = AirQualityHistoryPoint.objects.select_related('record').filter(
            record__district_name__iexact=district,
        ).order_by('-timestamp')[:24]
        if not points:
            return Response({'error': 'No history points found for this district.'}, status=404)

        serializer = AirQualityHistorySerializer(points, many=True)
        return Response(serializer.data)
