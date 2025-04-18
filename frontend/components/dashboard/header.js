"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, Search, X, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
// import { SidebarTrigger } from "@/components/ui/sidebar"
import { notificationApi } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      try {
        const data = await notificationApi.getByUser(user.id)
        setNotifications(data)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user])

  const unreadNotifications = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(user.id, id)
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((n) => !n.read)
      for (const notification of unreadNotifications) {
        await notificationApi.markAsRead(user.id, notification.id)
      }

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    const path = pathname.split("/").pop()
    if (!path) return "Dashboard"
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U"

    const firstName = user.first_name || user.firstName || ""
    const lastName = user.last_name || user.lastName || ""

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Get notification badge based on type
  const getNotificationBadge = (type) => {
    switch (type) {
      case "booking_confirmation":
        return <Badge className="bg-green-500">Confirmed</Badge>
      case "booking_reminder":
        return <Badge className="bg-blue-500">Reminder</Badge>
      case "booking_cancellation":
        return <Badge className="bg-red-500">Cancelled</Badge>
      case "booking_conflict":
        return <Badge className="bg-orange-500">Conflict</Badge>
      default:
        return <Badge>Notification</Badge>
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* <SidebarTrigger className="md:hidden" /> */}
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] pl-8 md:w-[300px] lg:w-[400px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <Search className="h-5 w-5" />
          </Button>

          {/* Mobile Search Input */}
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              className="absolute inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-background px-4 md:hidden"
            >
              <Input
                type="search"
                placeholder="Search..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs font-normal"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingNotifications ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                  <span className="text-sm">Loading notifications...</span>
                </div>
              ) : notifications.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex cursor-pointer flex-col items-start p-4 focus:bg-accent"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="mb-1 flex w-full justify-between">
                        <span className="font-medium">{notification.title}</span>
                        {!notification.read && (
                          <Badge variant="default" className="ml-2">
                            New
                          </Badge>
                        )}
                        {getNotificationBadge(notification.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  {notifications.length > 5 && (
                    <div className="p-2 text-center">
                      <Link href="/dashboard/notifications" className="text-xs text-primary hover:underline">
                        View all {notifications.length} notifications
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications" className="cursor-pointer justify-center">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <ModeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.profileImage || user?.avatar || "/placeholder.svg"}
                    alt={user?.first_name || user?.firstName || "User"}
                  />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.first_name || user?.firstName} {user?.last_name || user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      {typeof user.role === "string" ? user.role.toUpperCase() : user.role}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              {(user?.role === "ADMIN" || user?.role === "admin") && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/analytics">Analytics Dashboard</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={logout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
