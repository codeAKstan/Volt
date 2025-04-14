from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Location(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name

class Feature(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name

class WorkSpace(models.Model):
    WORKSPACE_TYPES = (
        ('desk', 'Desk'),
        ('meeting', 'Meeting Room'),
        ('conference', 'Conference Room'),
        ('phone', 'Phone Booth'),
        ('event', 'Event Hall'),
        ('collaboration', 'Collaboration Space'),
    )
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=WORKSPACE_TYPES, default='desk')
    description = models.TextField(blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='workspaces', null=True)
    capacity = models.IntegerField(blank=True, null=True)
    is_available = models.BooleanField(default=True)
    features = models.ManyToManyField(Feature, related_name='workspaces', blank=True)
    hourly_rate = models.DecimalField(max_digits=6, decimal_places=2, default=5.00)
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class Hub(models.Model):
    name = models.CharField(max_length=100)
    workspace = models.ForeignKey(WorkSpace, on_delete=models.CASCADE, related_name='hubs')
    capacity = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.name} in {self.workspace.name}"

class Desk(models.Model):
    name = models.CharField(max_length=100)
    hub = models.ForeignKey(Hub, on_delete=models.CASCADE, related_name='desks')
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} in {self.hub.name}"

class MeetingRoom(models.Model):
    name = models.CharField(max_length=100)
    workspace = models.ForeignKey(WorkSpace, on_delete=models.CASCADE, related_name='meeting_rooms')
    capacity = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} in {self.workspace.name}"

class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    work_space = models.ForeignKey(WorkSpace, on_delete=models.CASCADE, related_name='bookings', null=True)
    desk = models.ForeignKey(Desk, on_delete=models.SET_NULL, related_name='bookings', null=True, blank=True)
    meeting_room = models.ForeignKey(MeetingRoom, on_delete=models.SET_NULL, related_name='bookings', null=True, blank=True)
    title = models.CharField(max_length=200, blank=True, null=True)
    date = models.DateField(null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    booking_date = models.DateTimeField(auto_now_add=True)
    attendees = models.JSONField(default=list, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        space_name = self.desk.name if self.desk else (self.meeting_room.name if self.meeting_room else "Unknown")
        return f"Booking for {space_name} by {self.user.email}"
    
    def clean(self):
        # Skip validation if the booking is being cancelled
        if self.status == 'cancelled':
            return
            
        # Check if the desk or meeting room is already booked for the given time
        if self.desk:
            overlapping_bookings = Booking.objects.filter(
                desk=self.desk,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
                status='confirmed'
            ).exclude(pk=self.pk)
            
            if overlapping_bookings.exists():
                raise ValidationError("This space is already booked for the selected time range.")
                
        elif self.meeting_room:
            overlapping_bookings = Booking.objects.filter(
                meeting_room=self.meeting_room,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
                status='confirmed'
            ).exclude(pk=self.pk)
            
            if overlapping_bookings.exists():
                raise ValidationError("This space is already booked for the selected time range.")
    
    def save(self, *args, **kwargs):
        # Only run validation if this is a new booking or status is not cancelled
        if not self.pk or self.status != 'cancelled':
            self.clean()  # Run the custom validation before saving the booking
        super().save(*args, **kwargs)
