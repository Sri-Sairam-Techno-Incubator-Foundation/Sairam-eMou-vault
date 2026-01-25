# Email Setup for User Creation

## Overview

The system now automatically sends welcome emails to newly created users with their login credentials and email verification link.

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration (for sending welcome emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Application URL (for login links in emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### 2. Generate App-Specific Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device and name it "Sairam eMoU System"
4. Click "Generate"
5. Copy the 16-character password
6. Use this password as `EMAIL_PASSWORD` in your `.env.local`

### 3. Update Environment Variables

```env
EMAIL_USER=your-college-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # 16-character app password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## For Production Deployment

### Option 1: Gmail (Simple)

- Use the same Gmail setup as above
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Example: `NEXT_PUBLIC_APP_URL=https://emou.sairam.edu.in`

### Option 2: Professional Email Service (Recommended)

Consider using professional email services for better deliverability:

#### SendGrid

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@sairam.edu.in
```

#### AWS SES

```env
EMAIL_SERVICE=ses
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_FROM=noreply@sairam.edu.in
```

## Email Content

The welcome email includes:

- ✅ User's email address
- ✅ Temporary password (strong with role prefix)
- ✅ Email verification link
- ✅ Login link to the application
- ✅ Security recommendations
- ✅ Professional HTML formatting

## Testing

1. Create a test user from admin dashboard
2. Check the email inbox for the welcome email
3. Verify all links work correctly
4. Test the login process

## Troubleshooting

### Email not sending

1. Check if `EMAIL_USER` and `EMAIL_PASSWORD` are set correctly
2. Verify Gmail app password is correct (no spaces)
3. Check server logs for error messages
4. Ensure Gmail account has 2FA enabled

### Email goes to spam

1. Consider using a professional email service (SendGrid, SES)
2. Add SPF and DKIM records to your domain
3. Use a verified domain email address

### Gmail blocks login

1. Ensure you're using an app-specific password, not your regular Gmail password
2. Check if 2-Step Verification is enabled
3. Try regenerating the app password

## Security Notes

⚠️ **Important Security Practices:**

- Never commit `.env.local` to version control
- Use app-specific passwords, not your main Gmail password
- Rotate email passwords periodically
- Monitor email sending logs for suspicious activity
- In production, use a dedicated email service account
- Consider rate limiting to prevent email spam abuse

## Current Flow

```
Admin creates user
    ↓
API generates strong password with role prefix
    ↓
Firebase Admin creates user account
    ↓
Email verification link generated
    ↓
Welcome email sent to user automatically
    ↓
User receives:
    - Email
    - Password
    - Verification link
    - Login link
    ↓
User verifies email and logs in
```

## Benefits

✨ **Advantages of automated email delivery:**

- Admin doesn't need to manually copy/paste credentials
- Users receive credentials securely in their inbox
- Professional welcome experience
- No risk of credentials being lost
- Audit trail of all sent emails
- Scales well when creating multiple users
