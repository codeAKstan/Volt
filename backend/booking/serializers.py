from rest_framework import serializers
from .models import Location, WorkSpace, Hub, Desk, MeetingRoom, Booking
from django.contrib.auth.models import User

# Location Serializer
class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'address', 'city', 'state']


# Desk Serializer
class DeskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Desk
        fields = ['id', 'name', 'is_available', 'hub']

    # Optionally, you can include workspace name or other details
    hub = serializers.StringRelatedField()


# MeetingRoom Serializer
class MeetingRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingRoom
        fields = ['id', 'name', 'location', 'capacity']

    location = LocationSerializer()  # Nested Location serializer


# Hub Serializer (Hubs contain multiple desks)
class HubSerializer(serializers.ModelSerializer):
    desks = DeskSerializer(many=True)  # Nested serializer for all desks in the hub

    class Meta:
        model = Hub
        fields = ['id', 'name', 'location', 'capacity', 'desks']

    location = LocationSerializer()  # Nested Location serializer


# WorkSpace Serializer (It can be either a desk or meeting room type)
class WorkSpaceSerializer(serializers.ModelSerializer):
    hubs = HubSerializer(many=True, read_only=True)  # Nested hubs if the workspace type is a hub
    meeting_rooms = MeetingRoomSerializer(many=True, read_only=True)  # Nested meeting rooms

    class Meta:
        model = WorkSpace
        fields = ['id', 'name', 'location', 'description', 'capacity', 'type', 'is_available', 'hubs', 'meeting_rooms']

    location = LocationSerializer()  # Nested Location serializer


# Booking Serializer
class BookingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # To show the user as a string (you can change this if needed)
    desk = DeskSerializer(read_only=True)  # When booking a desk, return desk details
    meeting_room = MeetingRoomSerializer(read_only=True)  # When booking a meeting room, return meeting room details

    class Meta:
        model = Booking
        fields = ['id', 'user', 'booking_date', 'status', 'start_time', 'end_time', 'desk', 'meeting_room']

    def create(self, validated_data):
        # Override create method to handle bookings more explicitly
        desk_data = validated_data.pop('desk', None)
        meeting_room_data = validated_data.pop('meeting_room', None)
        
        # Create a booking based on desk or meeting room
        if desk_data:
            validated_data['desk'] = desk_data
        elif meeting_room_data:
            validated_data['meeting_room'] = meeting_room_data
        
        return super().create(validated_data)
