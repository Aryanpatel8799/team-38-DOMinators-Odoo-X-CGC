const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if email credentials are properly configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
          process.env.EMAIL_USER === 'demo@gmail.com' || 
          process.env.EMAIL_PASS === 'demo_password') {
        logger.warn('Email service not configured with valid credentials - running in demo mode');
        this.isConfigured = false;
        this.transporter = null;
        return;
      }

      // Only create transporter if we have valid credentials
      try {
        this.transporter = this.createTransporter();
        this.isConfigured = true;
        logger.info('Email service initialized successfully');
      } catch (transporterError) {
        logger.error('Failed to create email transporter:', transporterError.message);
        this.isConfigured = false;
        this.transporter = null;
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error.message);
      this.isConfigured = false;
      this.transporter = null;
    }
  }

  createTransporter() {
    try {
      // Gmail configuration (you can also use other email providers)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER, // Your Gmail address
          pass: process.env.EMAIL_PASS  // Your Gmail app password
        }
      });
      
      // Do not verify automatically
      return transporter;
    } catch (error) {
      logger.error('Failed to create email transporter:', error.message);
      throw error;
    }
  }

  async sendOTPEmail(email, otp, userName = 'User') {
    try {
      // If email service is not configured, return success but log it
      if (!this.isConfigured || !this.transporter) {
        logger.warn('Email service not configured - simulating OTP email send', {
          email: email,
          otp: otp,
          userName: userName,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: true,
          messageId: `demo_${Date.now()}`,
          demo: true
        };
      }

      const mailOptions = {
        from: {
          name: 'RoadGuard Support',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'RoadGuard - Email Verification OTP',
        html: this.generateOTPEmailTemplate(otp, userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('OTP email sent successfully', {
        messageId: result.messageId,
        email: email,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Failed to send OTP email:', {
        email,
        error: error.message,
        stack: error.stack
      });
      
      throw new Error('Failed to send verification email');
    }
  }

  generateOTPEmailTemplate(otp, userName) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RoadGuard Email Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2196F3;
                margin-bottom: 10px;
            }
            .otp-code {
                background: #2196F3;
                color: white;
                font-size: 32px;
                font-weight: bold;
                padding: 15px 30px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 5px;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 10px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 14px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚗 RoadGuard</div>
                <h2>Email Verification Required</h2>
            </div>
            
            <p>Hello ${userName},</p>
            
            <p>You have successfully logged into your RoadGuard account. To complete the login process, please verify your email address using the OTP code below:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Enter this code in the RoadGuard app to complete your login.</p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                    <li>This OTP is valid for 10 minutes only</li>
                    <li>Never share this code with anyone</li>
                    <li>If you didn't request this, please secure your account immediately</li>
                </ul>
            </div>
            
            <p>If you didn't attempt to log in, please ignore this email or contact our support team.</p>
            
            <div class="footer">
                <p>Best regards,<br>
                The RoadGuard Team</p>
                <p><small>This is an automated email. Please do not reply to this message.</small></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendWelcomeEmail(email, userName) {
    try {
      const mailOptions = {
        from: {
          name: 'RoadGuard Support',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: 'Welcome to RoadGuard!',
        html: this.generateWelcomeEmailTemplate(userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Welcome email sent successfully', {
        messageId: result.messageId,
        email: email
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      // Don't throw error for welcome email failure
      return { success: false };
    }
  }

  generateWelcomeEmailTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to RoadGuard</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2196F3;
                margin-bottom: 10px;
            }
            .feature {
                background: #f8f9fa;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
                border-left: 4px solid #2196F3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚗 RoadGuard</div>
                <h2>Welcome to RoadGuard!</h2>
            </div>
            
            <p>Hello ${userName},</p>
            
            <p>Welcome to RoadGuard - your trusted roadside assistance partner! We're excited to have you on board.</p>
            
            <h3>What you can do with RoadGuard:</h3>
            
            <div class="feature">
                <strong>🔧 Quick Service Requests</strong><br>
                Get help when you need it most with our instant service request system.
            </div>
            
            <div class="feature">
                <strong>💰 AI-Powered Pricing</strong><br>
                Get fair and transparent pricing based on your specific needs.
            </div>
            
            <div class="feature">
                <strong>📍 Real-time Tracking</strong><br>
                Track your mechanic's location and get real-time updates.
            </div>
            
            <div class="feature">
                <strong>⭐ Quality Assurance</strong><br>
                All our mechanics are verified and rated by the community.
            </div>
            
            <p>Start by logging into your account and setting up your vehicle profile for faster service requests.</p>
            
            <p>If you have any questions, our support team is here to help!</p>
            
            <div style="text-align: center; margin-top: 30px;">
                <p>Best regards,<br>
                The RoadGuard Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async testConnection() {
    try {
      if (!this.isConfigured || !this.transporter) {
        logger.info('Email service connection test skipped - running in demo mode');
        return true; // Return true to not block app startup.
      }
      
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
