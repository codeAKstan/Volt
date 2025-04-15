from django.core.management.base import BaseCommand
from booking.models import Location, WorkSpace, Hub, Desk, MeetingRoom

class Command(BaseCommand):
    help = 'Populates the database with initial workspace data'

    def handle(self, *args, **options):
        # Create Locations first
        self.stdout.write('Creating locations...')
        
        locations = {
            'east_wing': Location.objects.create(
                name='East Wing',
                address='123 Main Street',
                city='New York',
                state='NY'
            ),
            'west_wing': Location.objects.create(
                name='West Wing',
                address='123 Main Street',
                city='New York',
                state='NY'
            ),
            'north_wing': Location.objects.create(
                name='North Wing',
                address='123 Main Street',
                city='New York',
                state='NY'
            ),
            'south_wing': Location.objects.create(
                name='South Wing',
                address='123 Main Street',
                city='New York',
                state='NY'
            ),
            'central_area': Location.objects.create(
                name='Central Area',
                address='123 Main Street',
                city='New York',
                state='NY'
            ),
        }
        
        # Create Hubs
        self.stdout.write('Creating hubs...')
        
        hubs = {
            'east_wing_hub': Hub.objects.create(
                name='East Wing Hub',
                location=locations['east_wing'],
                workspace=None,  # We'll set this after creating the workspace
                capacity=10
            ),
            'west_wing_hub': Hub.objects.create(
                name='West Wing Hub',
                location=locations['west_wing'],
                workspace=None,  # We'll set this after creating the workspace
                capacity=5
            ),
        }
        
        # Create Workspaces - Desks
        self.stdout.write('Creating desk workspaces...')
        
        # Desk 101
        desk_101_workspace = WorkSpace.objects.create(
            name='Desk 101',
            location=locations['east_wing'],
            description='Standing desk with dual monitors',
            capacity=1,
            type='desk',
            is_available=True
        )
        
        # Link the hub to the workspace
        hubs['east_wing_hub'].workspace = desk_101_workspace
        hubs['east_wing_hub'].save()
        
        # Create the desk
        Desk.objects.create(
            name='101',
            hub=hubs['east_wing_hub'],
            is_available=True
        )
        
        # Desk 102
        desk_102_workspace = WorkSpace.objects.create(
            name='Desk 102',
            location=locations['east_wing'],
            description='Standing desk with single monitor and ergonomic chair',
            capacity=1,
            type='desk',
            is_available=True
        )
        
        # Create the desk
        Desk.objects.create(
            name='102',
            hub=hubs['east_wing_hub'],
            is_available=True
        )
        
        # Quiet Zone Desk 5
        quiet_desk_workspace = WorkSpace.objects.create(
            name='Quiet Zone Desk 5',
            location=locations['west_wing'],
            description='Desk with noise cancellation, privacy screen, and ergonomic chair',
            capacity=1,
            type='desk',
            is_available=True
        )
        
        # Create the desk
        Desk.objects.create(
            name='Quiet 5',
            hub=hubs['west_wing_hub'],
            is_available=True
        )
        
        # Create Meeting Rooms
        self.stdout.write('Creating meeting rooms...')
        
        # Meeting Room A
        meeting_room_a = WorkSpace.objects.create(
            name='Meeting Room A',
            location=locations['north_wing'],
            description='Meeting room with projector, whiteboard, and video conferencing',
            capacity=8,
            type='meeting_room',
            is_available=True
        )
        
        MeetingRoom.objects.create(
            name='Meeting Room A',
            workspace=meeting_room_a,
            location=locations['north_wing'],
            capacity=8,
            is_available=True
        )
        
        # Conference Room B
        conference_room_b = WorkSpace.objects.create(
            name='Conference Room B',
            location=locations['north_wing'],
            description='Conference room with large display, video conferencing, and whiteboard',
            capacity=12,
            type='meeting_room',
            is_available=True
        )
        
        MeetingRoom.objects.create(
            name='Conference Room B',
            workspace=conference_room_b,
            location=locations['north_wing'],
            capacity=12,
            is_available=True
        )
        
        # Event Hall
        event_hall = WorkSpace.objects.create(
            name='Event Hall',
            location=locations['south_wing'],
            description='Large event space with stage, sound system, and projector',
            capacity=50,
            type='meeting_room',
            is_available=True
        )
        
        MeetingRoom.objects.create(
            name='Event Hall',
            workspace=event_hall,
            location=locations['south_wing'],
            capacity=50,
            is_available=True
        )
        
        # Collaboration Space
        collab_space = WorkSpace.objects.create(
            name='Collaboration Space',
            location=locations['central_area'],
            description='Flexible space with whiteboards, flexible seating, and projector',
            capacity=15,
            type='meeting_room',
            is_available=True
        )
        
        MeetingRoom.objects.create(
            name='Collaboration Space',
            workspace=collab_space,
            location=locations['central_area'],
            capacity=15,
            is_available=True
        )
        
        # Phone Booths
        phone_booth_1 = WorkSpace.objects.create(
            name='Phone Booth 1',
            location=locations['east_wing'],
            description='Soundproof phone booth with video call setup',
            capacity=1,
            type='meeting_room',
            is_available=False  # Already booked
        )
        
        MeetingRoom.objects.create(
            name='Phone Booth 1',
            workspace=phone_booth_1,
            location=locations['east_wing'],
            capacity=1,
            is_available=False  # Already booked
        )
        
        phone_booth_3 = WorkSpace.objects.create(
            name='Phone Booth 3',
            location=locations['west_wing'],
            description='Soundproof phone booth with video call setup',
            capacity=1,
            type='meeting_room',
            is_available=False  # Already booked
        )
        
        MeetingRoom.objects.create(
            name='Phone Booth 3',
            workspace=phone_booth_3,
            location=locations['west_wing'],
            capacity=1,
            is_available=False  # Already booked
        )
        
        self.stdout.write(self.style.SUCCESS('Successfully populated the database with workspaces'))