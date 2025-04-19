from django.contrib import admin
from .models import WorkSpace, Hub, Desk, MeetingRoom, Booking, Notification, Location, Feature

@admin.register(WorkSpace)
class WorkSpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'location', 'is_available', 'capacity', )
    list_filter = ('type', 'is_available', 'location')
    search_fields = ('name', 'description')
    list_editable = ('is_available', )

@admin.register(Hub)
class HubAdmin(admin.ModelAdmin):
    list_display = ('name', 'workspace', 'capacity',)
    search_fields = ('name', 'description')

@admin.register(Desk)
class DeskAdmin(admin.ModelAdmin):
    list_display = ('name', 'hub', 'is_available', )
    list_filter = ('is_available', 'hub')
    search_fields = ('name', 'description')
    list_editable = ('is_available', )

@admin.register(MeetingRoom)
class MeetingRoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'workspace', 'capacity', 'is_available', )
    list_filter = ('is_available', 'workspace', 'capacity')
    search_fields = ('name', 'description')
    list_editable = ('is_available', )

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'work_space', 'desk', 'meeting_room', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'start_time', 'end_time', 'user')
    search_fields = ('title', 'user__email', 'work_space__name', 'desk__name', 'meeting_room__name')
    date_hierarchy = 'start_time'
    readonly_fields = ('booking_date',)
    list_editable = ('status',)
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'user', 'status', 'booking_date')
        }),
        ('Workspace Details', {
            'fields': ('work_space', 'desk', 'meeting_room')
        }),
        ('Booking Time', {
            'fields': ('start_time', 'end_time')
        }),
        ('Additional Information', {
            'fields': ('attendees', 'notes')
        }),
    )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'type', 'title', 'read', 'created_at')
    list_filter = ('type', 'read', 'created_at')
    search_fields = ('title', 'message', 'user__email')
    date_hierarchy = 'created_at'
    list_editable = ('read',)
    raw_id_fields = ('user', 'booking')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'address')
    search_fields = ('name', 'address')
    list_per_page = 20

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')
    list_per_page = 20