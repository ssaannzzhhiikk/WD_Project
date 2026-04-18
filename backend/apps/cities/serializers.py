from rest_framework import serializers

from .models import SavedCity


class SavedCitySerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = SavedCity
        fields = (
            'id',
            'name',
            'country',
            'aqi_threshold',
            'note',
            'createdAt',
            'updatedAt',
        )

    def create(self, validated_data):
        return SavedCity.objects.create(user=self.context['request'].user, **validated_data)
