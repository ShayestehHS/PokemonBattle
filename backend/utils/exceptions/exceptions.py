from rest_framework import status


class CustomException(Exception):
    def __init__(self, message: str, status_code: int):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ToastError(CustomException):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message, status_code)


class FormError(CustomException):
    def __init__(self, field_name: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.field_name = field_name
        super().__init__(message, status_code)
