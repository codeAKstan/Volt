"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Building,
  AlertTriangle,
  Search,
  UserPlus,
  User,
  Mail,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { bookingApi, workspaceApi, userApi } from "@/lib/api-client"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"
import { Bar, Pie, Line } from "react-chartjs-2"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { AddWorkspaceModal } from "@/components/dashboard/add-workspace-modal"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [timeRange, setTimeRange] = useState("month")
  const [workspaces, setWorkspaces] = useState([])
  const [bookings, setBookings] = useState([])
  const [users, setUsers] = useState([])
  const [userBookings, setUserBookings] = useState({})
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")

  useEffect(() => {
    // Check if user is admin, if not redirect to dashboard
    if (user && user.role !== "ADMIN" && user.role !== "admin") {
      toast.error("You don't have permission to access this page")
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch workspaces and bookings
        const workspacesData = await workspaceApi.getAll()
        const bookingsData = await bookingApi.getAll()

        // Fetch all users (admin only)
        const usersData = await userApi.getAll()

        setWorkspaces(workspacesData)
        setBookings(bookingsData)
        setUsers(usersData)

        // Calculate analytics data
        const data = calculateAnalytics(workspacesData, bookingsData, usersData, timeRange)
        setAnalyticsData(data)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
        toast.error("Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }

    if (user && (user.role === "ADMIN" || user.role === "admin")) {
      fetchData()
    }
  }, [timeRange, user])

  // Fetch bookings for a specific user when selected
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!selectedUser) return

      try {
        // Check if we already have this user's bookings
        if (userBookings[selectedUser.id]) return

        const bookings = await userApi.getUserBookings(selectedUser.id)
        setUserBookings((prev) => ({
          ...prev,
          [selectedUser.id]: bookings,
        }))
      } catch (error) {
        console.error(`Error fetching bookings for user ${selectedUser.id}:`, error)
        toast.error("Failed to load user bookings")
      }
    }

    fetchUserBookings()
  }, [selectedUser])

  // Calculate analytics data from workspaces, bookings, and users
  const calculateAnalytics = (workspaces, bookings, users, timeRange) => {
    // Filter bookings based on time range
    const now = new Date()
    const filteredBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.date)
      if (timeRange === "week") {
        // Last 7 days
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        return bookingDate >= weekAgo
      } else if (timeRange === "month") {
        // Last 30 days
        const monthAgo = new Date(now)
        monthAgo.setDate(now.getDate() - 30)
        return bookingDate >= monthAgo
      } else if (timeRange === "quarter") {
        // Last 90 days
        const quarterAgo = new Date(now)
        quarterAgo.setDate(now.getDate() - 90)
        return bookingDate >= quarterAgo
      } else if (timeRange === "year") {
        // Last 365 days
        const yearAgo = new Date(now)
        yearAgo.setDate(now.getDate() - 365)
        return bookingDate >= yearAgo
      }
      return true // Default to all bookings
    })

    // Calculate total bookings by workspace type
    const bookingsByType = {}
    workspaces.forEach((workspace) => {
      bookingsByType[workspace.type] = bookingsByType[workspace.type] || 0

      filteredBookings.forEach((booking) => {
        if (booking.workspaceId === workspace.id && booking.status === "confirmed") {
          bookingsByType[workspace.type]++
        }
      })
    })

    // Calculate bookings by hour of day
    const bookingsByHour = Array(24).fill(0)
    filteredBookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        const startHour = Number.parseInt(booking.startTime.split(":")[0])
        const endHour = Number.parseInt(booking.endTime.split(":")[0])

        for (let hour = startHour; hour < endHour; hour++) {
          bookingsByHour[hour]++
        }
      }
    })

    // Calculate occupancy rate by date
    const occupancyByDate = {}
    const dateSet = new Set()

    filteredBookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        dateSet.add(booking.date)
        occupancyByDate[booking.date] = occupancyByDate[booking.date] || 0
        occupancyByDate[booking.date]++
      }
    })

    // Convert to percentage
    Object.keys(occupancyByDate).forEach((date) => {
      occupancyByDate[date] = (occupancyByDate[date] / workspaces.length) * 100
    })

    // Calculate workspace utilization
    const workspaceUtilization = {}
    workspaces.forEach((workspace) => {
      workspaceUtilization[workspace.id] = 0
    })

    filteredBookings.forEach((booking) => {
      if (booking.status === "confirmed" && booking.workspaceId) {
        workspaceUtilization[booking.workspaceId] = (workspaceUtilization[booking.workspaceId] || 0) + 1
      }
    })

    // Find most and least used workspaces
    let mostUsedWorkspaceId = null
    let leastUsedWorkspaceId = null
    let maxUsage = -1
    let minUsage = Number.MAX_SAFE_INTEGER

    Object.entries(workspaceUtilization).forEach(([id, count]) => {
      if (count > maxUsage) {
        maxUsage = count
        mostUsedWorkspaceId = id
      }
      if (count < minUsage && count > 0) {
        minUsage = count
        leastUsedWorkspaceId = id
      }
    })

    const mostUsedWorkspace = workspaces.find((w) => w.id === Number(mostUsedWorkspaceId))
    const leastUsedWorkspace = workspaces.find((w) => w.id === Number(leastUsedWorkspaceId))

    // Find peak hours (hour with most bookings)
    const peakHour = bookingsByHour.indexOf(Math.max(...bookingsByHour))

    // Calculate average booking duration
    let totalDuration = 0
    let bookingCount = 0

    filteredBookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        const startHour = Number.parseInt(booking.startTime.split(":")[0])
        const startMinute = Number.parseInt(booking.startTime.split(":")[1])
        const endHour = Number.parseInt(booking.endTime.split(":")[0])
        const endMinute = Number.parseInt(booking.endTime.split(":")[1])

        const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
        totalDuration += durationMinutes
        bookingCount++
      }
    })

    const avgDurationMinutes = bookingCount > 0 ? Math.round(totalDuration / bookingCount) : 0
    const avgDuration = `${Math.floor(avgDurationMinutes / 60)}h ${avgDurationMinutes % 60}m`

    // Calculate bookings per user
    const bookingsPerUser = {}
    const userLastBooking = {}

    users.forEach((user) => {
      bookingsPerUser[user.id] = 0
      userLastBooking[user.id] = null
    })

    filteredBookings.forEach((booking) => {
      if (booking.userId && booking.status === "confirmed") {
        bookingsPerUser[booking.userId] = (bookingsPerUser[booking.userId] || 0) + 1

        // Track last booking date
        const bookingDate = new Date(booking.date)
        if (!userLastBooking[booking.userId] || bookingDate > new Date(userLastBooking[booking.userId])) {
          userLastBooking[booking.userId] = booking.date
        }
      }
    })

    // Find most active user
    let mostActiveUserId = null
    let maxBookings = -1

    Object.entries(bookingsPerUser).forEach(([userId, count]) => {
      if (count > maxBookings) {
        maxBookings = count
        mostActiveUserId = userId
      }
    })

    const mostActiveUser = users.find((u) => u.id === mostActiveUserId)

    return {
      bookingsByType,
      bookingsByHour,
      occupancyByDate,
      peakHour,
      totalBookings: filteredBookings.filter((b) => b.status === "confirmed").length,
      totalWorkspaces: workspaces.length,
      totalUsers: users.length,
      mostUsedWorkspace: mostUsedWorkspace ? mostUsedWorkspace.name : "N/A",
      leastUsedWorkspace: leastUsedWorkspace ? leastUsedWorkspace.name : "N/A",
      avgDuration,
      dateCount: dateSet.size,
      avgBookingsPerDay: dateSet.size > 0 ? Math.round((filteredBookings.length / dateSet.size) * 10) / 10 : 0,
      bookingsPerUser,
      userLastBooking,
      mostActiveUser: mostActiveUser ? `${mostActiveUser.firstName} ${mostActiveUser.lastName}` : "N/A",
      maxUserBookings: maxBookings > 0 ? maxBookings : 0,
    }
  }

  // Prepare chart data
  const prepareBookingsByTypeChart = () => {
    if (!analyticsData?.bookingsByType) return null

    const types = Object.keys(analyticsData.bookingsByType)
    const counts = types.map((type) => analyticsData.bookingsByType[type])

    return {
      labels: types.map((type) => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          label: "Bookings",
          data: counts,
          backgroundColor: [
            "rgba(147, 51, 234, 0.7)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(239, 68, 68, 0.7)",
          ],
          borderColor: [
            "rgba(147, 51, 234, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }
  }

  const prepareBookingsByHourChart = () => {
    if (!analyticsData?.bookingsByHour) return null

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: "Bookings",
          data: analyticsData.bookingsByHour,
          backgroundColor: "rgba(147, 51, 234, 0.5)",
          borderColor: "rgba(147, 51, 234, 1)",
          borderWidth: 1,
        },
      ],
    }
  }

  const prepareOccupancyChart = () => {
    if (!analyticsData?.occupancyByDate) return null

    const dates = Object.keys(analyticsData.occupancyByDate)
    const rates = dates.map((date) => analyticsData.occupancyByDate[date])

    return {
      labels: dates,
      datasets: [
        {
          label: "Occupancy Rate (%)",
          data: rates,
          fill: false,
          backgroundColor: "rgba(147, 51, 234, 0.2)",
          borderColor: "rgba(147, 51, 234, 1)",
          tension: 0.4,
        },
      ],
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery) return true

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase()
    const email = (user.email || "").toLowerCase()
    const role = (user.role || "").toLowerCase()
    const query = userSearchQuery.toLowerCase()

    return fullName.includes(query) || email.includes(query) || role.includes(query)
  })

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Never"
    try {
      return format(parseISO(dateString), "MMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

  // Handle workspace added
  const handleWorkspaceAdded = (newWorkspace) => {
    setWorkspaces((prev) => [...prev, newWorkspace])
    toast.success("Workspace added successfully!")
  }

  // Check if user is admin
  if (user && user.role !== "ADMIN" && user.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Admin Access Required</h2>
        <p className="mt-2 text-muted-foreground">You need admin privileges to view the analytics dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const bookingsByTypeData = prepareBookingsByTypeChart()
  const bookingsByHourData = prepareBookingsByHourChart()
  const occupancyData = prepareOccupancyChart()

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track workspace usage, peak hours, and occupancy trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 90 days</SelectItem>
              <SelectItem value="year">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
          <AddWorkspaceModal onWorkspaceAdded={handleWorkspaceAdded} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Bookings",
            value: analyticsData?.totalBookings || 0,
            description: `${timeRange === "week" ? "Last 7 days" : timeRange === "month" ? "Last 30 days" : timeRange === "quarter" ? "Last 90 days" : "Last 365 days"}`,
            icon: Calendar,
          },
          {
            title: "Peak Hours",
            value: analyticsData?.peakHour !== undefined ? `${analyticsData.peakHour}:00` : "N/A",
            description: "Most busy time",
            icon: Clock,
          },
          {
            title: "Total Workspaces",
            value: analyticsData?.totalWorkspaces || 0,
            description: "Available for booking",
            icon: Building,
          },
          {
            title: "Total Users",
            value: analyticsData?.totalUsers || 0,
            description: "Registered accounts",
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Most Used Workspace",
            value: analyticsData?.mostUsedWorkspace || "N/A",
            description: "Highest booking frequency",
            icon: TrendingUp,
          },
          {
            title: "Most Active User",
            value: analyticsData?.mostActiveUser || "N/A",
            description: `${analyticsData?.maxUserBookings || 0} bookings`,
            icon: User,
          },
          {
            title: "Average Duration",
            value: analyticsData?.avgDuration || "0h 0m",
            description: "Per booking",
            icon: Clock,
          },
          {
            title: "Average Occupancy",
            value: analyticsData?.occupancyByDate
              ? `${Math.round(Object.values(analyticsData.occupancyByDate).reduce((a, b) => a + b, 0) / Object.values(analyticsData.occupancyByDate).length)}%`
              : "0%",
            description: "Across all spaces",
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

      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Workspace Usage</TabsTrigger>
          <TabsTrigger value="hours">Peak Hours</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy Trends</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bookings by Workspace Type</CardTitle>
              <CardDescription>Distribution of bookings across different workspace types</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {bookingsByTypeData ? (
                <Pie
                  data={bookingsByTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bookings by Hour of Day</CardTitle>
              <CardDescription>Number of bookings during each hour of the day</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {bookingsByHourData ? (
                <Bar
                  data={bookingsByHourData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: "Number of Bookings",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Hour of Day",
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Rate Trends</CardTitle>
              <CardDescription>Percentage of workspaces occupied over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {occupancyData ? (
                <Line
                  data={occupancyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: "Occupancy Rate (%)",
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: "Date",
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </div>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {/* <TableHead>Total Bookings</TableHead>
                      <TableHead>Last Booking</TableHead>
                      <TableHead>Status</TableHead> */}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {user.firstName?.[0] || ""}
                                  {user.lastName?.[0] || ""}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.firstName} {user.lastName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
                          </TableCell>
                          {/* <TableCell>{analyticsData?.bookingsPerUser?.[user.id] || 0}</TableCell>
                          <TableCell>{formatDate(analyticsData?.userLastBooking?.[user.id])}</TableCell> */}
                          {/* <TableCell>
                            <Badge variant={user.is_active ? "success" : "success"}>
                              {user.is_active ? "Active" : "Active"}
                            </Badge>
                          </TableCell> */}
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                              View Bookings
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {selectedUser && (
                <div className="mt-6">
                  <h3 className="mb-4 text-lg font-medium">
                    Bookings for {selectedUser.firstName} {selectedUser.lastName}
                  </h3>

                  {userBookings[selectedUser.id] ? (
                    userBookings[selectedUser.id].length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Workspace</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userBookings[selectedUser.id].map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell>{booking.workspace_name}</TableCell>
                                <TableCell>{formatDate(booking.date)}</TableCell>
                                <TableCell>
                                  {new Date(booking.start_time).toISOString().split("T")[0]} - {
                                    booking.start_time
                                      ? typeof booking.start_time === "string" && booking.start_time.includes("T")
                                        ? booking.start_time.split("T")[1].substring(0, 5)
                                        : booking.start_time
                                      : "09:00"
                                  }
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      booking.status === "confirmed"
                                        ? "success"
                                        : booking.status === "cancelled"
                                          ? "destructive"
                                          : "outline"
                                    }
                                  >
                                    {booking.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed p-8 text-center">
                        <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-2 text-lg font-semibold">No Bookings</h3>
                        <p className="text-sm text-muted-foreground">This user hasn't made any bookings yet.</p>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
