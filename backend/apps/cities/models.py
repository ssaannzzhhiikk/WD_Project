from django.conf import settings
from django.db import models


class SavedCity(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_cities',
    )
    name = models.CharField(max_length=120)
    country = models.CharField(max_length=120, default='Kazakhstan')
    aqi_threshold = models.PositiveIntegerField(default=100)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'name', 'country')

    def __str__(self) -> str:
        return f'{self.name}, {self.country}'
