from django.contrib import admin
from .models import Room, Participant

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_id', 'name', 'created_by', 'created_at', 'is_active')
    search_fields = ('room_id', 'name', 'created_by__email')
    list_filter = ('is_active', 'created_at')

@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'joined_at', 'left_at', 'is_active')
    search_fields = ('user__email', 'room__room_id')
    list_filter = ('is_active', 'joined_at', 'left_at')
