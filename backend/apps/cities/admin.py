from django.contrib import admin

from .models import SavedCity


@admin.register(SavedCity)
class SavedCityAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'aqi_threshold', 'user', 'created_at')
    search_fields = ('name', 'country', 'user__username')
