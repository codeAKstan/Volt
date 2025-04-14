from django.urls import path, include
from .views import (
    BookingCreateView, 
    BookingListView, 
    WorkSpaceViewSet, 
    HubViewSet, 
    DeskViewSet, 
    MeetingRoomViewSet,
    BookingCancelView,
    CheckAvailabilityView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'workspace', WorkSpaceViewSet)

urlpatterns = [
    path('create/', BookingCreateView.as_view(), name='booking-create'),
    path('list/', BookingListView.as_view(), name='booking-list'),
    path('<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('workspace/<int:workspace_id>/check-availability/', CheckAvailabilityView.as_view(), name='check-availability'),
    path('workspace/<int:workspace_id>/hubs/', HubViewSet.as_view({'get': 'list'}), name='hub-list'),
    path('workspace/<int:workspace_id>/meeting-rooms/', MeetingRoomViewSet.as_view({'get': 'list'}), name='meeting-room-list'),
    path('hub/<int:hub_id>/desks/', DeskViewSet.as_view({'get': 'list'}), name='desk-list'),
]

urlpatterns += router.urls
