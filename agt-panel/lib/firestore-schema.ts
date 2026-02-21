/**
 * FIRESTORE DATABASE SCHEMA - OPTIMIZED FOR 60K+ RECORDS
 *
 * DESIGN PRINCIPLES FOR COST EFFICIENCY:
 * 1. Denormalized data - Avoid excessive joins/reads
 * 2. Efficient indexing - Only essential compound indexes
 * 3. Aggregation caching - Store counts to avoid aggregation queries
 * 4. Queue structure - Date-ordered interests stored separately
 * 5. Batch writes - Group updates to minimize write costs
 */

// COLLECTION: books (stores all books)
// INDEX: category + availability for filtering
export interface Book {
  id: string
  title: string
  author: string
  category: string
  imageUrl: string
  totalCopies: number
  availableCopies: number
  isAvailable: boolean // toggle for admin
  interestCount: number // DENORMALIZED - updated on each interest
  createdAt: Date
  updatedAt: Date
}

// COLLECTION: book_interests (queue of interests per book, date-ordered)
// PATH: books/{bookId}/interests
// INDEX: timestamp (DESC) for queue ordering
export interface BookInterest {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: "pending" | "contacted" | "success" // admin tracks progress
  timestamp: Date
  updatedAt: Date
}

// COLLECTION: user_interests (for users to track their interests)
// PATH: users/{userId}/interests
// Stores reference to book_id + status for quick user-side lookup
export interface UserInterest {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookImage: string
  status: "pending" | "contacted" | "success"
  timestamp: Date
  updatedAt: Date
}

// COLLECTION: users (minimal - just for tracking)
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "reader" // for access control
  createdAt: Date
  lastActive: Date
}

/**
 * QUERY OPTIMIZATION STRATEGY:
 *
 * ✅ Admin viewing book list:
 *    - Single read: books collection (paginated, 50 per page)
 *
 * ✅ Admin viewing interest queue for a book:
 *    - Single read: books/{bookId}/interests (date-ordered)
 *    - Cost: 1 read per page
 *
 * ✅ Admin viewing interest analytics:
 *    - Single read: books collection (already denormalized interestCount)
 *    - Cost: 1 read for full analytics
 *
 * ✅ Reader viewing all books:
 *    - Single read: books collection (paginated)
 *
 * ✅ Reader viewing their interests:
 *    - Single read: users/{userId}/interests
 *
 * ✅ User shows interest:
 *    - Batch write: Update books/{bookId} interestCount
 *    - Create: books/{bookId}/interests/{newInterest}
 *    - Create: users/{userId}/interests/{newInterest}
 *    - Cost: 3 writes (batch)
 */
