from rest_framework import serializers
from .models import WorkSpace, Hub, Desk, MeetingRoom, Booking, Location, Feature, Notification

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'address']

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name', 'description']

class WorkSpaceSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    features = FeatureSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkSpace
        fields = ['id', 'name', 'type', 'description', 'location', 'capacity', 
                  'is_available', 'features', 'hourly_rate']
        
    def create(self, validated_data):
        # Extract location and features data
        location_name = self.context['request'].data.get('location')
        features_data = self.context['request'].data.get('amenities', [])
        
        # Create or get location
        if location_name:
            location, created = Location.objects.get_or_create(name=location_name)
            validated_data['location'] = location
        
        # Create workspace
        workspace = WorkSpace.objects.create(**validated_data)
        
        # Add features
        for feature_name in features_data:
            feature, created = Feature.objects.get_or_create(name=feature_name)
            workspace.features.add(feature)
        
        return workspace

class HubSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hub
        fields = ['id', 'name', 'workspace', 'capacity']

class DeskSerializer(serializers.ModelSerializer):
    hub_name = serializers.CharField(source='hub.name', read_only=True)
    
    class Meta:
        model = Desk
        fields = ['id', 'name', 'hub', 'hub_name', 'is_available']

class MeetingRoomSerializer(serializers.ModelSerializer):
    workspace_name = serializers.CharField(source='workspace.name', read_only=True)
    
    class Meta:
        model = MeetingRoom
        fields = ['id', 'name', 'workspace', 'workspace_name', 'capacity', 'is_available']

class BookingSerializer(serializers.ModelSerializer):
    workspace_name = serializers.CharField(source='work_space.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'user', 'user_email', 'work_space', 'workspace_name', 'desk', 'meeting_room', 
                  'title', 'date', 'start_time', 'end_time', 'status', 'booking_date', 
                  'attendees', 'notes']
        read_only_fields = ['user', 'booking_date']
    
    def create(self, validated_data):
        # Make sure we have a date field
        if 'start_time' in validated_data and 'date' not in validated_data:
            validated_data['date'] = validated_data['start_time'].date()
        
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'booking', 'read', 'created_at']
        read_only_fields = ['created_at']
