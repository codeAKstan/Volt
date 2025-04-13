from django.urls import path
from .views import SendEmailView

urlpatterns = [
    path('send/', SendEmailView.as_view(), name='send_email'),
]
