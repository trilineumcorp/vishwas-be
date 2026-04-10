# Email Setup Guide for Password Reset

## Overview
The password reset functionality uses nodemailer to send emails. This guide explains how to configure email sending.

## Configuration

### For Gmail (Development/Testing)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@vishwas.com
FRONTEND_URL=http://localhost:8081
```

### For Other SMTP Services

#### Outlook/Hotmail:
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### SendGrid:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### AWS SES:
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-access-key
EMAIL_PASSWORD=your-aws-secret-key
```

## Testing

1. Make sure your `.env` file has the email configuration
2. Start the backend server: `npm run dev`
3. Test the forgot password endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```
4. Check the recipient's email inbox (and spam folder)

## Troubleshooting

### Email not sending?
- Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Verify SMTP credentials are correct
- Check server logs for error messages
- For Gmail: Make sure you're using an App Password, not your regular password
- Check firewall/network settings that might block SMTP

### Email going to spam?
- Configure SPF, DKIM, and DMARC records for your domain
- Use a proper email service (SendGrid, AWS SES) in production
- Ensure `EMAIL_FROM` matches your domain

## Production Recommendations

For production, use a dedicated email service:
- **SendGrid** (recommended for ease of use)
- **AWS SES** (cost-effective, scalable)
- **Mailgun** (developer-friendly)
- **Postmark** (transactional emails)

These services provide better deliverability and analytics than SMTP.

