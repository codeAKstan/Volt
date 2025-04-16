from django.core.management.base import BaseCommand
from aibooking.embedding_service import EmbeddingService

class Command(BaseCommand):
    help = 'Update embeddings for all workspaces that don\'t have embeddings yet'

    def handle(self, *args, **options):
        # Display starting message
        self.stdout.write(self.style.WARNING('Starting to update workspace embeddings...'))
        
        # Call the service to update embeddings
        count = EmbeddingService.update_workspace_embeddings()
        
        # Display success message with count
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {count} workspace embeddings')
        )