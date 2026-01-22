# USNS - Universal School Notification System

A React Native mobile application built with Expo SDK 54 for managing school notifications with role-based access control.

## Features

- **User Authentication**: Secure login and signup with Firebase Authentication
- **Role-Based Access Control**: 4 user roles (Administrator, Teacher, Verified Student, Student)
- **Notification Management**: Send and view notifications with read tracking
- **Feedback System**: Verified students can provide feedback on notifications
- **Reports System**: Students can submit reports, staff can reply and resolve
- **User Management**: Admins and teachers can manage user roles
- **Push Notifications**: Real-time push notifications (requires development build)

## Tech Stack

- **Frontend**: React Native with Expo SDK 54
- **Backend**: Firebase (Authentication, Firestore, Cloud Messaging)
- **Navigation**: Expo Router + React Native Paper BottomNavigation
- **UI Library**: React Native Paper
- **State Management**: React Context

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app (for basic testing) OR EAS CLI for development builds
- Firebase project with Firestore and Authentication enabled

## Quick Start

### 1. Install Dependencies

```bash
cd usns-app
npm install --legacy-peer-deps
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firebase Authentication (Email/Password provider)
3. Create a Firestore database
4. Copy your Firebase config to `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Deploy Firestore Security Rules

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete security rules.

### 4. Run the App

## Running with Expo Go (Quick Testing)

Expo Go is the fastest way to test the app, but has limitations:

```bash
npm start
# or
npx expo start --tunnel
```

Scan the QR code with:

- **Android**: Expo Go app
- **iOS**: Camera app (opens Expo Go)

### Expo Go Limitations

⚠️ **Push notifications do NOT work in Expo Go** (removed in SDK 53+). The app will show a warning but continue to function for all other features.

Features that work in Expo Go:

- ✅ Authentication (login/signup)
- ✅ View notifications
- ✅ Send notifications (Admin/Teacher)
- ✅ Feedback system
- ✅ Reports system
- ✅ User management
- ✅ All UI features

Features that require a development build:

- ❌ Push notifications (receiving real-time alerts)

## Running with Development Build (Full Features)

For push notifications and full native functionality, you need a development build.

### 1. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 2. Build for Android

```bash
eas build --profile development --platform android
```

### 3. Install the APK

After the build completes:

1. Download the APK from the EAS dashboard link
2. Install on your Android device
3. Run the dev server:

```bash
npx expo start --dev-client --tunnel
```

4. Open the installed app and scan the QR code

### 4. Build for iOS (macOS only)

```bash
eas build --profile development --platform ios
```

## User Roles & Permissions

| Feature            | Administrator | Teacher | Verified Student | Student |
| ------------------ | ------------- | ------- | ---------------- | ------- |
| View Notifications | ✅            | ✅      | ✅               | ✅      |
| Send Notifications | ✅            | ✅      | ❌               | ❌      |
| Send Feedback      | ❌            | ❌      | ✅               | ❌      |
| Reply to Feedback  | ✅            | ✅      | ❌               | ❌      |
| Submit Reports     | ✅            | ✅      | ✅               | ✅      |
| Reply to Reports   | ✅            | ✅      | ❌               | ❌      |
| Verify Students    | ✅            | ✅      | ❌               | ❌      |
| Unverify Students  | ✅            | ✅      | ❌               | ❌      |
| Promote to Teacher | ✅            | ❌      | ❌               | ❌      |
| User Management    | ✅            | ❌      | ❌               | ❌      |

## Creating the First Administrator

1. Sign up through the app (creates a Student account)
2. Go to Firebase Console > Firestore Database
3. Find your user in the `users` collection
4. Edit the document:
   - Change `role` to `"Administrator"`
   - Change `isVerified` to `true`

## Project Structure

```
usns-app/
├── app/                      # Expo Router screens
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/              # Main app screens (uses BottomNavigation)
│   │   ├── index.tsx        # Home (Notifications)
│   │   ├── reports.tsx      # Reports
│   │   ├── feedbacklist.tsx # Feedback
│   │   ├── dashboard.tsx    # Admin panel
│   │   └── _layout.tsx
│   ├── index.tsx            # Entry redirect
│   └── _layout.tsx          # Root layout
├── src/
│   ├── components/          # Reusable components
│   ├── contexts/            # React Context providers
│   ├── services/            # Push notification service
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Utility functions
│   └── config/              # Firebase config
└── package.json
```

## Firestore Collections

| Collection           | Description                          |
| -------------------- | ------------------------------------ |
| `users`              | User profiles with roles             |
| `notifications`      | School announcements                 |
| `feedback`           | Student feedback on notifications    |
| `reports`            | Student reports with staff replies   |
| `push_notifications` | Queue for push notification delivery |

## Troubleshooting

### "Cannot cast String to Boolean" error

This is a known SDK 54 bug with Expo Router's `<Stack>` and `<Tabs>`. The app uses `<Slot>` and React Native Paper's `BottomNavigation` as a workaround.

### Firestore Index Errors

When you see "The query requires an index" errors, click the link in the error message to create the required composite index in Firebase Console.

### Push Notification Warning in Expo Go

This is expected. Push notifications require a development build. The app will work normally for all other features.

### Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx expo start -c
```

## License

MIT
