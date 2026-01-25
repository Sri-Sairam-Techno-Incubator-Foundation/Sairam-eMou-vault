# 🔐 Secure User Creation Setup Guide

## Security Features Implemented

✅ **Firebase Admin SDK** - Server-side user creation (cannot be bypassed)  
✅ **Strong Password Generation** - Role-based prefix + 10 random characters  
✅ **Email Verification** - Users must verify email before access  
✅ **Token-Based Authentication** - API protected with Firebase ID tokens  
✅ **Role-Based Authorization** - Only admins can create users  
✅ **Audit Logging** - All user creations are logged  
✅ **Duplicate Email Check** - Prevents creating users with existing emails  
✅ **Custom Claims** - Role stored in Firebase Auth for secure access control

---

## Installation Steps

### 1. Install Firebase Admin SDK

```bash
npm install firebase-admin
# or
pnpm add firebase-admin
```

### 2. Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **⚙️ Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 3. Configure Environment Variables

Create or update `.env.local` file:

```bash
# Copy from the downloaded JSON file
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# These should already exist from client config
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
```

**Important:**

- Keep the `\n` characters in the private key
- Never commit `.env.local` to Git
- Add `.env.local` to your `.gitignore`

### 4. Update Firestore Security Rules

Update your `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - Admin only can create
    match /users/{userId} {
      // Only authenticated users can read their own data
      allow read: if request.auth != null && request.auth.uid == userId;

      // Only admins and masters can list all users
      allow list: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'master']);

      // Only admins can create new users (server-side via Admin SDK)
      allow create: if false; // Handled by Admin SDK only

      // Users can update their own data, admins can update anyone
      allow update: if request.auth != null &&
        (request.auth.uid == userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

      // Only admins can delete users
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Audit logs - Admin write, Admin/Master read
    match /audit_logs/{logId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'master'];
      allow create: if false; // Only via Admin SDK
    }

    // Add other collection rules here
  }
}
```

Deploy the rules:

```bash
firebase deploy --only firestore:rules
```

---

## How It Works

### Password Generation Algorithm

```
Format: [PREFIX][YEAR][RANDOM_10_CHARS]

Examples:
- HOD (CSE):    CSE2026xK7m@P#q3nL
- Admin:        Admin2026L9$xR#4vM2
- Master:       Master2026p@3Q#7kN9
```

**Security:**

- 18+ characters total
- Mix of uppercase, lowercase, numbers, special chars
- Unpredictable random portion
- Prefix maintains familiarity for admins

### User Creation Flow

```
1. Admin clicks "Create User" → Frontend
2. Frontend gets current user's ID token
3. POST to /api/admin/create-user with token
4. API verifies token & checks admin role
5. API checks for duplicate email
6. API generates strong password
7. Firebase Admin SDK creates user
8. Custom claims set (role, department)
9. Firestore document created
10. Email verification link generated
11. Audit log created
12. Credentials returned to admin (one-time)
13. Admin sees password & verification link
```

### Security Layers

| Layer           | Protection                |
| --------------- | ------------------------- |
| Frontend        | Client-side validation    |
| API Route       | Token verification        |
| Admin SDK       | Server-side only access   |
| Firestore Rules | Database-level security   |
| Custom Claims   | Role-based access control |
| Audit Logs      | Accountability trail      |

---

## Usage Instructions

### For Admins Creating Users

1. Click **"+ New User"**
2. Fill in user details (email auto-fills display name for HODs)
3. Click **"Create User"**
4. **IMPORTANT:** Copy the displayed credentials immediately
   - Email
   - Temporary Password
   - Email Verification Link
5. Share credentials with user through secure channel (NOT email)
6. User must verify email before accessing system

### For New Users

1. Receive credentials from admin (email + password + verification link)
2. Click the email verification link
3. Login with provided credentials
4. Change password on first login (recommended)

---

## Testing the Security

### Test 1: Verify Admin-Only Access

```bash
# Try to call API without token (should fail)
curl -X POST http://localhost:3000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","role":"admin"}'

# Expected: 401 Unauthorized
```

### Test 2: Verify Non-Admin Cannot Create Users

1. Login as HOD user
2. Try to access admin page
3. Should redirect to dashboard

### Test 3: Password Strength

Check generated password has:

- [x] Role prefix (CSE2026, Admin2026, etc.)
- [x] At least 8 random characters
- [x] Special characters (!@#$%&\*)
- [x] Mixed case letters
- [x] Numbers

### Test 4: Email Verification

1. Create a test user
2. Check Firebase Auth console
3. User should show "Email not verified"
4. Click verification link
5. Status should change to "Email verified"

---

## Troubleshooting

### "Failed to initialize secondary authentication"

**Solution:** You're using the old client SDK method. The new code uses Admin SDK via API route. This error shouldn't appear anymore.

### "Unauthorized - No token provided"

**Solution:** Make sure you're logged in as admin and the frontend is sending the Authorization header.

### "FIREBASE_PRIVATE_KEY is undefined"

**Solution:**

1. Check `.env.local` exists
2. Verify the key includes `\n` for line breaks
3. Restart dev server after adding env vars

### "User with this email already exists"

**Solution:** The email is already registered. Use a different email or delete the existing user first.

### Email verification link doesn't work

**Solution:**

1. Check Firebase Console > Authentication > Templates
2. Ensure email verification template is enabled
3. Check spam folder for verification emails

---

## Security Best Practices

### ✅ DO

- Copy passwords immediately after user creation
- Share credentials through secure channels (Slack DM, encrypted email)
- Require users to change password after first login
- Monitor audit logs regularly
- Rotate admin credentials periodically
- Use environment variables for secrets

### ❌ DON'T

- Email passwords in plain text
- Screenshot credentials
- Share passwords in public channels
- Hardcode Firebase credentials in code
- Commit `.env.local` to Git
- Reuse passwords across users
- Skip email verification

---

## Monitoring & Auditing

### View Audit Logs

Audit logs are stored in Firestore `audit_logs` collection:

```javascript
{
  action: "USER_CREATED",
  performedBy: "admin-uid-123",
  performedByEmail: "admin@sairam.edu.in",
  targetUserId: "new-user-uid-456",
  targetUserEmail: "hod.cse@sairam.edu.in",
  role: "hod",
  department: "CSE",
  timestamp: "2026-01-25T10:30:00Z",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}
```

### Query Logs

```javascript
// Get all user creations in last 24 hours
const logs = await db
  .collection("audit_logs")
  .where("action", "==", "USER_CREATED")
  .where("timestamp", ">", yesterday)
  .orderBy("timestamp", "desc")
  .get();
```

---

## Next Steps (Optional Enhancements)

1. **Rate Limiting** - Add Upstash Redis rate limiting
2. **MFA for Admins** - Require 2FA for admin accounts
3. **IP Whitelisting** - Restrict admin panel to specific IPs
4. **Password Expiry** - Force password change after 90 days
5. **Account Lockout** - Lock accounts after failed login attempts
6. **Email Notifications** - Auto-send welcome emails
7. **Bulk User Import** - CSV upload for multiple users

---

## Support

If you encounter issues:

1. Check the error message in browser console
2. Review server logs for API errors
3. Verify environment variables are set
4. Check Firestore security rules
5. Ensure Firebase Admin SDK is properly initialized

**Security Issue?** Report immediately to your security team.
