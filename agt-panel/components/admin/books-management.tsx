"use client"

import { useState, useEffect } from "react"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { Card } from "@/agt-panel/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/agt-panel/components/ui/dialog"
import { Badge } from "@/agt-panel/components/ui/badge"
import { BookForm } from "@/agt-panel/components/admin/book-form"
import { InterestQueue } from "@/agt-panel/components/admin/interest-queue"
import { Search, Plus, BookOpen, Users, MoreVertical, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/agt-panel/components/ui/dropdown-menu"
import { functions, db } from "@/agt-panel/lib/firebase-auth"
import { httpsCallable } from "firebase/functions"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { useToast } from "@/agt-panel/hooks/use-toast"

interface Book {
  id: string
  title: string
  author: string
  category: string
  imageUrl: string
  totalCopies: number
  availableCopies: number
  isAvailable: boolean
  interestCount: number
  createdAt: Date
}

export default function BooksManagement() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const q = query(collection(db, "books"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Book[]
      setBooks(booksData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching books:", error)
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive"
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [toast])

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddBook = (newBook: Book) => {
    // Firestore listener will automatically update the list
    setIsAddBookOpen(false)
  }

  const handleToggleAvailability = async (book: Book) => {
    try {
      const toggleAvailability = httpsCallable(functions, "toggleBookAvailability")
      await toggleAvailability({
        bookId: book.id,
        isAvailable: !book.isAvailable,
      })

      toast({
        title: "Success",
        description: `Book marked as ${!book.isAvailable ? "available" : "unavailable"}`,
      })
    } catch (error) {
      console.error("Error toggling availability:", error)
      toast({
        title: "Error",
        description: "Failed to update book availability",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books Management</h1>
          <p className="text-muted-foreground mt-1">Manage your library collection and track interests.</p>
        </div>
        <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
            </DialogHeader>
            <BookForm onSubmit={handleAddBook} onCancel={() => setIsAddBookOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card border-border/50 max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-md group">
              <div className="flex h-full">
                <div className="w-32 relative flex-shrink-0 bg-muted/20">
                  <img
                    src={book.imageUrl || "/placeholder.svg"}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant={book.isAvailable ? "default" : "destructive"} className="text-[10px] px-1.5 py-0.5 h-5">
                      {book.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold leading-tight line-clamp-1" title={book.title}>{book.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedBook(book)}>
                          View Interests
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleAvailability(book)}>
                          Mark as {book.isAvailable ? "Unavailable" : "Available"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {book.category}
                    </Badge>
                  </div>

                  <div className="mt-auto pt-4 grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <BookOpen className="h-3 w-3" /> Copies
                      </div>
                      <span className="font-semibold text-sm">{book.availableCopies}/{book.totalCopies}</span>
                    </div>
                    <div className="bg-muted/30 rounded p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <Users className="h-3 w-3" /> Interests
                      </div>
                      <span className="font-semibold text-sm text-primary">{book.interestCount}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setSelectedBook(book)}
                  >
                    Manage Interests
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No books found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or add a new book.</p>
        </div>
      )}

      {selectedBook && <InterestQueue book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  )
}

