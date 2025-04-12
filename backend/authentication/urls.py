from django.urls import path
from .views import SignupView, LoginView, UserProfileView
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
]