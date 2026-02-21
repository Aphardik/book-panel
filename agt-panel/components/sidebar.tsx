"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogOut, Moon, Sun, LayoutDashboard, BookOpen, BookPlus, Heart, Tags, Languages, ShoppingCart, Users, Activity, ChevronLeft, ChevronRight } from "lucide-react"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { useCart } from "@/agt-panel/lib/cart-context"
import { cn } from "@/agt-panel/lib/utils"
import { useIsMobile } from "@/agt-panel/hooks/use-mobile"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/agt-panel/components/ui/alert-dialog"
import { Button } from "@/agt-panel/components/ui/button"

interface SidebarProps {
  isAdmin: boolean
  userName?: string
  isOpen?: boolean
  onToggle?: () => void
}

interface MenuItem {
  href: string
  label: string
  icon: any
  badge?: string | number
}

export default function Sidebar({ isAdmin, userName, isOpen: controlledIsOpen, onToggle }: SidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const isMobile = useIsMobile()
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = onToggle || setInternalIsOpen

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && internalIsOpen) {
      setInternalIsOpen(false)
    }
  }, [pathname, isMobile])

  // Initial check for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setInternalIsOpen(false)
      } else {
        setInternalIsOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const { cart } = useCart()
  const cartCount = cart.length

  const adminMenuItems: MenuItem[] = [
    { href: "/agt-panel/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agt-panel/admin/books", label: "Books", icon: BookOpen },
    { href: "/agt-panel/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/agt-panel/admin/readers", label: "Readers", icon: Users },
    { href: "/agt-panel/admin/activity-logs", label: "Activity Logs", icon: Activity },
    { href: "/agt-panel/admin/categories", label: "Categories", icon: Tags },
    { href: "/agt-panel/admin/languages", label: "Languages", icon: Languages },
  ]

  const readerMenuItems: MenuItem[] = [
    { href: "/books", label: "Browse Books", icon: BookOpen },
    { href: "/cart", label: "My Cart", icon: ShoppingCart, badge: cartCount > 0 ? cartCount : undefined },
  ]

  const menuItems = isAdmin ? adminMenuItems : readerMenuItems

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-primary text-white p-2 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Backdrop */}
      {isAdmin && !isOpen && isMobile ? null : (
        isOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )
      )}

      <aside
        className={cn(
          "h-screen bg-card border-r border-border/50 transition-all duration-300 z-40 font-sans flex flex-col shadow-xl md:shadow-none shrink-0 overflow-y-auto overflow-x-hidden",
          "fixed left-0 top-0 md:relative md:left-auto md:top-auto",
          isOpen ? "w-64" : "w-20 -translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "p-4 bg-secondary border-b border-border/50 flex items-center min-h-[73px]",
          isOpen ? "justify-between" : "justify-center"
        )}>
          {isOpen && (
            <Link href="/agt-panel/" className="flex pl-10 items-center justify-center gap-2 overflow-hidden">

              <span className={cn(
                "text-lg font-black text-center tracking-tighter whitespace-nowrap transition-all duration-300",
                isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                AGT BOOK
              </span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (isMobile) setIsOpen(false)
                }}
                className={cn(
                  "flex items-center gap-4 px-3 py-2 rounded transition-all group relative",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <IconComponent size={22} className="flex-shrink-0" />
                <span className={cn(
                  "text-sm font-bold whitespace-nowrap transition-all duration-300",
                  isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
                )}>
                  {item.label}
                </span>

                {item.badge !== undefined && (
                  <span className={cn(
                    "bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded ml-auto transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0"
                  )}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="absolute left-16 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border/50 p-2 space-y-1">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-4 px-3 py-3 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative"
          >
            {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
            <span className={cn(
              "text-sm font-bold transition-all duration-300",
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none w-0"
            )}>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
            {!isOpen && (
              <div className="absolute left-16 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </div>
            )}
          </button>

          {/* Logout */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-4 px-3 py-3 rounded text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors group relative"
              >
                <LogOut size={22} />
                <span className={cn(
                  "text-sm font-bold transition-all duration-300",
                  isOpen ? "opacity-100" : "opacity-0 pointer-events-none w-0"
                )}>
                  Logout
                </span>
                {!isOpen && (
                  <div className="absolute left-16 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Logout
                  </div>
                )}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be signed out of your account and redirected to the home page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700 rounded">
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* User Info / Super Admin Badge */}
          {userName && (
            <div className={cn(
              "mt-4 p-3 rounded bg-secondary text-foreground/70 flex items-center gap-3 transition-all duration-300",
              !isOpen ? "justify-center px-0 h-12" : "h-16"
            )}>
              <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center font-black shrink-0">
                {userName[0].toUpperCase()}
              </div>
              <div className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                <p className="text-xs font-black  truncate leading-tight">{userName}</p>
                <p className="text-[10px] font-black  uppercase tracking-widest mt-0.5">Super Admin</p>
              </div>
            </div>
          )}
        </div>
      </aside>

    </>
  )
}

