from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SavedCity
from .pagination import SavedCityPagination
from .serializers import SavedCitySerializer


class SavedCityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = SavedCity.objects.filter(user=request.user)
        paginator = SavedCityPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = SavedCitySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = SavedCitySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedCityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        try:
            return SavedCity.objects.get(pk=pk, user=request.user)
        except SavedCity.DoesNotExist:
            return None

    def get(self, request, pk):
        city = self.get_object(request, pk)
        if city is None:
            return Response({'error': 'Saved city not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SavedCitySerializer(city).data)

    def put(self, request, pk):
        city = self.get_object(request, pk)
        if city is None:
            return Response({'error': 'Saved city not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SavedCitySerializer(city, data=request.data, partial=False, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, pk):
        city = self.get_object(request, pk)
        if city is None:
            return Response({'error': 'Saved city not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SavedCitySerializer(city, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        city = self.get_object(request, pk)
        if city is None:
            return Response({'error': 'Saved city not found.'}, status=status.HTTP_404_NOT_FOUND)
        city.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
