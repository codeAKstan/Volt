"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, Filter, Loader2, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { notificationApi } from "@/lib/api-client"

export default function NotificationsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [notificationType, setNotificationType] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Fetch notifications from the API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await notificationApi.getByUser(user.id)
        setNotifications(data)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast.error("Failed to load notifications")
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(user.id, notificationId)
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  // Handle marking all notifications as read
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

  // Handle deleting a notification
  const handleDeleteNotification = async (notificationId) => {
    // In a real app, you would call an API to delete the notification
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
    toast.success("Notification deleted")
  }

  // Filter notifications based on search, type, and tab
  const filteredNotifications = notifications.filter((notification) => {
    // Filter by tab (all/unread)
    if (activeTab === "unread" && notification.read) {
      return false
    }

    // Filter by search query
    if (
      searchQuery &&
      !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Filter by notification type
    if (notificationType !== "all" && notification.type !== notificationType) {
      return false
    }

    return true
  })

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  // Get notification type badge
  const getNotificationBadge = (type) => {
    switch (type) {
      case "booking_confirmation":
        return <Badge className="bg-green-500">Confirmation</Badge>
      case "booking_reminder":
        return <Badge className="bg-blue-500">Reminder</Badge>
      case "booking_cancellation":
        return <Badge className="bg-red-500">Cancellation</Badge>
      case "system_announcement":
        return <Badge className="bg-yellow-500">System</Badge>
      case "feature_announcement":
        return <Badge className="bg-purple-500">Feature</Badge>
      default:
        return <Badge>Notification</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">Stay updated with your workspace activities</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search notifications..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={notificationType} onValueChange={setNotificationType}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Notification type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
            <SelectItem value="booking_reminder">Booking Reminder</SelectItem>
            <SelectItem value="booking_cancellation">Booking Cancellation</SelectItem>
            <SelectItem value="system_announcement">System Announcement</SelectItem>
            <SelectItem value="feature_announcement">Feature Announcement</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSearchQuery("")
            setNotificationType("all")
          }}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={notification.read ? "bg-card" : "bg-muted/20 border-primary/20"}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          {getNotificationBadge(notification.type)}
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-8 px-2"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark as read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{notification.message}</p>
                    </CardContent>
                    {notification.bookingId && (
                      <CardFooter>
                        <Button variant="outline" size="sm" className="ml-auto">
                          View Booking
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No notifications found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || notificationType
                  ? "Try adjusting your filters"
                  : "You don't have any notifications yet"}
              </p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="unread" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-muted/20 border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          {getNotificationBadge(notification.type)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-8 px-2"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark as read
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{notification.message}</p>
                    </CardContent>
                    {notification.bookingId && (
                      <CardFooter>
                        <Button variant="outline" size="sm" className="ml-auto">
                          View Booking
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No unread notifications</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || notificationType
                  ? "Try adjusting your filters"
                  : "You don't have any unread notifications"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
