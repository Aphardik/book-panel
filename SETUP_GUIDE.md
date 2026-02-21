# LibreShare Book Interest System - Setup Guide

## Overview
This is a scalable book-interest management system built with Next.js, Firebase, and modern web technologies.

## Features
- Admin authentication with email/password
- Collapsible sidebar navigation with theme switching
- Separate book management page for admins
- Public book browsing for readers (no login required)
- Interest submission form with name, mobile, optional email, and notes
- Firebase Cloud Functions for backend logic
- Optimized Firestore schema for 60k+ records

## Project Structure

\`\`\`
.
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout with providers
│   ├── admin/
│   │   ├── login/page.tsx       # Admin login page
│   │   ├── dashboard/page.tsx   # Admin dashboard
│   │   └── add-book/page.tsx    # Add book page
│   └── books/page.tsx           # Public book browsing page
├── components/
│   ├── sidebar.tsx              # Collapsible sidebar with theme switch
│   ├── admin/                   # Admin-specific components
│   ├── reader/                  # Reader-specific components
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── firebase-auth.ts         # Firebase auth setup
│   └── auth-context.tsx         # Auth context provider
├── functions/
│   └── src/index.ts             # Cloud Functions
└── middleware.ts                # Next.js middleware for route protection
\`\`\`

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local`:

\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

### 2. Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database (use production mode)
3. Enable Firebase Authentication (Email/Password method)
4. Create an admin account in Firebase Console
5. Get your web config from Project Settings

### 3. Admin Credentials

**Default Admin Setup:**
- Go to Firebase Console → Authentication
- Click "Add user" and create an admin account
  - Email: `admin@example.com`
  - Password: Set a strong password (minimum 6 characters)
- Note: This is just an example. Change to your actual credentials.

**To create additional admins:**
- Add users in Firebase Console → Authentication
- They'll be able to log in with their email/password

### 4. Firestore Schema

The system uses the following collections:

\`\`\`
books/
├── {bookId}/
│   ├── title: string
│   ├── author: string
│   ├── category: string
│   ├── imageUrl: string
│   ├── totalCopies: number
│   ├── availableCopies: number
│   ├── isAvailable: boolean
│   ├── interestCount: number (denormalized for cost efficiency)
│   ├── createdAt: timestamp
│   └── interests/ (subcollection)
│       └── {interestId}/
│           ├── name: string
│           ├── email: string (optional)
│           ├── mobileNo: string
│           ├── notes: string (optional)
│           ├── status: "pending" | "contacted" | "success"
│           └── timestamp: timestamp
\`\`\`

### 5. Firebase Cloud Functions Setup

\`\`\`bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy functions to Firebase
npm run deploy
\`\`\`

**Deployed Functions:**
- `submitUserInterest` - Records user interest in a book
- `addBook` - Adds new book (admin only)
- `updateInterestStatus` - Updates interest status
- `toggleBookAvailability` - Toggles book availability
- `getBookInterests` - Fetches interests for a book

### 6. Deploy to Vercel

\`\`\`bash
# Link project to Vercel
vercel link

# Deploy
vercel deploy
\`\`\`

### 7. Running Locally

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
\`\`\`

## User Flows

### Admin Flow
1. Visit `/admin/login`
2. Enter credentials (email/password from Firebase)
3. Access `/admin/dashboard` with KPIs
4. Navigate to `/admin/books` to manage books
5. Go to `/admin/add-book` to add new books
6. View interests and update statuses
7. Toggle theme using sidebar theme button
8. Logout via sidebar

### Reader Flow
1. Visit `/books` (public, no login required)
2. Browse books with search and category filters
3. Click "Show Interest" on any book
4. Fill interest form (name, mobile required; email/notes optional)
5. Submit form
6. Interest is recorded in Firestore

## Cost Optimization

- **Denormalized `interestCount`** - Avoids expensive aggregation queries
- **Subcollections for interests** - Organizes data hierarchically
- **Single-read operations** - Most queries read one document
- **Batch writes** - Interest submission uses transaction-like operations
- **Indexed queries** - Firestore automatically indexes by timestamp

## Login Guide

### Username & Password for Admin

There is **NO predefined username/password**. You create admin accounts in Firebase:

1. **First Admin Account:**
   - Go to Firebase Console → Authentication
   - Click "Add user"
   - Set email and password (minimum 6 characters)
   - These become your login credentials

2. **Example Credentials:**
   - Email: `admin@yourdomain.com`
   - Password: `SecurePassword123!` (your choice)

3. **To create more admins:**
   - Repeat the process in Firebase Console
   - Each user can log in with their email/password

### Security Notes
- All admins must authenticate before accessing `/admin/*` routes
- Public users access `/books` without authentication
- Firestore rules should be configured to restrict admin functions to authenticated users
- Use Firebase Security Rules to restrict Firestore writes

## Firestore Security Rules

Apply these rules in Firebase Console → Firestore → Rules:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read books (public)
    match /books/{document=**} {
      allow read;
      // Only authenticated admins can write
      allow write: if request.auth != null;
    }
    
    // Authenticated users can submit interests
    match /interests/{document=**} {
      allow read, write: if request.auth != null || request.resource.data.size() > 0;
    }
  }
}
\`\`\`

## Theme Switching

- Click the sun/moon icon in the sidebar to toggle between light and dark modes
- Theme preference is saved to localStorage
- Available at all times for both admins and readers

## Troubleshooting

### "Login failed" error
- Verify Firebase credentials in `.env.local`
- Check Firebase Console for user account
- Ensure email/password is correct

### Books not showing
- Check Firestore database has data
- Verify read permissions in Security Rules
- Check browser console for errors

### Interest not submitting
- Ensure Firebase Cloud Function is deployed
- Check function permissions
- Verify Firestore write access

## Next Steps
- Customize the email validation logic
- Add image upload functionality for book covers
- Implement email notifications for admins
- Add advanced analytics dashboard
- Set up database backup strategy
