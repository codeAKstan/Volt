from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import logging
from .tasks import send_booking_email, send_email_in_thread

logger = logging.getLogger(__name__)

class SendEmailView(APIView):
    """
    API endpoint for sending emails.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Send an email notification.
        
        Expected request data:
        {
            "subject": "Email subject",
            "recipients": ["email1@example.com", "email2@example.com"],
            "template": "template_name",
            "context": {
                "key1": "value1",
                "key2": "value2"
            }
        }
        """
        try:
            # Extract data from request
            subject = request.data.get('subject')
            recipients = request.data.get('recipients', [])
            template = request.data.get('template')
            context = request.data.get('context', {})
            
            # Validate required fields
            if not subject or not recipients or not template:
                return Response(
                    {"error": "Missing required fields: subject, recipients, or template"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add the user to the context
            context['user'] = {
                'name': f"{request.user.first_name} {request.user.last_name}",
                'email': request.user.email
            }
            
            # Try to send the email asynchronously using Celery
            try:
                send_booking_email.delay(recipients, subject, template, context)
                return Response({"success": True, "message": "Email scheduled for delivery via Celery"})
            except Exception as celery_error:
                logger.warning(f"Celery task failed, falling back to thread-based email: {str(celery_error)}")
                # Fall back to thread-based email
                send_email_in_thread(recipients, subject, template, context)
                return Response({"success": True, "message": "Email scheduled for delivery via thread"})
            
        except Exception as e:
            logger.error(f"Error scheduling email: {str(e)}")
            return Response(
                {"error": f"Failed to schedule email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
