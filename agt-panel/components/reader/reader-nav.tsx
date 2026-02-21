"use client"

import { Button } from "@/agt-panel/components/ui/button"
import Link from "next/link"

interface ReaderNavProps {
  activeTab: "browse" | "interests"
  setActiveTab: (tab: "browse" | "interests") => void
}

export default function ReaderNav({ activeTab, setActiveTab }: ReaderNavProps) {
  return (
    <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/agt-panel/">
            <div className="text-2xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              AGT Books
            </div>
          </Link>
          <Link href="/agt-panel/admin">
            <Button variant="outline" size="sm">
              Switch to Admin
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "browse" ? "default" : "outline"}
            onClick={() => setActiveTab("browse")}
            className="gap-2"
          >
            📚 Browse Books
          </Button>
          <Button
            variant={activeTab === "interests" ? "default" : "outline"}
            onClick={() => setActiveTab("interests")}
            className="gap-2"
          >
            ♥️ My Interests
          </Button>
        </div>
      </div>
    </nav>
  )
}

