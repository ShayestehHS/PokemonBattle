from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from utils.exceptions.exceptions import FormError, ToastError


def exception_handler(exc, context):
    if isinstance(exc, ValidationError):
        detail = exc.detail
        status_code = getattr(exc, "status_code", status.HTTP_400_BAD_REQUEST)

        if isinstance(detail, dict):
            field_name = next(iter(detail.keys()))
            error_message = detail[field_name]
            if isinstance(error_message, list):
                message = str(error_message[0]) if error_message else "Validation error"
            else:
                message = str(error_message)
            return exception_handler(
                FormError(field_name=field_name, message=message, status_code=status_code), context
            )

        else:
            if isinstance(detail, list):
                message = detail[0] if detail else "Validation error"
            else:
                message = str(detail)
            return exception_handler(
                FormError(field_name="non_field_errors", message=message, status_code=status_code), context
            )

    elif not isinstance(exc, FormError | ToastError):
        response = drf_exception_handler(exc, context)
        if response is not None:
            status_code = response.status_code
            response_data = response.data if hasattr(response, "data") else {}

            if 400 <= status_code <= 499:
                if isinstance(response_data, dict) and "detail" in response_data:
                    message = str(response_data["detail"])
                elif isinstance(response_data, dict) and len(response_data) == 1:
                    message = str(next(iter(response_data.values())))
                else:
                    message = str(response_data) if response_data else "An error occurred"
                return exception_handler(ToastError(message=message, status_code=status_code), context)

        return exception_handler(
            ToastError(
                message="An internal server error occurred. Please try again later.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ),
            context,
        )

    if isinstance(exc, FormError):
        return Response(
            {"field_name": exc.field_name, "message": exc.message},
            status=exc.status_code,
        )
    elif isinstance(exc, ToastError):
        return Response(
            {"message": exc.message},
            status=exc.status_code,
        )

    return Response(
        {"message": "An error occurred"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
