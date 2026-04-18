from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class AirWatchUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('AirWatch profile', {'fields': ('full_name', 'role')}),
    )
    list_display = ('username', 'email', 'full_name', 'role', 'is_staff')
