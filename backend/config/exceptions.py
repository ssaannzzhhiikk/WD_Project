from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def airwatch_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response({'error': 'An unexpected server error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    detail = response.data
    if isinstance(detail, dict):
        message = detail.get('detail') or detail.get('non_field_errors') or detail
    else:
        message = detail

    if isinstance(message, list):
        message = message[0]
    if isinstance(message, dict):
        message = next(iter(message.values()))
        if isinstance(message, list):
            message = message[0]

    response.data = {
        'error': str(message),
    }
    return response
