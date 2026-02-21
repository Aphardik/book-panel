"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/agt-panel/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card"
import { Badge } from "@/agt-panel/components/ui/badge"
import { Loader2, Calendar, BookOpen } from "lucide-react"
import { interestsApi } from "@/agt-panel/lib/api-client"

interface Interest {
  id: string
  bookId: string
  bookTitle?: string
  status: "pending" | "contacted" | "success" | "cancelled"
  timestamp: string | any // API returns string usually
  notes?: string
  [key: string]: any
}

export default function MyInterests() {
  const { user } = useAuth()
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInterests() {
      if (!user) return

      try {
        const result = await interestsApi.getUserInterests(user.uid)

        if (result && Array.isArray(result)) {
          // We might need to map or sort. The API might return them sorted.
          // Assuming API returns standard JSON objects.
          setInterests(result)
        }
      } catch (error) {
        console.error("Error fetching interests:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchInterests()
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p>Please log in to view your interests.</p>
      </div>
    )
  }

  if (interests.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
        <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No interests found</h3>
        <p className="text-muted-foreground">You haven't shown interest in any books yet.</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    contacted: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    success: "bg-green-500/10 text-green-600 border-green-200",
    cancelled: "bg-red-500/10 text-red-600 border-red-200",
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">My Interests</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {interests.map((interest) => (
          <Card key={interest.id} className="overflow-hidden border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-medium line-clamp-1">
                  {interest.bookTitle || "Book Interest"}
                </CardTitle>
                <Badge variant="outline" className={`${statusColors[interest.status] || "bg-gray-100"} border`}>
                  {interest.status ? (interest.status.charAt(0).toUpperCase() + interest.status.slice(1)) : "Unknown"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  {interest.timestamp ? new Date(interest.timestamp).toLocaleDateString() : "N/A"}
                </div>
                {interest.notes && (
                  <p className="text-muted-foreground italic">"{interest.notes}"</p>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  ID: {interest.bookId}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

