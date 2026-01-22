# Firebase Setup Guide for USNS App

This guide will walk you through setting up Firebase for the USNS School Notification System app.

## Prerequisites

- A Google account
- The USNS app code on your local machine

---

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "USNS School Notifications")
4. Click **Continue**
5. (Optional) Disable Google Analytics if you don't need it, or configure it
6. Click **Create project**
7. Wait for the project to be created, then click **Continue**

---

## Step 2: Register Your App with Firebase

### For Web/Expo App:

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "USNS Web App")
3. **Do NOT** check "Also set up Firebase Hosting" (unless you want to host the web version)
4. Click **Register app**
5. You'll see a configuration object with your Firebase credentials - **keep this page open**, you'll need these values soon

The configuration will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

6. Click **Continue to console**

---

## Step 3: Enable Firebase Authentication

1. In the Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Click on the **Sign-in method** tab
4. Click on **Email/Password**
5. Toggle **Enable** to ON
6. Click **Save**

---

## Step 4: Create Firestore Database

1. In the Firebase Console, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in production mode** (we'll add security rules later)
4. Click **Next**
5. Choose a Cloud Firestore location (select the one closest to your users)
6. Click **Enable**
7. Wait for the database to be created

---

## Step 5: Set Up Firestore Security Rules

1. In Firestore Database, click on the **Rules** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return getUserRole() == 'Administrator';
    }

    function isTeacher() {
      return getUserRole() == 'Teacher';
    }

    function isVerifiedStudent() {
      return getUserRole() == 'Verified_Student';
    }

    function canSendNotification() {
      return isAdmin() || isTeacher();
    }

    function canSendFeedback() {
      return isAdmin() || isTeacher() || isVerifiedStudent();
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // Users can update their own non-role fields
      allow update: if isAuthenticated() && request.auth.uid == userId
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
      // Admins can update any user (including role changes)
      allow update: if isAuthenticated() && isAdmin();
      // Teachers can verify/unverify students
      allow update: if isAuthenticated() && isTeacher()
                    && (resource.data.role == 'Student' || resource.data.role == 'Verified_Student')
                    && (request.resource.data.role == 'Student' || request.resource.data.role == 'Verified_Student');
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && canSendNotification();
      allow update: if isAuthenticated() &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy']);
    }

    // Feedback collection
    match /feedback/{feedbackId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && canSendFeedback();
      allow delete: if isAuthenticated() && (isAdmin() || isTeacher());
    }

    // Push notifications queue (for Cloud Functions to process)
    match /push_notifications/{notificationId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (isAdmin() || isTeacher());
    }
  }
}
```

3. Click **Publish**

---

## Step 6: Get Your Firebase Configuration

You should have the Firebase config from Step 2. If you closed that page:

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **Project settings**
3. Scroll down to **Your apps** section
4. You'll see your web app listed
5. Under **SDK setup and configuration**, select **Config**
6. Copy the configuration values

---

## Step 7: Configure Your .env File

1. In your USNS app folder, locate the `.env.example` file
2. Create a copy and rename it to `.env`:

   ```bash
   cp .env.example .env
   ```

3. Open the `.env` file and fill in your Firebase credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

4. Save the file

**Important:** Never commit the `.env` file to version control. It's already in `.gitignore`.

---

## Step 8: Create Your First Administrator Account

Since all new signups default to "Student" role, you need to manually create an administrator:

### Method 1: Through the App (Recommended)

1. Start your app: `npm start`
2. Sign up with your email and password
3. Go to Firebase Console → Firestore Database
4. Click on the **Data** tab
5. Find the `users` collection
6. Click on your user document (it will have your UID)
7. Click the **pencil icon** to edit
8. Change the following fields:
   - `role`: Change from `"Student"` to `"Administrator"`
   - `isVerified`: Change from `false` to `true`
9. Click **Update**
10. Restart your app and log in again

### Method 2: Create Directly in Firestore

1. Go to Firebase Console → Firestore Database
2. Click **Start collection**
3. Collection ID: `users`
4. Click **Next**
5. Document ID: Use your Firebase Auth UID (you can find this in Authentication → Users)
6. Add the following fields:
   - `uid` (string): Your Firebase Auth UID
   - `email` (string): Your email address
   - `firstName` (string): Your first name
   - `lastName` (string): Your last name
   - `role` (string): `Administrator`
   - `isVerified` (boolean): `true`
   - `fcmToken` (string): `null` or leave empty
7. Click **Save**

---

## Step 9: Test Your Setup

1. Start the app:

   ```bash
   npm start
   ```

2. Press `w` to open in web browser, or scan QR code with Expo Go app

3. Try logging in with your administrator account

4. You should see:
   - Home screen with notifications (empty initially)
   - Dashboard tab (only visible to Admin/Teacher)
   - Ability to send notifications
   - User management section

---

## Step 10: (Optional) Enable Firebase Cloud Messaging for Push Notifications

This is for Task 13 in the implementation plan (not yet implemented):

1. In Firebase Console, click **Cloud Messaging** in the left sidebar
2. Follow the setup instructions for your platform (iOS/Android)
3. You'll need to configure:
   - For Android: Add `google-services.json`
   - For iOS: Add `GoogleService-Info.plist` and configure APNs

---

## Troubleshooting

### "Permission denied" errors

- Make sure you've deployed the Firestore security rules from Step 5
- Verify your user has the correct role in Firestore

### "Firebase not initialized" errors

- Check that your `.env` file exists and has the correct values
- Restart the Expo development server after changing `.env`

### Can't see Dashboard tab

- Verify your user's role is "Administrator" or "Teacher" in Firestore
- Log out and log back in after changing roles

### Authentication errors

- Verify Email/Password authentication is enabled in Firebase Console
- Check that your email/password meet Firebase requirements (password min 6 characters)

---

## Security Best Practices

1. **Never commit `.env` to version control**
2. **Use different Firebase projects for development and production**
3. **Regularly review Firestore security rules**
4. **Enable Firebase App Check** for additional security (optional)
5. **Monitor Firebase usage** in the console to detect unusual activity

---

## Next Steps

Once Firebase is configured:

1. Create additional test users with different roles
2. Test notification sending and feedback features
3. Explore the user management functionality
4. Consider implementing push notifications (Task 13)

---

## Useful Firebase Console Links

- **Project Overview**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/overview
- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/users
- **Firestore Database**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
- **Project Settings**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID.

---

## Support

If you encounter issues:

1. Check the Firebase Console for error messages
2. Review the app logs in Expo
3. Verify all configuration steps were completed
4. Refer to the main README.md for additional troubleshooting

Happy coding! 🚀
