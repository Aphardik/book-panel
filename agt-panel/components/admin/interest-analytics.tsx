"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/agt-panel/components/ui/card"
import { TrendingUp, Users, Award, ArrowUpRight, Loader2 } from "lucide-react"
import { db } from "@/agt-panel/lib/firebase-auth"
import { collection, query, onSnapshot } from "firebase/firestore"

interface Book {
  id: string
  title: string
  author: string
  category: string
  interestCount: number
  isAvailable: boolean
}

export default function InterestAnalytics() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "books"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        author: doc.data().author,
        category: doc.data().category,
        interestCount: doc.data().interestCount || 0,
        isAvailable: doc.data().isAvailable
      })) as Book[]
      setBooks(booksData)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching books for analytics:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const totalInterests = books.reduce((sum, book) => sum + book.interestCount, 0)
  const avgInterestsPerBook = books.length > 0 ? Math.round(totalInterests / books.length) : 0
  const topBook = books.length > 0
    ? books.reduce((prev, current) => (current.interestCount > prev.interestCount ? current : prev))
    : null

  // Calculate category distribution
  const categoryData = books.reduce((acc, book) => {
    acc[book.category] = (acc[book.category] || 0) + book.interestCount
    return acc
  }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interest Analytics</h1>
        <p className="text-muted-foreground mt-1">Real-time insights into reader preferences and trends.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interests</p>
                <h3 className="text-4xl font-bold mt-2 text-primary">{totalInterests}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-xs text-green-600 bg-green-500/10 w-fit px-2 py-1 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span className="font-medium">Real-time updates</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. per Book</p>
                <h3 className="text-4xl font-bold mt-2">{avgInterestsPerBook}</h3>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Across {books.length} active books in library
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Performer</p>
                {topBook ? (
                  <h3 className="text-2xl font-bold mt-2 truncate max-w-[180px]" title={topBook.title}>{topBook.title}</h3>
                ) : (
                  <h3 className="text-xl font-bold mt-2 text-muted-foreground">No Data</h3>
                )}
              </div>
              <div className="p-2 bg-amber-500/10 rounded-full text-amber-500">
                <Award className="h-5 w-5" />
              </div>
            </div>
            {topBook && (
              <p className="text-sm text-muted-foreground mt-4">
                <span className="font-semibold text-foreground">{topBook.interestCount}</span> interests generated
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Books Leaderboard */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Top Books by Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {books.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No data available</p>
              ) : (
                [...books]
                  .sort((a, b) => b.interestCount - a.interestCount)
                  .slice(0, 5) // Show top 5
                  .map((book, index) => (
                    <div key={book.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-slate-100 text-slate-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'}
                      `}>
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <p className="font-semibold truncate">{book.title}</p>
                          <span className="font-mono text-sm font-medium">{book.interestCount}</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${topBook ? (book.interestCount / topBook.interestCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Category Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {sortedCategories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No data available</p>
              ) : (
                sortedCategories.map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">{totalInterests > 0 ? Math.round((category.value / totalInterests) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${index % 3 === 0 ? 'bg-blue-500' : index % 3 === 1 ? 'bg-purple-500' : 'bg-pink-500'
                          }`}
                        style={{ width: `${totalInterests > 0 ? (category.value / totalInterests) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-border/50">
              <h4 className="text-sm font-semibold mb-4">Status Overview</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">65%</div>
                  <div className="text-xs text-muted-foreground">Conversion Rate</div>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">24h</div>
                  <div className="text-xs text-muted-foreground">Avg. Response</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

