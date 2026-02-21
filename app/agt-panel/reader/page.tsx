"use client"

import { useState } from "react"
import ReaderNav from "@/agt-panel/components/reader/reader-nav"
import BookBrowser from "@/agt-panel/components/reader/book-browser"
import MyInterests from "@/agt-panel/components/reader/my-interests"

export default function ReaderDashboard() {
  const [activeTab, setActiveTab] = useState<"browse" | "interests">("browse")

  return (
    <div className="min-h-screen bg-background">
      <ReaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "browse" && <BookBrowser />}
        {activeTab === "interests" && <MyInterests />}
      </div>
    </div>
  )
}

