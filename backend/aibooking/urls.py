from django.urls import path
from .views import WorkSpaceViewSet, AIAssistantView, AdminAIView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'workspaces', WorkSpaceViewSet, basename='workspace')

urlpatterns = [
    path('assistant/', AIAssistantView.as_view(), name='ai_assistant'),
    path('assistant/find-workspaces/', AIAssistantView.as_view(), name='find_workspaces'),
    path('admin/', AdminAIView.as_view(), name='ai_admin'),
]

urlpatterns += router.urls
