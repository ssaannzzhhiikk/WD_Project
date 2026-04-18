from django.urls import path

from .views import SavedCityDetailView, SavedCityListCreateView

urlpatterns = [
    path('', SavedCityListCreateView.as_view(), name='saved_city_list_create'),
    path('<int:pk>/', SavedCityDetailView.as_view(), name='saved_city_detail'),
]
