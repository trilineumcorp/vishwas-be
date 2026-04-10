# Environment Variables Setup Guide

## Quick Setup for Email (Password Reset)

To enable email sending for password reset functionality, you need to create a `.env` file in the `backend` directory.

### Step 1: Create `.env` file

Create a file named `.env` in the `backend` directory.

### Step 2: Add Email Configuration

Copy the following template and add your email credentials:

```env
# Email Configuration (REQUIRED for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=noreply@vishwas.com
FRONTEND_URL=http://localhost:8081
```

### Step 3: Get Gmail App Password

**For Gmail users:**

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification** (if not already enabled)
4. After enabling 2-Step Verification, go back to Security
5. Click on **2-Step Verification** again
6. Scroll down and click on **App passwords**
7. Select "Mail" as the app and "Other" as the device
8. Enter "VISHWAS Backend" as the name
9. Click **Generate**
10. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)
11. Remove spaces and use it in your `.env` file as `EMAIL_PASSWORD`

**Important:** 
- Use the **App Password**, NOT your regular Gmail password
- The App Password will be 16 characters without spaces
- Example: `EMAIL_PASSWORD=abcdefghijklmnop`

### Step 4: Restart Server

After adding the email configuration, restart your backend server:

```bash
cd backend
npm run dev
```

### Step 5: Test Email Sending

Try the forgot password feature. Check the server logs for:
- ✅ `Email transporter created successfully` - Configuration is correct
- ✅ `Email sent successfully to [email]` - Email was sent
- ❌ `No email credentials found` - Check your .env file
- ❌ `Authentication failed` - Check EMAIL_USER and EMAIL_PASSWORD

## Complete .env Template

Here's a complete `.env` file template with all required variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/viswas

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:8081

# Email Configuration (REQUIRED for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=noreply@vishwas.com
FRONTEND_URL=http://localhost:8081
```

## Troubleshooting

### Email not sending?

1. **Check .env file exists**: Make sure `.env` is in the `backend` directory
2. **Check credentials**: Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set
3. **Check App Password**: For Gmail, make sure you're using an App Password, not your regular password
4. **Restart server**: After changing .env, restart the server
5. **Check logs**: Look for error messages in the server console

### Common Errors

- **"No email credentials found"**: EMAIL_USER or EMAIL_PASSWORD is missing
- **"Authentication failed"**: Wrong email or password (use App Password for Gmail)
- **"Connection failed"**: Check EMAIL_HOST and EMAIL_PORT
- **"Connection timeout"**: Check your network/firewall settings

## Alternative Email Services

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

