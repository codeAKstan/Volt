"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, BarChart3, PieChart, TrendingUp, Users } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { bookingApi } from "@/lib/api"
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

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [timeRange, setTimeRange] = useState("month")

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const data = await bookingApi.getAnalytics()
        setAnalyticsData(data)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

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

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Users className="mb-4 h-12 w-12 text-muted-foreground" />
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Bookings",
            value: analyticsData?.totalBookings || 0,
            description: "All time",
            icon: BarChart3,
          },
          {
            title: "Peak Hours",
            value: analyticsData?.peakHours !== undefined ? `${analyticsData.peakHours}:00` : "N/A",
            description: "Most busy time",
            icon: TrendingUp,
          },
          {
            title: "Total Workspaces",
            value: analyticsData?.totalWorkspaces || 0,
            description: "Available for booking",
            icon: Users,
          },
          {
            title: "Average Occupancy",
            value: analyticsData?.occupancyByDate
              ? `${Math.round(Object.values(analyticsData.occupancyByDate).reduce((a, b) => a + b, 0) / Object.values(analyticsData.occupancyByDate).length)}%`
              : "0%",
            description: "Across all spaces",
            icon: PieChart,
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
      </Tabs>
    </div>
  )
}
