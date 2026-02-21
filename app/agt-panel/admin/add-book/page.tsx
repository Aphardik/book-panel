"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/agt-panel/components/ui/card"
import { BookForm } from "@/agt-panel/components/admin/book-form"

export default function AddBookPage() {
  const router = useRouter()

  return (
    <>
      <h1 className="text-2xl font-bold mb-8">Add New Book</h1>

      <Card className="bg-card border-border/50 p-8">
        <BookForm
          onSubmit={(data) => {
            console.log("Book added:", data)
            router.push("/agt-panel/admin/books")
          }}
          onCancel={() => router.back()}
        />
      </Card>
    </>
  )
}

