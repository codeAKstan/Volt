from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Room, Participant
from django.utils import timezone
import uuid

class RoomViewSet(viewsets.ViewSet):
    """
    API endpoint for video conference rooms
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request):
        """Create a new room"""
        room_id = f"volt-{uuid.uuid4().hex[:8]}"
        name = request.data.get('name', f"Meeting {room_id}")
        
        room = Room.objects.create(
            room_id=room_id,
            name=name,
            created_by=request.user
        )
        
        return Response({
            'room_id': room.room_id,
            'name': room.name,
            'created_at': room.created_at
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a room"""
        try:
            room = Room.objects.get(room_id=pk, is_active=True)
            
            # Check if user is already in the room
            participant, created = Participant.objects.get_or_create(
                room=room,
                user=request.user,
                defaults={'is_active': True}
            )
            
            if not created and not participant.is_active:
                participant.is_active = True
                participant.joined_at = timezone.now()
                participant.left_at = None
                participant.save()
            
            return Response({
                'room_id': room.room_id,
                'name': room.name,
                'joined_at': participant.joined_at
            })
        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a room"""
        try:
            room = Room.objects.get(room_id=pk)
            participant = Participant.objects.get(room=room, user=request.user, is_active=True)
            participant.is_active = False
            participant.left_at = timezone.now()
            participant.save()
            
            return Response({'status': 'success'})
        except (Room.DoesNotExist, Participant.DoesNotExist):
            return Response({'error': 'Room or participant not found'}, status=status.HTTP_404_NOT_FOUND)
