from django.urls import path

from .views import AirQualityCurrentView, AirQualityDashboardView, AirQualityHistoryView, MapDataView

urlpatterns = [
    path('', AirQualityDashboardView.as_view(), name='air_quality_list'),
    path('dashboard/', AirQualityDashboardView.as_view(), name='air_quality_dashboard'),
    path('current/', AirQualityCurrentView.as_view(), name='air_quality_current'),
    path('map/', MapDataView.as_view(), name='air_quality_map'),
    path('history/', AirQualityHistoryView.as_view(), name='air_quality_history_query'),
    path('history/<str:district>/', AirQualityHistoryView.as_view(), name='air_quality_history'),
]
