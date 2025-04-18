# services/ai_assistant_service.py
import openai
from django.conf import settings
from django.db import connection
from django.utils import timezone
from datetime import datetime, timedelta
from booking.models import WorkSpace, Booking, Location, Feature

class AIBookingAssistant:
    @staticmethod
    def find_similar_workspaces(query, limit=5):
        """Find workspaces similar to the user's query using vector search"""
        from .embedding_service import EmbeddingService
        
        # Generate embedding for the query
        query_embedding = EmbeddingService.generate_embedding(query)
        if not query_embedding:
            return []
            
        # Execute vector similarity search using pgvector
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, description, type, capacity, hourly_rate,
                       embedding <=> %s AS distance
                FROM WorkSpace
                WHERE is_available = TRUE
                ORDER BY distance ASC
                LIMIT %s
            """, [query_embedding, limit])
            results = cursor.fetchall()
        
        workspaces = []
        for row in results:
            workspaces.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'type': row[3],
                'capacity': row[4],
                'hourly_rate': row[5],
                'relevance_score': 1 - row[6],  # Convert distance to similarity score
            })
            
        return workspaces
    
    @staticmethod
    def find_available_workspaces(criteria=None, limit=5):
        """Find available workspaces based on criteria"""
        if criteria is None:
            criteria = {}
            
        # Start with all available workspaces
        workspaces_query = WorkSpace.objects.filter(is_available=True)
        
        # Apply filters based on criteria
        if 'type' in criteria and criteria['type']:
            workspaces_query = workspaces_query.filter(type__icontains=criteria['type'])
            
        if 'location' in criteria and criteria['location']:
            # Find locations that match the criteria
            locations = Location.objects.filter(name__icontains=criteria['location'])
            if locations.exists():
                workspaces_query = workspaces_query.filter(location__in=locations)
                
        if 'capacity' in criteria and criteria['capacity']:
            try:
                min_capacity = int(criteria['capacity'])
                workspaces_query = workspaces_query.filter(capacity__gte=min_capacity)
            except (ValueError, TypeError):
                # If capacity is not a valid integer, ignore this filter
                pass
                
        if 'features' in criteria and criteria['features']:
            # Find features that match the criteria
            features = Feature.objects.filter(name__in=criteria['features'])
            if features.exists():
                for feature in features:
                    workspaces_query = workspaces_query.filter(features=feature)
        
        # Get the workspaces
        workspaces = workspaces_query[:limit]
        
        # Format the response
        result = []
        for workspace in workspaces:
            # Get the location name
            location_name = workspace.location.name if workspace.location else "Unknown"
            
            # Get the features
            features = [feature.name for feature in workspace.features.all()]
            
            result.append({
                'id': workspace.id,
                'name': workspace.name,
                'type': workspace.type,
                'description': workspace.description,
                'location': location_name,
                'capacity': workspace.capacity,
                'hourly_rate': float(workspace.hourly_rate) if workspace.hourly_rate else None,
                'features': features,
                'is_available': workspace.is_available,
            })
            
        return result
    
    @staticmethod
    def check_availability(workspace_id, date, start_time, end_time):
        """Check workspace availability for a given time period"""
        try:
            workspace = WorkSpace.objects.get(id=workspace_id)
            
            # Convert string inputs to datetime objects if necessary
            if isinstance(date, str):
                date = datetime.strptime(date, '%Y-%m-%d').date()
            
            if isinstance(start_time, str):
                start_datetime = datetime.strptime(f"{date.isoformat()} {start_time}", '%Y-%m-%d %H:%M')
            else:
                start_datetime = start_time
                
            if isinstance(end_time, str):
                end_datetime = datetime.strptime(f"{date.isoformat()} {end_time}", '%Y-%m-%d %H:%M')
            else:
                end_datetime = end_time
            
            # Check for conflicting bookings
            conflicting_bookings = Booking.objects.filter(
                work_space=workspace,
                status='confirmed',
                start_time__lt=end_datetime,
                end_time__gt=start_datetime
            ).count()
            
            return {
                'workspace': {
                    'id': workspace.id,
                    'name': workspace.name,
                    'type': workspace.get_type_display(),
                },
                'date': date.strftime('%Y-%m-%d'),
                'start_time': start_datetime.strftime('%H:%M'),
                'end_time': end_datetime.strftime('%H:%M'),
                'is_available': conflicting_bookings == 0
            }
        except WorkSpace.DoesNotExist:
            return {'error': 'Workspace not found'}
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def suggest_available_times(workspace_id, date, duration_hours=1):
        """Suggest available time slots for a workspace on a given date"""
        try:
            workspace = WorkSpace.objects.get(id=workspace_id)
            
            # Convert string date to date object if necessary
            if isinstance(date, str):
                date = datetime.strptime(date, '%Y-%m-%d').date()
            
            # Get all bookings for this workspace on the specified date
            bookings = Booking.objects.filter(
                work_space=workspace,
                status='confirmed',
                start_time__date=date
            ).order_by('start_time')
            
            # Define business hours (e.g., 8 AM to 6 PM)
            business_start = datetime.combine(date, datetime.min.time()).replace(hour=8)
            business_end = datetime.combine(date, datetime.min.time()).replace(hour=18)
            
            # Calculate duration in minutes
            duration_minutes = int(duration_hours * 60)
            
            # Find available slots
            available_slots = []
            current_time = business_start
            
            # Add existing bookings to a list of busy times
            busy_times = [(b.start_time, b.end_time) for b in bookings]
            
            while current_time + timedelta(minutes=duration_minutes) <= business_end:
                slot_end = current_time + timedelta(minutes=duration_minutes)
                is_available = True
                
                # Check if this time slot overlaps with any booking
                for start, end in busy_times:
                    if max(current_time, start) < min(slot_end, end):
                        is_available = False
                        break
                
                if is_available:
                    available_slots.append({
                        'start_time': current_time.strftime('%H:%M'),
                        'end_time': slot_end.strftime('%H:%M')
                    })
                
                # Move to next time slot (30-minute increments)
                current_time += timedelta(minutes=30)
            
            return {
                'workspace': {
                    'id': workspace.id,
                    'name': workspace.name
                },
                'date': date.strftime('%Y-%m-%d'),
                'available_slots': available_slots
            }
        except WorkSpace.DoesNotExist:
            return {'error': 'Workspace not found'}
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def generate_booking_instructions():
        """Generate step-by-step booking instructions"""
        instructions = [
            "1. Search for available workspaces using the search bar or filters",
            "2. Select a workspace that meets your requirements",
            "3. Choose a date for your booking", 
            "4. Select an available time slot",
            "5. Enter any additional details or requirements",
            "6. Confirm your booking",
            "7. You'll receive a confirmation notification mail"
        ]
        return instructions
    
    @staticmethod
    def process_chat_message(user_message, conversation_history=None):
        """Process a user message and generate an AI response"""
        if conversation_history is None:
            conversation_history = []
        
        try:
            # For debugging
            print(f"Processing message: {user_message}")
            print(f"Conversation history length: {len(conversation_history)}")
            
            # If OpenAI API key is not available, use a fallback response
            if not hasattr(settings, 'OPENAI_API_KEY') or not settings.OPENAI_API_KEY:
                print("OpenAI API key not found, using fallback response")
                return "I'm here to help with workspace bookings. You can ask me about availability, pricing, or book a space directly."
            
            # Create prompt with context about the booking system
            system_prompt = """
            You are an AI booking assistant for a workspace booking system called Volt. 
            Your role is to help users find and book workspaces like desks, meeting rooms, 
            conference rooms, phone booths, event halls, and collaboration spaces.
            
            You can help users with:
            1. Finding available workspaces based on their requirements
            2. Checking availability of specific workspaces
            3. Explaining the booking process
            4. Answering questions about workspace features and locations
            5. Providing information about pricing
            
            Be concise, helpful, and friendly in your responses. If you don't know something, 
            say so clearly and offer to connect them with human support.
            """
            
            # Format conversation history for OpenAI
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history
            for msg in conversation_history:
                role = "user" if msg.get('is_user', True) else "assistant"
                content = msg.get('message', '')
                
                # Skip empty messages
                if content:
                    messages.append({"role": role, "content": content})
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Get response from OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message['content']
            print(f"AI response generated: {ai_response[:50]}...")
            return ai_response
            
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "I'm sorry, I'm having trouble processing your request. Please try again or contact support."
