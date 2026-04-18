from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.air_quality.models import AirQualityHistoryPoint, AirQualityRecord, MapLocation
from apps.cities.models import SavedCity


class Command(BaseCommand):
    help = 'Seed the AirWatch demo backend with users, records, history points, and saved cities.'

    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username='demo',
            defaults={
                'email': 'demo@airwatch.local',
                'full_name': 'Demo User',
                'role': 'student',
            },
        )
        user.set_password('demo12345')
        user.save()

        districts = [
            ('Bostandyk', 48, Decimal('11.8'), Decimal('38.4'), Decimal('43.2365'), Decimal('76.9284')),
            ('Almaly', 91, Decimal('27.2'), Decimal('79.3'), Decimal('43.2567'), Decimal('76.9286')),
            ('Auezov', 128, Decimal('41.7'), Decimal('118.5'), Decimal('43.2220'), Decimal('76.8398')),
            ('Medeu', 63, Decimal('16.4'), Decimal('51.2'), Decimal('43.1637'), Decimal('77.0590')),
        ]

        for index, (district, aqi, pm25, pm10, lat, lon) in enumerate(districts, start=1):
            record, _ = AirQualityRecord.objects.update_or_create(
                district_name=district,
                defaults={
                    'city': 'Almaty',
                    'country': 'Kazakhstan',
                    'aqi': aqi,
                    'pm25': pm25,
                    'pm10': pm10,
                    'no2': Decimal('18.5') + index,
                    'source': 'AirWatch Demo Seed',
                    'latitude': lat,
                    'longitude': lon,
                    'station_count': 2 + index,
                    'note': f'{district} seeded demo data for university defense.',
                    'timestamp': timezone.now() - timedelta(minutes=index * 7),
                },
            )

            MapLocation.objects.update_or_create(
                record=record,
                station_name=f'{district} Station',
                defaults={
                    'latitude': lat,
                    'longitude': lon,
                    'source': 'AirWatch Demo Seed',
                    'no2': Decimal('18.5') + index,
                },
            )

            AirQualityHistoryPoint.objects.filter(record=record).delete()
            for hour in range(12):
                AirQualityHistoryPoint.objects.create(
                    record=record,
                    value=pm25 + Decimal(hour) / Decimal('10'),
                    aqi=max(10, aqi - hour * 2),
                    pm25=pm25 + Decimal(hour) / Decimal('10'),
                    pm10=pm10 + Decimal(hour) / Decimal('5'),
                    timestamp=timezone.now() - timedelta(hours=hour),
                )

        SavedCity.objects.update_or_create(
            user=user,
            name='Almaty',
            country='Kazakhstan',
            defaults={
                'aqi_threshold': 90,
                'note': 'Demo saved city for frontend CRUD presentation.',
            },
        )

        action = 'created' if created else 'updated'
        self.stdout.write(self.style.SUCCESS(f'AirWatch demo data seeded successfully. Demo user {action}.'))
