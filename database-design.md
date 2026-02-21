# Firestore Database Design

## Overview
This document outlines the Firestore database structure for the Book Management System.

## Schema

### 1. `books` Collection
Stores all book information.

| Field | Type | Description |
|---|---|---|
| `title` | string | Title of the book |
| `author` | string | Author of the book |
| `category` | string | Book category (e.g., Fiction, Science) |
| `description` | string | Detailed description |
| `imageUrl` | string | URL of the cover image (Firebase Storage) |
| `totalCopies` | number | Total physical copies owned |
| `availableCopies` | number | Copies currently available for borrowing |
| `isAvailable` | boolean | Manual toggle to show/hide book or mark as unavailable |
| `interestCount` | number | Total number of users who showed interest |
| `createdAt` | timestamp | Creation date |
| `updatedAt` | timestamp | Last update date |
| `createdBy` | string | Admin UID who created the book |

### 2. `books/{bookId}/interests` Subcollection
Stores interest requests for a specific book.

| Field | Type | Description |
|---|---|---|
| `userId` | string | UID of the interested user (if authenticated) |
| `name` | string | Name of the interested person |
| `email` | string | Email of the interested person |
| `mobileNo` | string | Contact number |
| `notes` | string | Optional notes |
| `status` | string | Status: `pending`, `contacted`, `success`, `cancelled` |
| `timestamp` | timestamp | Date/Time of interest submission |

**Indexes Required:**
- `timestamp` (Descending) - For viewing the queue in order.
- `status` - For filtering by status.

### 3. `users` Collection (Recommended)
Stores user profiles and roles.

| Field | Type | Description |
|---|---|---|
| `email` | string | User email |
| `role` | string | `admin` or `reader` |
| `createdAt` | timestamp | Account creation date |

## Storage Structure
Images are stored in Firebase Storage.

- **Path**: `book-covers/{timestamp}_{filename}`
- **Example**: `book-covers/1716384928332_harry-potter.jpg`

## Scalability Considerations
- **Aggregated Counters**: `interestCount` is stored on the book document to allow listing books with their interest counts without reading subcollections.
- **Subcollections**: Interests are stored in subcollections to avoid hitting the 1MB document size limit on the `book` document and to allow scalable querying.
- **Collection Group Queries**: Used to fetch "My Interests" across all books for a specific user.

## Security Rules (Draft)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Books: Public read, Admin write
    match /books/{bookId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Interests: User can create, Admin can update status
      match /interests/{interestId} {
        allow create: if true;
        allow read: if request.auth != null && (resource.data.userId == request.auth.uid || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
        allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }
    }
    
    // Users: User can read own, Admin can read all
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```
