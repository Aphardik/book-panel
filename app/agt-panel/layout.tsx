import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/agt-panel/lib/auth-context"
import { CartProvider } from "@/agt-panel/lib/cart-context"
import { Toaster } from "@/agt-panel/components/ui/toaster"
import "./globals.css"
// Google Fonts are loaded via <link> tags in RootLayout head

export const metadata: Metadata = {
  title: "AGT Book - Book Interest System",
  description: "Manage book distribution and track reader interests",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <div className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <CartProvider>
              {children}
              <Analytics />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </div>
    </>
  )
}

