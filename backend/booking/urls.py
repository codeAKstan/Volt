from django.urls import path
from .views import BookingCreateView, BookingListView

urlpatterns = [
    path('create/', BookingCreateView.as_view(), name='booking-create'),
    path('list/', BookingListView.as_view(), name='booking-list'),
]
