from django.urls import path
from .views import SignupView, LoginView, UserProfileView, UserListView, UserDetailView, UserBookingsView
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<str:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('users/<str:pk>/bookings/', UserBookingsView.as_view(), name='user_bookings'),
]
