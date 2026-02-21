"use client"
import { useState } from "react"
import { useAuth } from "@/agt-panel/lib/auth-context"
import Sidebar from "@/agt-panel/components/sidebar"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/agt-panel/components/ui/button"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading } = useAuth()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Exclude login page from sidebar layout
    if (pathname === "/agt-panel/admin/login") {
        return <>{children}</>
    }

    // Show loading state while checking auth
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <div className="flex w-full h-screen overflow-hidden bg-background">
            <Sidebar
                isAdmin={true}
                userName={user?.email || "Admin"}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
                <main className="flex-1 py-6 px-2 overflow-y-auto overflow-x-hidden transition-all duration-300">
                    {children}
                </main>
            </div>
        </div>
    )
}

