import * as admin from "firebase-admin"
import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { onCall, HttpsError } from "firebase-functions/v2/https"
import { setGlobalOptions } from "firebase-functions/v2"

admin.initializeApp()

const db = admin.firestore()

// Set global options if needed, e.g., region
setGlobalOptions({ maxInstances: 10 })

// Cloud function to save user interest
export const submitUserInterest = onCall({ cors: true }, async (request) => {
  // Allow public access

  try {
    const { bookId, name, email, mobileNo, notes } = request.data

    if (!bookId || !name || !mobileNo) {
      throw new HttpsError("invalid-argument", "Missing required fields: bookId, name, mobileNo")
    }

    // Get book details to store title
    const bookRef = db.collection("books").doc(bookId)
    const bookSnap = await bookRef.get()

    if (!bookSnap.exists) {
      throw new HttpsError("not-found", "Book not found")
    }

    const bookData = bookSnap.data()

    // Create interest record in subcollection
    const interestRef = bookRef.collection("interests").doc()

    const interestData: any = {
      name,
      email: email || "",
      mobileNo,
      notes: notes || "",
      bookTitle: bookData?.title || "Unknown Book",
      timestamp: FieldValue.serverTimestamp(),
      status: "pending",
    }

    // Add userId if authenticated
    if (request.auth) {
      interestData.userId = request.auth.uid
    }

    await interestRef.set(interestData)

    // Increment interest count on book document
    await bookRef.update({
      interestCount: FieldValue.increment(1),
    })

    return {
      success: true,
      message: "Interest recorded successfully",
      interestId: interestRef.id,
    }
  } catch (error: any) {
    console.error("Error submitting interest:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to add a new book
export const addBook = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { title, author, category, language, imageUrl, totalCopies, description } = request.data

    if (!title || !author || !category || !language || !totalCopies) {
      throw new HttpsError("invalid-argument", "Missing required fields")
    }

    // Create book document
    const bookRef = db.collection("books").doc()
    await bookRef.set({
      title,
      author,
      category,
      language,
      imageUrl: imageUrl || "",
      totalCopies: Number.parseInt(totalCopies),
      availableCopies: Number.parseInt(totalCopies),
      description: description || "",
      isAvailable: true,
      interestCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    })

    return {
      success: true,
      message: "Book added successfully",
      bookId: bookRef.id,
    }
  } catch (error: any) {
    console.error("Error adding book:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to update interest status
export const updateInterestStatus = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { bookId, interestId, status } = request.data

    if (!bookId || !interestId || !["pending", "contacted", "success"].includes(status)) {
      throw new HttpsError("invalid-argument", "Invalid arguments")
    }

    // Update interest status
    await db.collection("books").doc(bookId).collection("interests").doc(interestId).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      message: "Interest status updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating interest status:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to toggle book availability
export const toggleBookAvailability = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { bookId, isAvailable } = request.data

    if (!bookId || isAvailable === undefined) {
      throw new HttpsError("invalid-argument", "Missing required fields")
    }

    // Update book availability
    await db.collection("books").doc(bookId).update({
      isAvailable,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      message: "Book availability updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating book availability:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to get interests for a book
export const getBookInterests = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { bookId } = request.data

    if (!bookId) {
      throw new HttpsError("invalid-argument", "bookId is required")
    }

    // Get all interests for the book
    const snapshot = await db.collection("books").doc(bookId).collection("interests").orderBy("timestamp", "desc").get()

    const interests = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return {
      success: true,
      interests,
      count: interests.length,
    }
  } catch (error: any) {
    console.error("Error fetching interests:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to get all books (paginated)
export const getBooks = onCall({ cors: true }, async (request) => {
  // Allow public access for listing books
  // if (!request.auth) {
  //   throw new HttpsError("unauthenticated", "User must be authenticated")
  // }

  try {
    const { limit = 50, lastVisibleId } = request.data

    let query = db.collection("books").orderBy("createdAt", "desc").limit(limit)

    if (lastVisibleId) {
      const lastDoc = await db.collection("books").doc(lastVisibleId).get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      }
    }

    const snapshot = await query.get()

    const books = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }))

    return {
      success: true,
      books,
      count: books.length,
    }
  } catch (error: any) {
    console.error("Error fetching books:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to get all interests across all books (paginated)
export const getAllInterests = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { limit = 50, lastVisibleId } = request.data

    // Use collection group query to search across all 'interests' subcollections
    let query = db.collectionGroup("interests").orderBy("timestamp", "desc").limit(limit)

    if (lastVisibleId) {
      // Note: For collection group queries, pagination might require the actual document snapshot or more complex cursor logic
      // Simulating by fetching the doc if we had the path, but here we only have ID.
      // Ideally, we pass the full path or use a timestamp cursor.
      // For simplicity in this design, we'll assume the client passes the timestamp of the last item for cursor
      // But let's try to find the doc by ID if possible, or just rely on timestamp if provided.
      // Actually, standard pagination often uses the document snapshot.
      // Let's assume client passes 'lastTimestamp' for easier pagination in collection groups.
    }

    // Re-implementing pagination logic for collection group to be robust
    if (request.data.lastTimestamp) {
      const timestamp = Timestamp.fromDate(new Date(request.data.lastTimestamp));
      query = query.startAfter(timestamp);
    }


    const snapshot = await query.get()

    const interests = await Promise.all(snapshot.docs.map(async (doc: any) => {
      const data = doc.data()
      // We might want the book title if it's not in the interest doc (it is in our schema)
      // Schema says 'bookTitle' is in interestData.

      // We also need the bookId, which is the parent's parent id
      const bookId = doc.ref.parent.parent?.id

      return {
        id: doc.id,
        bookId,
        ...data,
        timestamp: data.timestamp?.toDate().toISOString(),
      }
    }))

    return {
      success: true,
      interests,
      count: interests.length,
    }
  } catch (error: any) {
    console.error("Error fetching all interests:", error)
    throw new HttpsError("internal", error.message)
  }
})
// Cloud function to delete a book
export const deleteBook = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { bookId } = request.data

    if (!bookId) {
      throw new HttpsError("invalid-argument", "bookId is required")
    }


    // Delete book document
    await db.collection("books").doc(bookId).delete()

    // Optionally delete subcollections (interests) if needed, 
    // but Firestore doesn't automatically delete subcollections.
    // For now, we'll leave them or implement a recursive delete if strictly required.
    // Given the scope, just deleting the book doc is standard for now.

    return {
      success: true,
      message: "Book deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting book:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to update a book
export const updateBook = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { bookId, data } = request.data

    if (!bookId || !data) {
      throw new HttpsError("invalid-argument", "bookId and data are required")
    }

    // Update book document
    await db.collection("books").doc(bookId).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      message: "Book updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating book:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to get a single book
export const getBook = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { bookId } = request.data

    if (!bookId) {
      throw new HttpsError("invalid-argument", "bookId is required")
    }

    const doc = await db.collection("books").doc(bookId).get()

    if (!doc.exists) {
      throw new HttpsError("not-found", "Book not found")
    }

    return {
      success: true,
      book: {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate().toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate().toISOString(),
      },
    }
  } catch (error: any) {
    console.error("Error fetching book:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to add a new category
export const addCategory = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { name } = request.data

    if (!name) {
      throw new HttpsError("invalid-argument", "Category name is required")
    }

    // Check if category already exists
    const snapshot = await db.collection("categories").where("name", "==", name).get()
    if (!snapshot.empty) {
      throw new HttpsError("already-exists", "Category already exists")
    }

    // Create category document
    const categoryRef = db.collection("categories").doc()
    await categoryRef.set({
      name,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    })

    return {
      success: true,
      message: "Category added successfully",
      categoryId: categoryRef.id,
    }
  } catch (error: any) {
    console.error("Error adding category:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to get all categories
export const getCategories = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const snapshot = await db.collection("categories").orderBy("name", "asc").get()

    const categories = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return {
      success: true,
      categories,
    }
  } catch (error: any) {
    console.error("Error fetching categories:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to update a category
export const updateCategory = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { categoryId, name } = request.data

    if (!categoryId || !name) {
      throw new HttpsError("invalid-argument", "categoryId and name are required")
    }

    // Check if category exists
    const categoryRef = db.collection("categories").doc(categoryId)
    const categoryDoc = await categoryRef.get()

    if (!categoryDoc.exists) {
      throw new HttpsError("not-found", "Category not found")
    }

    // Check if new name already exists (excluding current category)
    const snapshot = await db.collection("categories").where("name", "==", name).get()
    if (!snapshot.empty) {
      const existingCategory = snapshot.docs[0]
      if (existingCategory.id !== categoryId) {
        throw new HttpsError("already-exists", "Category name already exists")
      }
    }

    // Update category
    await categoryRef.update({
      name,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      message: "Category updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating category:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to delete a category
export const deleteCategory = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { categoryId } = request.data

    if (!categoryId) {
      throw new HttpsError("invalid-argument", "categoryId is required")
    }

    // Delete category document
    await db.collection("categories").doc(categoryId).delete()

    return {
      success: true,
      message: "Category deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting category:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to add a new language
export const addLanguage = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { name } = request.data

    if (!name) {
      throw new HttpsError("invalid-argument", "Language name is required")
    }

    // Check if language already exists
    const snapshot = await db.collection("languages").where("name", "==", name).get()
    if (!snapshot.empty) {
      throw new HttpsError("already-exists", "Language already exists")
    }

    // Create language document
    const languageRef = db.collection("languages").doc()
    await languageRef.set({
      name,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    })

    return {
      success: true,
      message: "Language added successfully",
      languageId: languageRef.id,
    }
  } catch (error: any) {
    console.error("Error adding language:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to get all languages
export const getLanguages = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const snapshot = await db.collection("languages").orderBy("name", "asc").get()

    const languages = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return {
      success: true,
      languages,
    }
  } catch (error: any) {
    console.error("Error fetching languages:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to update a language
export const updateLanguage = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { languageId, name } = request.data

    if (!languageId || !name) {
      throw new HttpsError("invalid-argument", "languageId and name are required")
    }

    // Check if language exists
    const languageRef = db.collection("languages").doc(languageId)
    const languageDoc = await languageRef.get()

    if (!languageDoc.exists) {
      throw new HttpsError("not-found", "Language not found")
    }

    // Check if new name already exists (excluding current language)
    const snapshot = await db.collection("languages").where("name", "==", name).get()
    if (!snapshot.empty) {
      const existingLanguage = snapshot.docs[0]
      if (existingLanguage.id !== languageId) {
        throw new HttpsError("already-exists", "Language name already exists")
      }
    }

    // Update language
    await languageRef.update({
      name,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      message: "Language updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating language:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to delete a language
export const deleteLanguage = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { languageId } = request.data

    if (!languageId) {
      throw new HttpsError("invalid-argument", "languageId is required")
    }

    // Delete language document
    await db.collection("languages").doc(languageId).delete()

    return {
      success: true,
      message: "Language deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting language:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to get dashboard stats
export const getDashboardStats = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    // Get total books count
    const booksSnapshot = await db.collection("books").count().get()
    const totalBooks = booksSnapshot.data().count

    // Get total interests count (across all books)
    const interestsSnapshot = await db.collectionGroup("interests").count().get()
    const totalInterests = interestsSnapshot.data().count

    // Get contacted users count (interests with status 'contacted' or 'success')
    // Note: count() with query is supported
    const contactedSnapshot = await db.collectionGroup("interests")
      .where("status", "in", ["contacted", "success"])
      .count()
      .get()
    const contactedUsers = contactedSnapshot.data().count

    return {
      success: true,
      stats: {
        totalBooks,
        totalInterests,
        contactedUsers,
      },
    }
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error)
    throw new HttpsError("internal", error.message)
  }
})

// Cloud function to delete an interest
export const deleteInterest = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated")
  }

  try {
    const { bookId, interestId } = request.data

    if (!bookId || !interestId) {
      throw new HttpsError("invalid-argument", "bookId and interestId are required")
    }

    // Delete interest document
    await db.collection("books").doc(bookId).collection("interests").doc(interestId).delete()

    // Decrement interest count on book document
    await db.collection("books").doc(bookId).update({
      interestCount: FieldValue.increment(-1),
    })

    return {
      success: true,
      message: "Interest deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting interest:", error)
    throw new HttpsError("internal", error.message)
  }
})
