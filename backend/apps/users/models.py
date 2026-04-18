from django.contrib.auth.models import AbstractUser
from django.db import models

from .managers import AirWatchUserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'student', 'Student'
        ADMIN = 'admin', 'Admin'

    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    objects = AirWatchUserManager()

    def __str__(self) -> str:
        return self.username
