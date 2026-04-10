import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration from environment variables
const getEmailConfig = () => {
  // For development, use Gmail or other SMTP service
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailUser = process.env.EMAIL_USER || '';
  const emailPassword = process.env.EMAIL_PASSWORD || '';
  const emailFrom = process.env.EMAIL_FROM || emailUser || 'noreply@vishwas.com';

  return {
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // true for 465, false for other ports
    auth: emailUser && emailPassword ? {
      user: emailUser,
      pass: emailPassword,
    } : undefined,
    from: emailFrom,
  };
};

// Create reusable transporter
const createTransporter = () => {
  const config = getEmailConfig();

  // If no email credentials, create a test account (for development only)
  if (!config.auth) {
    logger.warn('No email credentials found. Email sending will be disabled.');
    logger.warn('To enable email sending, set EMAIL_USER and EMAIL_PASSWORD in .env file');
    logger.warn(`Current EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
    logger.warn(`Current EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? 'SET (hidden)' : 'NOT SET'}`);
    logger.warn(`Current EMAIL_HOST: ${config.host}`);
    logger.warn(`Current EMAIL_PORT: ${config.port}`);
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    logger.info(`Email transporter created successfully for ${config.host}:${config.port}`);
    return transporter;
  } catch (error: any) {
    logger.error('Failed to create email transporter:', error);
    return null;
  }
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      const config = getEmailConfig();
      logger.warn('Email transporter not available. Email not sent.');
      logger.warn(`Email config check - EMAIL_USER: ${config.auth ? 'SET' : 'NOT SET'}, EMAIL_PASSWORD: ${config.auth ? 'SET' : 'NOT SET'}`);
      logger.warn(`Would have sent email to: ${options.to} with subject: ${options.subject}`);
      return false;
    }

    const config = getEmailConfig();

    const mailOptions = {
      from: config.from,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: options.html,
    };

    logger.info(`Attempting to send email to: ${options.to} from: ${config.from}`);
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
    logger.info(`Email response: ${JSON.stringify(info.response)}`);
    return true;
  } catch (error: any) {
    logger.error('Error sending email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack,
    });
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      logger.error('Authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file');
    } else if (error.code === 'ECONNECTION') {
      logger.error('Connection failed. Please check EMAIL_HOST and EMAIL_PORT in .env file');
    } else if (error.code === 'ETIMEDOUT') {
      logger.error('Connection timeout. Please check your network and SMTP settings');
    }
    
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  // Use web URL as primary (works in email clients)
  const webUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/auth/reset-password?token=${resetToken}`;
  // Deep link for app (used in JavaScript redirect)
  const appDeepLink = `vishwas://auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0B3C5D; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #FFFFFF; margin: 0;">VISHWAS EDU TECH</h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 30px; border: 1px solid #E0E0E0; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #0B3C5D; margin-top: 0;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password for your VISHWAS EDU TECH account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appDeepLink}" style="background-color: #FF6B35; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); -webkit-tap-highlight-color: transparent;">Reset Password</a>
        </div>
        <p style="text-align: center; margin: 10px 0;">
          <a href="${webUrl}" style="color: #0B3C5D; text-decoration: underline; font-size: 14px;">Or open in browser</a>
        </p>
        <p style="margin-top: 20px; padding: 15px; background-color: #F5F5F5; border-radius: 6px; font-size: 13px;">
          <strong>Note:</strong> If the button doesn't open the app, you can also copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; color: #666; font-size: 12px; margin-top: 10px; padding: 10px; background-color: #FAFAFA; border-radius: 4px;">${webUrl}</p>
        <p style="margin-top: 15px; font-size: 12px; color: #666;">
          <strong>Mobile users:</strong> The button will open the VISHWAS EDU TECH app if installed. If the app is not installed, use the web link above.
        </p>
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E0E0E0; color: #666; font-size: 12px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Best regards,<br>
          VISHWAS EDU TECH Team
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Password Reset Request - VISHWAS EDU TECH',
    html,
  });
};

