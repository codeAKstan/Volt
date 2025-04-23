from django.urls import path
from .views import WorkSpaceViewSet, AIAssistantView, AdminAIView, create_meeting
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'workspaces', WorkSpaceViewSet, basename='workspace')

urlpatterns = [
    path('assistant/', AIAssistantView.as_view(), name='ai_assistant'),
    path('assistant/find-workspaces/', AIAssistantView.as_view(), name='find_workspaces'),
    path('admin/', AdminAIView.as_view(), name='ai_admin'),
    path('meetings/create/', create_meeting, name='create_meeting'),
]

urlpatterns += router.urls
