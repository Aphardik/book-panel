"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { Card } from "@agt-panel/components/ui/card"
import { BookForm } from "@agt-panel/components/admin/book-form"
import { useToast } from "@agt-panel/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { booksApi } from "@agt-panel/lib/api-client"

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [book, setBook] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        const fetchBook = async () => {
            try {
                // Fetch book details using the client
                // Note: getById returns { book: ... } or just the book object depending on API.
                // Based on standard simple REST, it might just be the object.
                // However, I'll assume standard unwrapping if my client simply returns res.json().
                const data = await booksApi.getById(id)
                setBook(data || null)
            } catch (error) {
                console.error("Error fetching book:", error)
                toast({
                    title: "Error",
                    description: "Failed to fetch book details.",
                    variant: "destructive",
                })
                router.push("/agt-panel/admin/books")
            } finally {
                setLoading(false)
            }
        }

        fetchBook()
    }, [id, router, toast])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-4xl font-bold mb-8">Edit Book</h1>

            <Card className="bg-card border-border/50 p-8">
                {book && (
                    <BookForm
                        initialData={book}
                        isEditing={true}
                        bookId={id}
                        onSubmit={(data) => {
                            console.log("Book updated:", data)
                            router.push("/agt-panel/admin/books")
                        }}
                        onCancel={() => router.back()}
                    />
                )}
            </Card>
        </div>
    )
}

