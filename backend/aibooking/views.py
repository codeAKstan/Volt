from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

from booking.models import WorkSpace, Booking
from booking.serializers import WorkSpaceSerializer, BookingSerializer
from .ai_assistant_service import AIBookingAssistant
from .embedding_service import EmbeddingService
from rest_framework.decorators import api_view

@api_view(['POST'])
def create_meeting(request):
    """API endpoint to create a new meeting."""
    meeting_id = AIBookingAssistant.generate_unique_meeting_id()
    return Response({'meeting_id': meeting_id}, status=status.HTTP_201_CREATED)
class WorkSpaceViewSet(viewsets.ModelViewSet):
    queryset = WorkSpace.objects.all()
    serializer_class = WorkSpaceSerializer
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """Search for workspaces using AI-powered similarity search"""
        query = request.data.get('query', '')
        similar_spaces = AIBookingAssistant.find_similar_workspaces(query)
        return Response(similar_spaces)
    
    @action(detail=True, methods=['get'])
    def check_availability(self, request, pk=None):
        """Check availability for a specific workspace"""
        date = request.query_params.get('date')
        start_time = request.query_params.get('start_time')
        end_time = request.query_params.get('end_time')
        
        if not all([date, start_time, end_time]):
            return Response(
                {"error": "Date, start time, and end time are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        availability = AIBookingAssistant.check_availability(pk, date, start_time, end_time)
        return Response(availability)
    
    @action(detail=True, methods=['get'])
    def suggest_times(self, request, pk=None):
        """Suggest available time slots for a workspace"""
        date = request.query_params.get('date')
        duration = request.query_params.get('duration', 1)
        
        if not date:
            return Response(
                {"error": "Date is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            duration = float(duration)
        except ValueError:
            return Response(
                {"error": "Duration must be a number"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        suggestions = AIBookingAssistant.suggest_available_times(pk, date, duration)
        return Response(suggestions)

class AIAssistantView(APIView):
    """API view for interacting with the AI booking assistant"""
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Handle general AI assistant interactions"""
        message = request.data.get('message', '')
        conversation_history = request.data.get('conversation_history', [])

        if not message:
            return Response(
                {"error": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = AIBookingAssistant.process_chat_message(message, conversation_history)
        return Response({
            "response": response,
            "timestamp": timezone.now().isoformat()
        })

    def find_workspaces(self, request):
        """Find available workspaces based on criteria"""
        criteria = request.data
        workspaces = AIBookingAssistant.find_available_workspaces(criteria)
        return Response(workspaces)

class AdminAIView(APIView):
    """Admin-only view for AI management tasks"""
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Check if user is admin
            if not request.user.is_staff and not request.user.role == 'ADMIN':
                return Response(
                    {"error": "Admin privileges required"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
                
            action = request.data.get('action')
            
            if action == 'update_embeddings':
                # This should be restricted to admin users
                count = EmbeddingService.update_workspace_embeddings()
                return Response({"updated_count": count})
            
            return Response(
                {"error": "Invalid action"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Error in AdminAIView.post: {str(e)}")
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
