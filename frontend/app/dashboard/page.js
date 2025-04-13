"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { parseISO, isToday } from "date-fns"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookingCard } from "@/components/dashboard/booking-card"
import { WorkspaceCard } from "@/components/dashboard/workspace-card"
import { Clock, Plus, Users, LayoutDashboard, Loader2, Calendar } from "lucide-react"
import { bookingApi, workspaceApi } from "@/lib/api"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [greeting, setGreeting] = useState("")
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    availableSpaces: 0,
    peakHours: "N/A",
    activeUsers: 0,
  })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch bookings
        let bookingsData = []
        if (user?.role === "ADMIN") {
          bookingsData = await bookingApi.getAll()
        } else {
          bookingsData = await bookingApi.getByUser(user.id)
        }

        // Fetch workspaces
        const workspacesData = await workspaceApi.getAll()

        // Calculate stats
        const upcomingBookings = bookingsData.filter(
          (b) => b.status === "confirmed" && !isToday(parseISO(b.date)) && parseISO(b.date) >= new Date(),
        ).length

        const availableSpaces = workspacesData.filter((w) => w.available).length

        // For demo purposes, we'll use mock data for peak hours and active users
        const peakHours = "10 AM - 2 PM"
        const activeUsers = 42

        setBookings(bookingsData)
        setWorkspaces(workspacesData)
        setStats({
          totalBookings: upcomingBookings,
          availableSpaces,
          peakHours,
          activeUsers,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Get upcoming bookings
  const upcomingBookings = bookings
    .filter((b) => b.status === "confirmed" && parseISO(b.date) >= new Date())
    .sort((a, b) => {
      // Sort by date and time
      const dateA = parseISO(`${a.date}T${a.startTime}`)
      const dateB = parseISO(`${b.date}T${b.startTime}`)
      return dateA - dateB
    })
    .slice(0, 3) // Get only the first 3

  // Get available workspaces
  const availableWorkspaces = workspaces.filter((w) => w.available).slice(0, 3) // Get only the first 3

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingApi.cancel(bookingId)

      // Update the local state
      setBookings((prev) =>
        prev.map((booking) => (booking.id === bookingId ? { ...booking, status: "cancelled" } : booking)),
      )
    } catch (error) {
      console.error("Error cancelling booking:", error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {greeting}, {user?.first_name || user?.firstName || "User"}!
          </h2>
          <p className="text-muted-foreground">
            Here's what's happening with your workspace today.
            {user?.role && <span className="ml-1 font-medium">({user.role})</span>}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/dashboard/workspaces")}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Bookings",
            value: stats.totalBookings,
            description: "Upcoming",
            icon: Calendar,
          },
          {
            title: "Available Spaces",
            value: stats.availableSpaces,
            description: `Out of ${workspaces.length}`,
            icon: LayoutDashboard,
          },
          {
            title: "Peak Hours",
            value: stats.peakHours,
            description: "Most busy",
            icon: Clock,
          },
          {
            title: "Active Users",
            value: stats.activeUsers,
            description: "This week",
            icon: Users,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
            <TabsTrigger value="available">Available Workspaces</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <BookingCard
                      booking={booking}
                      onCancel={() => handleCancelBooking(booking.id)}
                      isToday={isToday(parseISO(booking.date))}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No upcoming bookings</h3>
                <p className="mt-2 text-sm text-muted-foreground">You don't have any upcoming bookings</p>
                <Button className="mt-4" onClick={() => router.push("/dashboard/workspaces")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Book a workspace
                </Button>
              </div>
            )}

            {upcomingBookings.length > 0 && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push("/dashboard/bookings")}>
                  View all bookings
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="available" className="space-y-4">
            {availableWorkspaces.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableWorkspaces.map((workspace, index) => (
                  <motion.div
                    key={workspace.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <WorkspaceCard workspace={workspace} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <LayoutDashboard className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No available workspaces</h3>
                <p className="mt-2 text-sm text-muted-foreground">All workspaces are currently booked</p>
              </div>
            )}

            {availableWorkspaces.length > 0 && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push("/dashboard/workspaces")}>
                  View all workspaces
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>Personalized workspace suggestions based on your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="mt-1">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Workspace Suggestion</p>
                    <p className="text-sm text-muted-foreground">
                      Based on your past preferences, the East Wing Desk 7 is available at your usual time this week.
                      Would you like to book it?
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => router.push("/dashboard/bookings/new?workspace=7")}
                    >
                      Book Now
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/workspaces")}>
                      Show Alternatives
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
