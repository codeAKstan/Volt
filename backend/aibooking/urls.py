# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkSpaceViewSet, AIAssistantView, AdminAIView

router = DefaultRouter()
router.register(r'workspaces', WorkSpaceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('ai/assistant/', AIAssistantView.as_view(), name='ai-assistant'),
    path('ai/admin/', AdminAIView.as_view(), name='admin-ai'),
    path('ai/instructions/', AIAssistantView.as_view(), name='booking-instructions'),
]
