# app/emails.py
from django.core.mail import send_mail
from django.conf import settings

def send_password_otp_email(to_email: str, code: str, minutes: int = 10):
    """
    Send password reset OTP email via SMTP2GO
    """
    subject = "Password Reset Code - M Eaton Trucking LLC"
    body = f"""Hello,

You have requested to reset your password for your M Eaton Trucking LLC account.

Your one-time password reset code is: {code}

This code will expire in {minutes} minutes.

If you did not request this password reset, please ignore this email. Your account remains secure.

Best regards,
M Eaton Trucking LLC
"""
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
