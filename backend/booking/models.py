from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.conf import settings


# Location Model
class Location(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# Workspace Model (Hub)
class WorkSpace(models.Model):
    name = models.CharField(max_length=255)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    description = models.TextField()
    capacity = models.IntegerField()  # Total capacity of the workspace (only used for hubs)
    type = models.CharField(max_length=50, choices=[('desk', 'Desk'), ('meeting_room', 'Meeting Room')])
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


# Hub (which can contain multiple desks) Model
class Hub(models.Model):
    workspace = models.ForeignKey(WorkSpace, on_delete=models.CASCADE, related_name='hubs')
    name = models.CharField(max_length=100)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    capacity = models.IntegerField()

    def __str__(self):
        return self.name


# Desk Model - Represents individual desks within a hub
class Desk(models.Model):
    hub = models.ForeignKey(Hub, on_delete=models.CASCADE, related_name="desks")
    name = models.CharField(max_length=100)  # Desk ID or Name
    is_available = models.BooleanField(default=True)  # Availability of individual desk

    def __str__(self):
        return f"Desk {self.name} in {self.hub.name}"

    def update_availability(self):
        """Update availability based on bookings."""
        bookings = Booking.objects.filter(desk=self, status='confirmed')
        if bookings.exists():
            self.is_available = False
        else:
            self.is_available = True
        self.save()


# MeetingRoom Model - Represents individual meeting rooms
class MeetingRoom(models.Model):
    workspace = models.ForeignKey(WorkSpace, on_delete=models.CASCADE, related_name='meeting_rooms')
    name = models.CharField(max_length=100)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    capacity = models.IntegerField()
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


# Booking Model
class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Use custom user model
    booking_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')])
    work_space = models.ForeignKey(WorkSpace, on_delete=models.CASCADE)  # For referencing the workspace (hub or meeting room)
    desk = models.ForeignKey(Desk, on_delete=models.CASCADE, null=True, blank=True)  # For booking desks
    meeting_room = models.ForeignKey(MeetingRoom, on_delete=models.CASCADE, null=True, blank=True)  # For booking meeting rooms
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        if self.desk:
            return f"{self.user.username} booked {self.desk.name} from {self.start_time} to {self.end_time}"
        elif self.meeting_room:
            return f"{self.user.username} booked {self.meeting_room.name} from {self.start_time} to {self.end_time}"

    def clean(self):
        """Prevent double booking of the same desk or meeting room."""
        conflicting_booking = None
        if self.desk:
            conflicting_booking = Booking.objects.filter(
                desk=self.desk,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            ).exists()
        elif self.meeting_room:
            conflicting_booking = Booking.objects.filter(
                meeting_room=self.meeting_room,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            ).exists()

        if conflicting_booking:
            raise ValidationError("This space is already booked for the selected time range.")
    
    def save(self, *args, **kwargs):
        self.clean()  # Run the custom validation before saving the booking
        super().save(*args, **kwargs)

        # After a booking is saved, update the availability of desks or meeting rooms
        if self.desk:
            self.desk.update_availability()
        elif self.meeting_room:
            self.meeting_room.is_available = False
            self.meeting_room.save()
            # Mark meeting rooms as unavailable if needed (optional)
            

class WorkspaceFeature(models.Model):
    name = models.CharField(max_length=100)
    workspace = models.ForeignKey(WorkSpace, on_delete=models.CASCADE, related_name='features')
    
    def __str__(self):
        return f"{self.name} - {self.workspace.name}"
