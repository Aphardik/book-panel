"use client"

import { useState, useEffect } from "react"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { Card } from "@/agt-panel/components/ui/card"
import { useToast } from "@/agt-panel/hooks/use-toast"
import { Loader2, Search, BookOpen, Check } from "lucide-react"
// import { useAuth } from "@/agt-panel/lib/auth-context" // Auth context might still be useful for user details if available, but for data fetching we use api-client
import { booksApi, interestsApi, readersApi, ordersApi } from "@/agt-panel/lib/api-client"
import { useCart } from "@/agt-panel/lib/cart-context"

interface Book {
  id: string | number
  title: string
  author: string
  category: any
  imageUrl?: string
  frontImage?: string
  totalCopies?: number
  availableCopies?: number
  isAvailable: boolean
  interestCount?: number
  stockQty?: number
  [key: string]: any
}

export default function BookBrowser() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const { addToCart, isInCart } = useCart()

  const { toast } = useToast()
  // const { user } = useAuth() // Assuming we might not have auth context fully working or migrated, or we can keep it for pre-filling form if it relies on a different auth provider.
  // For now I will comment out user pre-filling to be safe or assuming the user will fill it.
  // Or I can keep it if useAuth still exists and works (it does exist in lib/auth-context).
  // I will leave it commented to reduce dependencies on legacy firebase auth, or check if I can use it.
  // The user prompt implies replacing backend, but maybe auth is still firebase? The user didn't say "remove auth".
  // But previously I removed auth checks.
  // I'll leave the form manual for now.

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const data = await booksApi.getAll()
      // API might return { books: [], pagination: {} } or directly an array
      const booksList = Array.isArray(data) ? data : (data.books || [])

      if (Array.isArray(booksList)) {
        setBooks(booksList)

        // Extract unique categories
        const getCatName = (b: Book) => typeof b.category === 'object' ? b.category?.name : b.category;
        const uniqueCategories = Array.from(new Set(booksList.map((book: Book) => getCatName(book)))).filter(Boolean) as string[]
        setCategories(uniqueCategories.sort())
      }
    } catch (error) {
      console.error("Error fetching books:", error)
      toast({
        title: "Error",
        description: "Failed to load books. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredBooks = books.filter(
    (book) => {
      const catName = typeof book.category === 'object' ? book.category?.name : book.category;
      return (
        (book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCategory === "all" || catName === selectedCategory)
      )
    }
  )

  const handleAddToCart = (book: Book) => {
    addToCart(book)
    toast({
      title: "Added to Cart",
      description: `"${book.title}" has been added to your cart.`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Browse Books</h1>
        <p className="text-muted-foreground mt-1">Explore our collection and show your interest</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            size="sm"
          >
            All Books
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No books found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const catName = typeof book.category === 'object' ? book.category?.name : book.category;
            const imgUrl = book.frontImage || book.imageUrl || "/placeholder.svg";
            const stock = book.availableCopies ?? book.stockQty ?? 0;
            const isAvail = (book.isAvailable !== false && stock > 0);

            return (
              <Card
                key={book.id}
                className="bg-card border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg group flex flex-col h-full"
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-muted">
                  <img
                    src={imgUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "/placeholder.svg") {
                        target.src = "/placeholder.svg";
                      }
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-bold bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full uppercase tracking-wider">
                      {catName}
                    </span>
                  </div>
                  {!isAvail && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold border-2 border-white px-4 py-2 rounded-md transform -rotate-12">
                        UNAVAILABLE
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-1" title={book.title}>{book.title}</h3>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-t border-border/50">
                    <span
                      className={`flex items-center gap-1.5 ${isAvail ? "text-green-500" : "text-orange-500"
                        }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isAvail ? "bg-green-500" : "bg-orange-500"}`}></span>
                      {isAvail ? `${stock} Available` : "Out of Stock"}
                    </span>
                    {/* <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <span className="text-primary">♥</span> {book.interestCount}
                  </span> */}
                  </div>

                  <Button
                    onClick={() => handleAddToCart(book)}
                    className="w-full"
                    variant={isInCart(book.id) ? "outline" : (isAvail ? "default" : "secondary")}
                    disabled={isInCart(book.id)}
                  >
                    {isInCart(book.id) ? (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Added
                      </>
                    ) : (isAvail ? "Add to Cart" : "Join Waitlist")}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

    </div>
  )
}

