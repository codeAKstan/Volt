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
import { bookingApi, workspaceApi, userApi } from "@/lib/api-client"
import { toast } from "sonner"

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
    activeUsers: "N/A",
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
        if (user) {
          if (user.role === "ADMIN" || user.role === "admin") {
            bookingsData = await bookingApi.getAll()
          } else {
            bookingsData = await bookingApi.getByUser(user.id)
          }
        }

        // Fetch workspaces
        const workspacesData = await workspaceApi.getAll()
        
        // Fetch all users if admin
        let usersData = []
        if (user && (user.role === "ADMIN" || user.role === "admin")) {
          usersData = await userApi.getAll()
        } else {
          // If user is not admin, set activeUsers to N/A
          usersData = []
        }

        // Calculate stats
        const upcomingBookings = bookingsData.filter(
          (b) => b.status === "confirmed" && !isToday(parseISO(b.date)) && parseISO(b.date) >= new Date(),
        ).length

        const availableSpaces = workspacesData.filter((w) => w.available).length

        // Calculate active users (total users)
        const activeUsers = user && (user.role === "ADMIN" || user.role === "admin") ? usersData.length : "N/A"

        // For demo purposes, we'll use mock data for peak hours
        const peakHours = "10 AM - 2 PM"

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
        toast.error("Failed to load dashboard data")
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

      toast.success("Booking cancelled successfully")
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast.error("Failed to cancel booking")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{greeting}, {user?.first_name || user?.firstName || "User"}!</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your workspace today.
            </p>
          </div>

          <Button className="w-full gap-2 sm:w-auto" onClick={() => router.push("/dashboard/workspaces")}>
            <Plus size={16} />
            New Booking
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
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
          <Card key={index}>
            <CardContent className="flex flex-col items-center justify-between pt-6">
              <div className="mb-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <stat.icon className="mx-auto mb-2 mt-2 h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{stat.value}</h2>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 sm:mt-8">
        <Tabs defaultValue="bookings">
          <TabsList className="w-full mb-4 sm:mb-6">
            <TabsTrigger value="bookings" className="flex-1">Upcoming Bookings</TabsTrigger>
            <TabsTrigger value="workspaces" className="flex-1">Available Workspaces</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings">
            {upcomingBookings.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {upcomingBookings.map((booking, index) => (
                  <BookingCard 
                    key={booking.id}
                    booking={booking}
                    onCancel={() => handleCancelBooking(booking.id)}
                    isToday={isToday(parseISO(booking.date))}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-center sm:justify-start">
                    <Calendar className="mr-2 h-5 w-5" />
                    <span>No Bookings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center sm:text-left">
                  <h3 className="mb-2 text-lg font-semibold">No upcoming bookings</h3>
                  <p className="mb-4 text-sm text-muted-foreground">You don't have any upcoming bookings</p>
                  <Button className="w-full sm:w-auto" onClick={() => router.push("/dashboard/workspaces")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Book a workspace
                  </Button>
                </CardContent>
              </Card>
            )}

            {upcomingBookings.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/dashboard/bookings")}>
                  View all bookings
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="workspaces">
            {availableWorkspaces.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {availableWorkspaces.map((workspace, index) => (
                  <WorkspaceCard 
                    key={workspace.id}
                    workspace={workspace}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-center sm:justify-start">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    <span>No Spaces</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center sm:text-left">
                  <h3 className="mb-2 text-lg font-semibold">No available workspaces</h3>
                  <p className="mb-4 text-sm text-muted-foreground">All workspaces are currently booked</p>
                </CardContent>
              </Card>
            )}

            {availableWorkspaces.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push("/dashboard/workspaces")}>
                  View all workspaces
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Card className="mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
          <CardDescription>Personalized workspace suggestions based on your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0">
              <div className="flex justify-center sm:block">
                <Avatar>
                  <AvatarFallback>
                    <Clock className="h-4 w-4" />
                  </AvatarFallback>
                  <AvatarImage src="/ai-avatar.png" alt="AI" />
                </Avatar>
              </div>
              <div className="flex-1 space-y-2 rounded-lg bg-muted p-4">
                <div>
                  <h4 className="text-sm font-semibold">Workspace Suggestion</h4>
                  <div className="mt-2 text-sm">
                    <p>Based on your past preferences, the East Wing Desk 7 is available at your usual time this week.
                    Would you like to book it?</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => router.push("/dashboard/bookings/new?workspace=7")}>
                    Book Now
                  </Button>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => router.push("/dashboard/workspaces")}>
                    Show Alternatives
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}