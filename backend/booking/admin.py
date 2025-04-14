from django.contrib import admin
from .models import WorkSpace, Hub, Desk, MeetingRoom, Booking, Location, Feature

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'address')
    search_fields = ('name', 'address')

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')

@admin.register(WorkSpace)
class WorkSpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'location', 'capacity', 'is_available', 'hourly_rate')
    list_filter = ('type', 'is_available', 'location')
    search_fields = ('name', 'description')
    filter_horizontal = ('features',)

@admin.register(Hub)
class HubAdmin(admin.ModelAdmin):
    list_display = ('name', 'workspace', 'capacity')
    list_filter = ('workspace',)
    search_fields = ('name',)

@admin.register(Desk)
class DeskAdmin(admin.ModelAdmin):
    list_display = ('name', 'hub', 'is_available')
    list_filter = ('hub', 'is_available')
    search_fields = ('name',)

@admin.register(MeetingRoom)
class MeetingRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'workspace', 'capacity', 'is_available')
    list_filter = ('workspace', 'is_available')
    search_fields = ('name',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'work_space', 'desk', 'meeting_room', 'title', 'date', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'date', 'user')
    search_fields = ('title', 'user__email', 'work_space__name')
    date_hierarchy = 'booking_date'
    readonly_fields = ('booking_date',)
