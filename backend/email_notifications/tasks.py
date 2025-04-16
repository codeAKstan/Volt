import logging
import threading
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from celery import shared_task

logger = logging.getLogger(__name__)

@shared_task
def send_booking_email(recipients, subject, template_prefix, context):
    """
    Send an email using Celery task
    
    Args:
        recipients: List of email addresses
        subject: Email subject
        template_prefix: Template name prefix (without .html/.txt)
        context: Context dictionary for the templates
    """
    try:
        # Render email templates
        html_content = render_to_string(f'email/{template_prefix}.html', context)
        text_content = render_to_string(f'email/{template_prefix}.txt', context)
        
        # Send email
        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            html_message=html_content,
            fail_silently=False,
        )
        
        logger.info(f"Email sent successfully to {recipients}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

@shared_task
def send_booking_reminder(booking_id):
    """
    Send a reminder email for an upcoming booking
    
    Args:
        booking_id: ID of the booking to remind about
    """
    from booking.models import Booking
    
    try:
        booking = Booking.objects.get(id=booking_id, status='confirmed')
        
        # Skip if booking is cancelled or already past
        if booking.status == 'cancelled' or booking.start_time < timezone.now():
            logger.info(f"Skipping reminder for booking {booking_id}: not active or already past")
            return False
        
        # Prepare recipients
        recipients = []
        if booking.attendees:
            recipients.extend(booking.attendees)
        if booking.user.email and booking.user.email not in recipients:
            recipients.append(booking.user.email)
            
        if not recipients:
            logger.warning(f"No recipients for booking {booking_id} reminder")
            return False
            
        # Prepare context
        context = {
            'booking': {
                'id': booking.id,
                'title': booking.title,
                'workspace_name': booking.work_space.name,
                'date': booking.date.strftime('%Y-%m-%d'),
                'start_time': booking.start_time.strftime('%H:%M'),
                'end_time': booking.end_time.strftime('%H:%M'),
                'location': booking.work_space.location.name if booking.work_space.location else "Not specified",
                'attendees': booking.attendees,
                'notes': booking.notes
            },
            'user': booking.user.get_full_name() or booking.user.email,
        }
        
        # Send the reminder
        return send_booking_email(
            recipients, 
            f"Reminder: Your Booking in {booking.work_space.name} Today", 
            "booking_reminder", 
            context
        )
        
    except Booking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found for reminder")
        return False
    except Exception as e:
        logger.error(f"Error sending reminder for booking {booking_id}: {str(e)}")
        return False


from datetime import timedelta
from django.utils import timezone

@shared_task
def schedule_booking_reminders(booking_id):
    """
    Schedule reminder emails for a booking
    
    Args:
        booking_id: ID of the booking to schedule reminders for
    """
    from booking.models import Booking
    
    try:
        booking = Booking.objects.get(id=booking_id, status='confirmed')
        
        # Get time to start of booking (in seconds)
        now = timezone.now()
        
        # Skip if booking is in the past
        if booking.start_time < now:
            logger.info(f"Not scheduling reminders for past booking {booking_id}")
            return False
        
        # Calculate when to send reminders
        time_until_booking = booking.start_time - now
        
        # Schedule day-before reminder if booking is more than 24 hours away
        if time_until_booking > timedelta(hours=24):
            send_time = booking.start_time - timedelta(days=1)
            send_booking_reminder.apply_async(
                args=[booking_id], 
                eta=send_time,
                task_id=f"day_before_reminder_{booking_id}"
            )
            logger.info(f"Scheduled day-before reminder for booking {booking_id} at {send_time}")
        
        # Schedule 1-hour reminder
        if time_until_booking > timedelta(hours=1):
            send_time = booking.start_time - timedelta(hours=1)
            send_booking_reminder.apply_async(
                args=[booking_id], 
                eta=send_time,
                task_id=f"hour_before_reminder_{booking_id}"
            )
            logger.info(f"Scheduled 1-hour reminder for booking {booking_id} at {send_time}")
            
        return True
        
    except Booking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found for scheduling reminders")
        return False
    except Exception as e:
        logger.error(f"Error scheduling reminders for booking {booking_id}: {str(e)}")
        return False

@shared_task
def cancel_scheduled_reminders(booking_id):
    """
    Cancel any scheduled reminders for a booking
    
    Args:
        booking_id: ID of the booking to cancel reminders for
    """
    from celery.task.control import revoke
    
    try:
        # Revoke the scheduled tasks
        revoke(f"day_before_reminder_{booking_id}", terminate=True)
        revoke(f"hour_before_reminder_{booking_id}", terminate=True)
        logger.info(f"Cancelled scheduled reminders for booking {booking_id}")
        return True
    except Exception as e:
        logger.error(f"Error cancelling reminders for booking {booking_id}: {str(e)}")
        return False
    

def send_email_in_thread(recipients, subject, template_prefix, context):
    """
    Send an email in a separate thread (fallback if Celery is unavailable)
    """
    def email_worker():
        try:
            html_content = render_to_string(f'email/{template_prefix}.html', context)
            text_content = render_to_string(f'email/{template_prefix}.txt', context)
            
            send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                html_message=html_content,
                fail_silently=False,
            )
            logger.info(f"Email sent via thread to {recipients}")
        except Exception as e:
            logger.error(f"Thread email error: {str(e)}")
    
    email_thread = threading.Thread(target=email_worker)
    email_thread.daemon = True
    email_thread.start()
    return True