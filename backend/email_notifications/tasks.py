from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import requests
import logging
import threading

logger = logging.getLogger(__name__)

def send_email_in_thread(recipients, subject, template_name, context):
    """Send email in a separate thread to avoid blocking the main thread"""
    def _send_email():
        try:
            # Render the HTML content from the template
            html_content = render_to_string(f'email/{template_name}.html', context)
            text_content = render_to_string(f'email/{template_name}.txt', context)
            
            # Check if we're using Mailgun
            if hasattr(settings, 'MAILGUN_API_KEY') and settings.MAILGUN_API_KEY:
                # Send using Mailgun API
                send_mailgun_email(recipients, subject, text_content, html_content)
            else:
                # Fall back to Django's send_mail
                from_email = settings.DEFAULT_FROM_EMAIL
                send_mail(
                    subject=subject,
                    message=text_content,
                    from_email=from_email,
                    recipient_list=recipients,
                    html_message=html_content,
                    fail_silently=True,
                )
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
    
    # Start a new thread to send the email
    email_thread = threading.Thread(target=_send_email)
    email_thread.daemon = True  # Daemon threads are killed when the main thread exits
    email_thread.start()
    
    return {"success": True, "message": "Email sending started in background thread"}

@shared_task(bind=True, max_retries=3)
def send_booking_email(self, recipients, subject, template_name, context):
    """
    Send an email notification for a booking.
    
    Args:
        recipients (list): List of email addresses to send to
        subject (str): Email subject
        template_name (str): Name of the template to use
        context (dict): Context data for the template
    """
    try:
        # Render the HTML content from the template
        html_content = render_to_string(f'email/{template_name}.html', context)
        text_content = render_to_string(f'email/{template_name}.txt', context)
        
        # Check if we're using Mailgun
        if hasattr(settings, 'MAILGUN_API_KEY') and settings.MAILGUN_API_KEY:
            # Send using Mailgun API
            return send_mailgun_email(recipients, subject, text_content, html_content)
        else:
            # Fall back to Django's send_mail
            from_email = settings.DEFAULT_FROM_EMAIL
            return send_mail(
                subject=subject,
                message=text_content,
                from_email=from_email,
                recipient_list=recipients,
                html_message=html_content,
                fail_silently=False,
            )
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        # Retry the task
        try:
            self.retry(countdown=60 * 5, exc=e)  # Retry after 5 minutes
        except Exception as retry_error:
            logger.error(f"Failed to retry email task: {str(retry_error)}")
            # As a last resort, try to send the email in a thread
            return send_email_in_thread(recipients, subject, template_name, context)

def send_mailgun_email(recipients, subject, text_content, html_content):
    """
    Send an email using the Mailgun API.
    
    Args:
        recipients (list): List of email addresses to send to
        subject (str): Email subject
        text_content (str): Plain text content
        html_content (str): HTML content
    """
    try:
        mailgun_domain = settings.MAILGUN_DOMAIN
        api_key = settings.MAILGUN_API_KEY
        
        # Prepare the Mailgun API request
        url = f"https://api.mailgun.net/v3/{mailgun_domain}/messages"
        auth = ("api", api_key)
        
        data = {
            "from": f"Volt Workspace <noreply@{mailgun_domain}>",
            "to": recipients,
            "subject": subject,
            "text": text_content,
            "html": html_content
        }
        
        # Send the request to Mailgun API
        response = requests.post(url, auth=auth, data=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        return {"success": True, "response": response.json()}
    except Exception as e:
        logger.error(f"Failed to send email via Mailgun: {str(e)}")
        # Don't raise the exception, just log it
        return {"success": False, "error": str(e)}
