from django.contrib import admin
from .models import Booking, WorkSpace, Hub, Desk, MeetingRoom, Location

# Register the models in the admin interface
@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'address')
    search_fields = ('name', 'city', 'state', 'address')
    list_filter = ('city', 'state')
    
@admin.register(WorkSpace)
class WorkSpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'type', 'capacity', 'is_available')
    search_fields = ('name', 'location__name', 'type')
    list_filter = ('type', 'is_available')

@admin.register(Hub)
class HubAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'capacity')
    search_fields = ('name', 'location__name')
    list_filter = ('location',)

@admin.register(Desk)
class DeskAdmin(admin.ModelAdmin):
    list_display = ('name', 'hub', 'is_available')
    search_fields = ('name', 'hub__name')
    list_filter = ('hub', 'is_available')

@admin.register(MeetingRoom)
class MeetingRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'capacity', 'is_available')
    search_fields = ('name', 'location__name')
    list_filter = ('location', 'is_available')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'work_space', 'start_time', 'end_time', 'status')
    search_fields = ('user__email', 'work_space__name', 'status')
    list_filter = ('status', 'work_space__type')
