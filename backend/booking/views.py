from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import WorkSpace, Hub, Desk, MeetingRoom, Booking, Notification
from .serializers import WorkSpaceSerializer, HubSerializer, DeskSerializer, MeetingRoomSerializer, BookingSerializer, NotificationSerializer
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from datetime import datetime
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

from email_notifications.tasks import (
    send_booking_email, 
    send_email_in_thread,
    schedule_booking_reminders,
    cancel_scheduled_reminders
)

# Get a logger for this file
logger = logging.getLogger(__name__)

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
        title = self.request.data.get('title', 'Untitled Booking')
        attendees = self.request.data.get('attendees', [])
        notes = self.request.data.get('notes', '')

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
            booking = serializer.save(
                user=self.request.user, 
                desk=desk_instance,
                work_space=work_space,  # Include the workspace here
                title=title,
                attendees=attendees,
                notes=notes
            )
            # After booking, mark the desk as unavailable
            desk_instance.is_available = False
            desk_instance.save()
            return booking

        # If booking a meeting room
        elif meeting_room_id:
            meeting_room_instance = get_object_or_404(MeetingRoom, id=meeting_room_id)
            # Check if the meeting room is available
            if not meeting_room_instance.is_available:
                raise ValidationError("This meeting room is already booked for the selected time.")
            # If meeting room is available, create the booking
            booking = serializer.save(
                user=self.request.user, 
                meeting_room=meeting_room_instance,
                work_space=work_space,  # Include the workspace here
                title=title,
                attendees=attendees,
                notes=notes
            )
            # After booking, mark the meeting room as unavailable
            meeting_room_instance.is_available = False
            meeting_room_instance.save()
            return booking
        else:
            # If neither desk nor meeting room is specified, just create a booking for the workspace
            booking = serializer.save(
                user=self.request.user,
                work_space=work_space,
                title=title,
                attendees=attendees,
                notes=notes
            )
            return booking

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            booking = self.perform_create(serializer)
            
            # Create a notification for the user
            try:
                notification = Notification.objects.create(
                    user=request.user,
                    type='booking_confirmation',
                    title='Booking Confirmed',
                    message=f"Your booking for {booking.work_space.name} on {booking.date} from {booking.start_time.strftime('%H:%M')} to {booking.end_time.strftime('%H:%M')} has been confirmed.",
                    booking=booking
                )
                logger.info(f"Booking notification created for user {request.user.id}")
            except Exception as notif_error:
                logger.error(f"Error creating notification: {str(notif_error)}")
        
            # Send email notification
            try:
                # Prepare recipients list
                recipients = []
                if booking.attendees:
                    recipients.extend(booking.attendees)
                # Add the user's email if available
                if request.user.email and request.user.email not in recipients:
                    recipients.append(request.user.email)
                
                if recipients:
                    
                    # Prepare context for email template
                    context = {
                        'booking': {
                            'id': booking.id,
                            'title': booking.title,
                            'workspace_name': booking.work_space.name,
                            'date': booking.date.strftime('%Y-%m-%d'),
                            'start_time': booking.start_time.strftime('%H:%M'),
                            'end_time': booking.end_time.strftime('%H:%M'),
                            'attendees': booking.attendees,
                            'notes': booking.notes
                        },
                        'user': request.user.get_full_name() or request.user.email,
                    }
                    
                    # Try to send via Celery
                    try:
                        send_booking_email.delay(recipients, "Your Booking Confirmation", "booking_confirmation", context)
                        logger.info(f"Booking confirmation email queued with Celery for {recipients}")
                        
                        # Schedule reminder emails
                        schedule_booking_reminders.delay(booking.id)
                        logger.info(f"Reminder emails scheduled for booking {booking.id}")
                        
                    except Exception as celery_error:
                        # Fall back to thread-based email
                        logger.warning(f"Celery task failed, using thread-based email: {str(celery_error)}")
                        send_email_in_thread(recipients, "Your Booking Confirmation", "booking_confirmation", context)
                        logger.info(f"Booking confirmation email sent via thread for {recipients}")
                else:
                    logger.warning(f"No recipients for booking {booking.id} confirmation email")
                    
            except Exception as email_error:
                logger.error(f"Error sending booking confirmation email: {str(email_error)}")
                # Continue without sending email - don't break the booking process
        
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
    
        # Try to send cancellation email
        try:
            if hasattr(booking, 'attendees') and booking.attendees:
                recipients = booking.attendees
                # Add the user's email if available
                if request.user.email and request.user.email not in recipients:
                    recipients.append(request.user.email)
                
                # Render the HTML content from the template
                context = {
                    'booking': BookingSerializer(booking).data,
                    'user': request.user.get_full_name() or request.user.email,
                }
                html_content = render_to_string(f'email/booking_cancellation.html', context)
                text_content = render_to_string(f'email/booking_cancellation.txt', context)
            
                # Send email using Django's send_mail
                from_email = settings.DEFAULT_FROM_EMAIL
                send_mail(
                    subject="Your Booking Has Been Cancelled",
                    message=text_content,
                    from_email=from_email,
                    recipient_list=recipients,
                    html_message=html_content,
                    fail_silently=False,
                )
                logger.info(f"Cancellation email sent to {recipients}")
        except Exception as email_error:
            logger.error(f"Error sending cancellation email: {str(email_error)}")
            # Continue without sending email

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

# Add the missing notification views
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get all notifications for the current user
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationCreateView(generics.CreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Set the user to the current user
        serializer.save(user=self.request.user)

class NotificationMarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        notification = get_object_or_404(Notification, id=pk)
        
        # Check if the user is the owner of the notification
        if notification.user != request.user:
            return Response({"error": "You don't have permission to mark this notification as read"}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Mark as read
        notification.read = True
        notification.save()
        
        return Response({"status": "marked as read"}, status=status.HTTP_200_OK)
