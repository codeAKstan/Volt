"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"
import { notificationApi } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

export function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const data = await notificationApi.getByUser(user.id)
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user])

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(user.id, notificationId)
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)

      for (const notification of unreadNotifications) {
        await notificationApi.markAsRead(user.id, notification.id)
      }

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking_confirmation":
        return <Badge className="bg-green-500">Confirmed</Badge>
      case "booking_reminder":
        return <Badge className="bg-blue-500">Reminder</Badge>
      case "booking_cancellation":
        return <Badge className="bg-red-500">Cancelled</Badge>
      case "booking_rescheduled":
        return <Badge className="bg-yellow-500">Rescheduled</Badge>
      case "booking_conflict":
        return <Badge className="bg-orange-500">Conflict</Badge>
      default:
        return <Badge>Notification</Badge>
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
            <CardDescription>
              {loading
                ? "Loading notifications..."
                : notifications.length === 0
                  ? "No notifications"
                  : `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto p-0">
            <AnimatePresence>
              {notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`p-3 ${notification.read ? "bg-background" : "bg-muted"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="mr-2">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                !loading && (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                )
              )}
            </AnimatePresence>
          </CardContent>
          <CardFooter className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
              Close
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
