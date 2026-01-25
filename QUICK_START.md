# Quick Start - Secure User Creation

## ✅ What's Been Done

1. ✅ **Firebase Admin SDK installed** (`firebase-admin@13.6.0`)
2. ✅ **API Route created** at `/api/admin/create-user`
3. ✅ **Admin page updated** to use secure API
4. ✅ **All TypeScript errors fixed**
5. ✅ **Strong password generation** with role prefixes
6. ✅ **Email verification** link generation

---

## 🚀 Next Steps (5 minutes)

### Step 1: Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hmacs` or your project name
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

### Step 2: Create `.env.local` File

Create a file named `.env.local` in the root directory:

```bash
# Firebase Admin SDK (from the downloaded JSON)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# These should already exist from your client config
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"
```

**Important Notes:**

- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters in the key
- The private key will be very long (multiple lines)
- Never commit this file to Git!

### Step 3: Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart
pnpm dev
```

### Step 4: Test User Creation

1. Login as an admin user
2. Go to Admin Dashboard
3. Click **"+ New User"**
4. Fill in the form:
   - Email: `hod.cse@sairam.edu.in` (for HOD)
   - Display Name: Auto-fills as "CSE HOD"
   - Role: Select role
   - Department: Auto-selects for HOD emails
5. Click **"Create User"**
6. **Copy the credentials** from the popup dialog
7. Share with the new user securely

---

## 🔍 Verification Checklist

- [ ] `.env.local` file created with all credentials
- [ ] Dev server restarted after adding env vars
- [ ] Can login as admin
- [ ] Can access Admin Dashboard
- [ ] Can click "+ New User" button
- [ ] Form appears when clicking "+ New User"
- [ ] Can submit the form
- [ ] Credentials dialog appears after creation
- [ ] Can copy email, password, and verification link
- [ ] New user appears in the users table

---

## 🐛 Troubleshooting

### "Unauthorized - No token provided"

**Fix:** Make sure you're logged in as an admin user. Logout and login again.

### "Cannot find module 'firebase-admin'"

**Fix:** Already installed! Just restart your dev server.

### Environment variable errors

**Fix:**

1. Check `.env.local` exists in the root directory
2. Verify all keys are present
3. Ensure private key has `\n` for line breaks
4. Restart dev server

### "User with this email already exists"

**Fix:** Use a different email or delete the existing user first.

### No popup dialog after user creation

**Fix:** Check browser console for errors. Make sure the API returned successfully.

---

## 📊 What Happens When You Create a User

```
1. Admin fills form → Frontend validates
2. Frontend gets Firebase ID token
3. POST to /api/admin/create-user with token
4. API verifies token & admin role
5. API checks for duplicate email
6. API generates strong password (e.g., CSE2026xK7m@P#q3nL)
7. Firebase Admin SDK creates user
8. Custom claims set for role-based access
9. Firestore document created
10. Email verification link generated
11. Audit log created
12. Credentials returned to admin
13. Popup shows email, password, verification link
14. Admin copies and shares with user
```

---

## 🎯 Example: Creating a HOD User

**Input:**

- Email: `hod.cse@sairam.edu.in`
- Display Name: `CSE HOD` (auto-filled)
- Role: `HOD User`
- Department: `CSE` (auto-selected)

**Output:**

- Email: `hod.cse@sairam.edu.in`
- Password: `CSE2026xK7m@P#q3nL` (18 chars, strong)
- Verification Link: `https://...` (one-time use)
- User created in Firebase Auth
- User document created in Firestore
- Role set to `hod`, Department set to `CSE`
- Email verification required before login

---

## 🔒 Security Features Active

✅ Server-side authentication (cannot be bypassed)  
✅ Token verification on every request  
✅ Role-based authorization (admin/master only)  
✅ Strong password generation (18+ characters)  
✅ Email verification requirement  
✅ Duplicate email prevention  
✅ Audit trail logging  
✅ Custom claims for access control  
✅ One-time credential display

---

## 📚 Need More Help?

- Full setup guide: [SECURITY_SETUP.md](./SECURITY_SETUP.md)
- Check browser console for error messages
- Check server terminal for API errors
- Verify Firebase Console for created users

---

**Ready?** Just add your `.env.local` file and restart the server! 🚀
