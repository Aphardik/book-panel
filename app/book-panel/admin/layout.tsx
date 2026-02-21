import type { ReactNode } from "react"
import { Sidebar } from "@/book-panel/components/admin/sidebar"
export default async function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex over min-h-dvh">
      <Sidebar />
      <main className="flex-1">
        <section className="mx-auto px-4">{children}</section>
      </main>
    </div>
  )
}


