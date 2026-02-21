"use client"
import { useState, useEffect } from "react"
import Sidebar from "@/agt-panel/components/sidebar"
import { Card } from "@/agt-panel/components/ui/card"
import { Button } from "@/agt-panel/components/ui/button"
import { Input } from "@/agt-panel/components/ui/input"
import { useTheme } from "next-themes"
import { booksApi, interestsApi, readersApi, ordersApi } from "@/agt-panel/lib/api-client"
import { useCart } from "@/agt-panel/lib/cart-context"
import { Check, ShoppingCart } from "lucide-react"

interface Book {
  id: string | number
  title: string
  author: string
  category: any // string or object
  imageUrl?: string // or frontImage
  frontImage?: string
  totalCopies?: number
  availableCopies?: number
  isAvailable?: boolean
  stockQty?: number
  price?: number
  [key: string]: any
}

export default function PublicBooksPage() {
  const { theme } = useTheme()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { addToCart, isInCart } = useCart()

  const [categories, setCategories] = useState<string[]>([])

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true)
        const result = await booksApi.getAll({ limit: 1000 })

        const booksList = Array.isArray(result) ? result : (result.books || [])

        if (Array.isArray(booksList)) {
          setBooks(booksList)

          // Extract unique categories
          // Helper to get category name
          const getCatName = (b: Book) => typeof b.category === 'object' ? b.category?.name : b.category;

          const uniqueCategories = Array.from(new Set(booksList.map((book: Book) => getCatName(book)))).filter(Boolean) as string[]
          setCategories(uniqueCategories.sort())
        }
      } catch (error) {
        console.error("Error fetching books:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [])

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
    alert(`"${book.title}" added to cart!`)
  }

  return (
    <div className="flex">
      <Sidebar isAdmin={false} />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Our Books</h1>
          <p className="text-muted-foreground">Explore our collection and place your order</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4 mb-8">
          <Input
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-card border-border/50"
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const catName = typeof book.category === 'object' ? book.category?.name : book.category;
            const imgUrl = book.frontImage || book.imageUrl || "/placeholder.svg";
            const stock = book.availableCopies ?? book.stockQty ?? 0;
            const isAvail = (book.isAvailable !== false && stock > 0);

            return (
              <Card
                key={book.id}
                className="bg-card border-border/50 overflow-hidden hover:border-accent/50 transition-colors hover:shadow-lg"
              >
                <div className="aspect-video relative overflow-hidden bg-background/50">
                  <img
                    src={imgUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 text-xs bg-black/60 backdrop-blur px-2 py-1 rounded text-white">
                    {catName}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-1 rounded-full ${isAvail ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                        }`}
                    >
                      {isAvail ? `${stock} copies` : "Out of Stock"}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(book)}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="sm"
                    variant={isInCart(book.id) ? "outline" : "default"}
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
      </main>

    </div>
  )
}

