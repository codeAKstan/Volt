# services/embedding_service.py
import openai
from django.conf import settings
from booking.models import WorkSpace

class EmbeddingService:
    @staticmethod
    def generate_embedding(text):
        """Generate embedding vector for text using OpenAI API"""
        try:
            response = openai.Embedding.create(
                input=text,
                model="text-embedding-ada-002"
            )
            return response['data'][0]['embedding']
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return None
    
    @staticmethod
    def update_workspace_embeddings():
        """Generate and update embeddings for all workspaces"""
        workspaces = WorkSpace.objects.filter(embedding__isnull=True)
        updated_count = 0
        
        for workspace in workspaces:
            # Create rich description including features and location
            description = f"{workspace.name}. {workspace.description or ''}. "
            description += f"Type: {workspace.get_type_display()}. "
            description += f"Capacity: {workspace.capacity or 'Unknown'}. "
            
            if workspace.features.exists():
                features = ", ".join([f.name for f in workspace.features.all()])
                description += f"Features: {features}. "
                
            if workspace.location:
                description += f"Location: {workspace.location.name}."
            
            # Generate embedding
            embedding = EmbeddingService.generate_embedding(description)
            if embedding:
                workspace.embedding = embedding
                workspace.save(update_fields=['embedding'])
                updated_count += 1
        
        return updated_count