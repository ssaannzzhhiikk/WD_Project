from django.contrib.auth.models import UserManager


class AirWatchUserManager(UserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        email = self.normalize_email(email)
        return super().create_user(username=username, email=email, password=password, **extra_fields)
