"use client"

import { useEffect, useState } from "react"
import { Button } from "@/agt-panel/components/ui/button"
import { Card } from "@/agt-panel/components/ui/card"
import { db, functions } from "@/agt-panel/lib/firebase-auth"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { httpsCallable } from "firebase/functions"
import { useToast } from "@/agt-panel/hooks/use-toast"

interface Interest {
  id: string
  userId: string
  userName: string
  userEmail: string
  status: "pending" | "contacted" | "success" | "cancelled"
  timestamp: Date
}

interface InterestQueueProps {
  book: any
  onClose: () => void
}

export function InterestQueue({ book, onClose }: InterestQueueProps) {
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!book?.id) return

    const q = query(
      collection(db, "books", book.id, "interests"),
      orderBy("timestamp", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const interestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        userId: doc.data().userId || "",
        userName: doc.data().name,
        userEmail: doc.data().email,
        status: doc.data().status,
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Interest[]
      setInterests(interestsData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching interests:-", error)
      toast({
        title: "Error",
        description: "Failed to load interests.",
        variant: "destructive",
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [book?.id, toast])

  const handleStatusChange = async (interestId: string, newStatus: Interest["status"]) => {
    try {
      const updateStatus = httpsCallable(functions, "updateInterestStatus")
      await updateStatus({
        bookId: book.id,
        interestId,
        status: newStatus,
      })

      toast({
        title: "Success",
        description: "Status updated successfully",
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-600",
    contacted: "bg-cyan-500/20 text-cyan-600",
    success: "bg-green-500/20 text-green-600",
    cancelled: "bg-red-500/20 text-red-600",
  }

  return (
    <Card className="p-6 bg-card border-border/50 fixed inset-0 top-20 m-6 max-h-[calc(100vh-8rem)] overflow-y-auto z-50 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{book.title} - Interest Queue</h2>
          <p className="text-muted-foreground text-sm">{interests.length} total interests (date-ordered)</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          ✕ Close
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {interests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No interests found for this book.</p>
          ) : (
            interests.map((interest) => (
              <div
                key={interest.id}
                className="flex items-center justify-between bg-background/50 border border-border/50 rounded-lg p-4"
              >
                <div className="flex-1">
                  <p className="font-semibold">{interest.userName}</p>
                  <p className="text-sm text-muted-foreground">{interest.userEmail}</p>
                  <p className="text-xs text-muted-foreground mt-1">{interest.timestamp.toLocaleString()}</p>
                </div>

                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[interest.status] || "bg-gray-500/20 text-gray-600"}`}>
                    {interest.status.charAt(0).toUpperCase() + interest.status.slice(1)}
                  </span>
                  <select
                    value={interest.status}
                    onChange={(e) => handleStatusChange(interest.id, e.target.value as any)}
                    className="px-2 py-1 text-xs bg-background/50 border border-border/50 rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="success">Success</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  )
}

