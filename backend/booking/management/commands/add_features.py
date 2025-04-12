from django.core.management.base import BaseCommand
from booking.models import WorkSpace, WorkspaceFeature

class Command(BaseCommand):
    help = 'Adds features to workspaces'

    def handle(self, *args, **options):
        self.stdout.write('Adding features to workspaces...')
        
        # Desk 101 features
        desk_101 = WorkSpace.objects.get(name='Desk 101')
        WorkspaceFeature.objects.create(name='Standing desk', workspace=desk_101)
        WorkspaceFeature.objects.create(name='Dual monitors', workspace=desk_101)
        
        # Desk 102 features
        desk_102 = WorkSpace.objects.get(name='Desk 102')
        WorkspaceFeature.objects.create(name='Standing desk', workspace=desk_102)
        WorkspaceFeature.objects.create(name='Single monitor', workspace=desk_102)
        WorkspaceFeature.objects.create(name='Ergonomic chair', workspace=desk_102)
        
        # Quiet Zone Desk 5 features
        quiet_desk = WorkSpace.objects.get(name='Quiet Zone Desk 5')
        WorkspaceFeature.objects.create(name='Noise cancellation', workspace=quiet_desk)
        WorkspaceFeature.objects.create(name='Privacy screen', workspace=quiet_desk)
        WorkspaceFeature.objects.create(name='Ergonomic chair', workspace=quiet_desk)
        
        # Meeting Room A features
        meeting_room_a = WorkSpace.objects.get(name='Meeting Room A')
        WorkspaceFeature.objects.create(name='Projector', workspace=meeting_room_a)
        WorkspaceFeature.objects.create(name='Whiteboard', workspace=meeting_room_a)
        WorkspaceFeature.objects.create(name='Video conferencing', workspace=meeting_room_a)
        
        # Conference Room B features
        conference_room_b = WorkSpace.objects.get(name='Conference Room B')
        WorkspaceFeature.objects.create(name='Large display', workspace=conference_room_b)
        WorkspaceFeature.objects.create(name='Video conferencing', workspace=conference_room_b)
        WorkspaceFeature.objects.create(name='Whiteboard', workspace=conference_room_b)
        
        # Event Hall features
        event_hall = WorkSpace.objects.get(name='Event Hall')
        WorkspaceFeature.objects.create(name='Stage', workspace=event_hall)
        WorkspaceFeature.objects.create(name='Sound system', workspace=event_hall)
        WorkspaceFeature.objects.create(name='Projector', workspace=event_hall)
        
        # Collaboration Space features
        collab_space = WorkSpace.objects.get(name='Collaboration Space')
        WorkspaceFeature.objects.create(name='Whiteboards', workspace=collab_space)
        WorkspaceFeature.objects.create(name='Flexible seating', workspace=collab_space)
        WorkspaceFeature.objects.create(name='Projector', workspace=collab_space)
        
        # Phone Booth features
        phone_booth_1 = WorkSpace.objects.get(name='Phone Booth 1')
        WorkspaceFeature.objects.create(name='Soundproof', workspace=phone_booth_1)
        WorkspaceFeature.objects.create(name='Video call setup', workspace=phone_booth_1)
        
        phone_booth_3 = WorkSpace.objects.get(name='Phone Booth 3')
        WorkspaceFeature.objects.create(name='Soundproof', workspace=phone_booth_3)
        WorkspaceFeature.objects.create(name='Video call setup', workspace=phone_booth_3)
        
        self.stdout.write(self.style.SUCCESS('Successfully added features to workspaces'))