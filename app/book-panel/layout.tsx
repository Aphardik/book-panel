import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/book-panel/components/theme-provider"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Ap-forms",
  description: "Generate forms",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={`font-poppins`}>
      <Suspense fallback={null}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Analytics />
        </ThemeProvider>
      </Suspense>
    </div>
  )
}
