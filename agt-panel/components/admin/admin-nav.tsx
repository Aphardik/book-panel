"use client"

import { Button } from "@/agt-panel/components/ui/button"
import Link from "next/link"

interface AdminNavProps {
  activeTab: "books" | "analytics"
  setActiveTab: (tab: "books" | "analytics") => void
}

export default function AdminNav({ activeTab, setActiveTab }: AdminNavProps) {
  return (
    <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/agt-panel/">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              AGT Books Admin
            </div>
          </Link>
          <Link href="/agt-panel/reader">
            <Button variant="outline" size="sm">
              Switch to Reader View
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "books" ? "default" : "outline"}
            onClick={() => setActiveTab("books")}
            className="gap-2"
          >
            📖 Books
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
            className="gap-2"
          >
            📊 Analytics
          </Button>
        </div>
      </div>
    </nav>
  )
}

