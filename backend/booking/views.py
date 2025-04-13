from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import WorkSpace, Hub, Desk, MeetingRoom, Booking
from .serializers import WorkSpaceSerializer, HubSerializer, DeskSerializer, MeetingRoomSerializer, BookingSerializer
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from datetime import datetime


# WorkSpace ViewSet (for both hubs and meeting rooms)
class WorkSpaceViewSet(viewsets.ModelViewSet):
    queryset = WorkSpace.objects.all()
    serializer_class = WorkSpaceSerializer
    permission_classes = [IsAuthenticated]  # Make sure the user is authenticated
    
    def list(self, request, *args, **kwargs):
        """
        Overriding list to include custom logic if necessary.
        By default, it will return all the workspaces.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

   

# Hub ViewSet (for desks inside a workspace)
class HubViewSet(viewsets.ModelViewSet):
    queryset = Hub.objects.all()
    serializer_class = HubSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Create the hub, making sure it's linked to a workspace
        serializer.save()

    
    def list(self, request, *args, **kwargs):
        workspace_id = self.kwargs.get('workspace_id')
        hubs = Hub.objects.filter(workspace_id=workspace_id)
        serializer = HubSerializer(hubs, many=True)
        return Response(serializer.data)


# Desk ViewSet (for desks within a hub)
class DeskViewSet(viewsets.ModelViewSet):
    queryset = Desk.objects.all()
    serializer_class = DeskSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Custom logic for creating desks within a hub
        hub = get_object_or_404(Hub, pk=self.kwargs['hub_id'])
        serializer.save(hub=hub)
    
    def list(self, request, *args, **kwargs):
        hub_id = self.kwargs.get('hub_id')
        desks = Desk.objects.filter(hub_id=hub_id)
        serializer = DeskSerializer(desks, many=True)
        return Response(serializer.data)


# MeetingRoom ViewSet (for meeting rooms within a workspace)
class MeetingRoomViewSet(viewsets.ModelViewSet):
    queryset = MeetingRoom.objects.all()
    serializer_class = MeetingRoomSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Create the meeting room, ensuring it's linked to the workspace
        serializer.save()

    def list(self, request, *args, **kwargs):
        workspace_id = self.kwargs.get('workspace_id')
        rooms = MeetingRoom.objects.filter(workspace_id=workspace_id)
        serializer = MeetingRoomSerializer(rooms, many=True)
        return Response(serializer.data)


# Booking Create View (to create bookings for desks or meeting rooms)
class BookingCreateView(generics.CreateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Extract the data from the request
        desk_id = self.request.data.get('desk', None)
        meeting_room_id = self.request.data.get('meeting_room', None)
        start_time = self.request.data.get('start_time')
        end_time = self.request.data.get('end_time')
        work_space_id = self.request.data.get('work_space')  # Get the workspace ID

        # Make sure we have a workspace
        if not work_space_id:
            raise ValidationError("Workspace is required for booking.")
            
        work_space = get_object_or_404(WorkSpace, id=work_space_id)

        # If booking a desk
        if desk_id:
            desk_instance = get_object_or_404(Desk, id=desk_id)
            # Check if the desk is available
            if not desk_instance.is_available:
                raise ValidationError("This desk is already booked for the selected time.")
            # If desk is available, create the booking
            serializer.save(
                user=self.request.user, 
                desk=desk_instance,
                work_space=work_space  # Include the workspace here
            )
            # After booking, mark the desk as unavailable
            desk_instance.is_available = False
            desk_instance.save()

        # If booking a meeting room
        elif meeting_room_id:
            meeting_room_instance = get_object_or_404(MeetingRoom, id=meeting_room_id)
            # Check if the meeting room is available
            if not meeting_room_instance.is_available:
                raise ValidationError("This meeting room is already booked for the selected time.")
            # If meeting room is available, create the booking
            serializer.save(
                user=self.request.user, 
                meeting_room=meeting_room_instance,
                work_space=work_space  # Include the workspace here
            )
            # After booking, mark the meeting room as unavailable
            meeting_room_instance.is_available = False
            meeting_room_instance.save()
        else:
            raise ValidationError("Either desk or meeting room must be provided.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


# Booking List View (to list all bookings for a user)
class BookingListView(generics.ListAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get all bookings for the current user
        return Booking.objects.filter(user=self.request.user)


# Booking Cancel View (to cancel a booking)
class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        booking = get_object_or_404(Booking, id=pk)
        
        # Check if the user is the owner of the booking
        if booking.user != request.user:
            return Response({"error": "You don't have permission to cancel this booking"}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Update booking status
        booking.status = "cancelled"
        booking.save()
        
        # Update workspace availability
        if booking.desk:
            booking.desk.is_available = True
            booking.desk.save()
        elif booking.meeting_room:
            booking.meeting_room.is_available = True
            booking.meeting_room.save()
        
        return Response({"status": "cancelled"}, status=status.HTTP_200_OK)


# Check Availability View
class CheckAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, workspace_id):
        workspace = get_object_or_404(WorkSpace, id=workspace_id)
        date = request.data.get('date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        
        if not date or not start_time or not end_time:
            return Response({"error": "Date, start time, and end time are required"}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Convert string times to datetime objects
        try:
            start_datetime = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
            end_datetime = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M")
        except ValueError:
            return Response({"error": "Invalid date or time format"}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Check for overlapping bookings
        overlapping_bookings = []
        
        if workspace.type == 'desk':
            # For desk type, check desk availability
            desks = Desk.objects.filter(hub__workspace=workspace)
            for desk in desks:
                desk_bookings = Booking.objects.filter(
                    desk=desk,
                    start_time__lt=end_datetime,
                    end_time__gt=start_datetime,
                    status='confirmed'
                )
                if desk_bookings.exists():
                    overlapping_bookings.extend(desk_bookings)
        else:
            # For meeting room type, check meeting room availability
            meeting_rooms = MeetingRoom.objects.filter(workspace=workspace)
            for room in meeting_rooms:
                room_bookings = Booking.objects.filter(
                    meeting_room=room,
                    start_time__lt=end_datetime,
                    end_time__gt=start_datetime,
                    status='confirmed'
                )
                if room_bookings.exists():
                    overlapping_bookings.extend(room_bookings)
        
        # Serialize overlapping bookings
        booking_serializer = BookingSerializer(overlapping_bookings, many=True)
        
        # Return availability status
        return Response({
            "available": len(overlapping_bookings) == 0,
            "workspace": WorkSpaceSerializer(workspace).data,
            "overlappingBookings": booking_serializer.data
        })
