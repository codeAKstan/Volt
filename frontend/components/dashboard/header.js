"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, Search, User, Settings, HelpCircle, Sun, Moon, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { useTheme } from "next-themes"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(3)

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    const path = pathname.split("/").filter(Boolean)
    if (path.length > 1) {
      return path[1].charAt(0).toUpperCase() + path[1].slice(1).replace(/-/g, " ")
    }
    return ""
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold md:text-2xl">{getPageTitle()}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Search Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Desktop Search */}
          <div className="relative hidden md:flex">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-[200px] pl-8 md:w-[240px] lg:w-[320px]" />
          </div>

          {/* Mobile Search Expanded */}
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              className="absolute inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-background px-4 md:hidden"
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search..." className="w-full pl-8" autoFocus />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
                Cancel
              </Button>
            </motion.div>
          )}

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
            {showNotifications && (
              <NotificationCenter
                onClose={() => setShowNotifications(false)}
                onMarkAllAsRead={() => setUnreadCount(0)}
              />
            )}
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {theme === "light" ? (
                    <Sun className="h-5 w-5" />
                  ) : theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Laptop className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.profileImage || user?.avatar || "/placeholder.svg"}
                    alt={user?.firstName || "User"}
                  />
                  <AvatarFallback>
                    {user?.firstName?.[0] || "U"}
                    {user?.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
