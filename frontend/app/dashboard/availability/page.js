"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { workspaceApi, bookingApi } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, CalendarIcon, Search, Clock, MapPin, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AvailabilityPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState([])
  const [bookings, setBookings] = useState([])
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState("week")
  const [searchQuery, setSearchQuery] = useState("")
  const [spaceType, setSpaceType] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("")

  // Fetch workspaces and bookings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch workspaces
        const workspacesData = await workspaceApi.getAll()
        setWorkspaces(workspacesData)

        // Fetch bookings
        const bookingsData = await bookingApi.getAll()
        setBookings(bookingsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load availability data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter workspaces based on search, type, location, and capacity
  const filteredWorkspaces = workspaces.filter((workspace) => {
    // Filter by search query
    if (
      searchQuery &&
      !workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !workspace.type.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Filter by space type
    if (spaceType && spaceType !== "all" && workspace.type !== spaceType) {
      return false
    }

    // Filter by location
    if (location && location !== "all" && workspace.location !== location) {
      return false
    }

    // Filter by capacity
    if (capacity && capacity !== "any") {
      const minCapacity = Number.parseInt(capacity)
      if (!workspace.capacity || workspace.capacity < minCapacity) {
        return false
      }
    }

    return true
  })

  // Get unique locations for filter
  const locations = [...new Set(workspaces.map((w) => w.location))]

  // Get days for week view
  const daysInWeek = eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: addDays(startOfWeek(date, { weekStartsOn: 1 }), 6),
  })

  // Check if a workspace is available on a specific date and time slot
  const isWorkspaceAvailable = (workspace, checkDate, timeSlot) => {
    const dateStr = format(checkDate, "yyyy-MM-dd")

    // Find bookings for this workspace on this date
    const workspaceBookings = bookings.filter(
      (booking) => booking.workspaceId === workspace.id && booking.date === dateStr && booking.status !== "cancelled",
    )

    // Check if any booking overlaps with the time slot
    for (const booking of workspaceBookings) {
      const bookingStart = booking.startTime
      const bookingEnd = booking.endTime

      if (
        (timeSlot.start >= bookingStart && timeSlot.start < bookingEnd) ||
        (timeSlot.end > bookingStart && timeSlot.end <= bookingEnd) ||
        (timeSlot.start <= bookingStart && timeSlot.end >= bookingEnd)
      ) {
        return false
      }
    }

    return true
  }

  // Generate time slots for the day
  const timeSlots = [
    { label: "8:00 - 9:00", start: "08:00", end: "09:00" },
    { label: "9:00 - 10:00", start: "09:00", end: "10:00" },
    { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
    { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
    { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
    { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
    { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
    { label: "15:00 - 16:00", start: "15:00", end: "16:00" },
    { label: "16:00 - 17:00", start: "16:00", end: "17:00" },
    { label: "17:00 - 18:00", start: "17:00", end: "18:00" },
  ]

  // Handle booking a workspace
  const handleBookWorkspace = (workspace) => {
    router.push(`/dashboard/bookings/new?workspace=${workspace.id}`)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-1 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Availability Dashboard</h2>
          <p className="text-muted-foreground">Real-time overview of workspace availability</p>
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="list">List View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine your workspace search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search workspaces..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={spaceType} onValueChange={setSpaceType}>
              <SelectTrigger>
                <SelectValue placeholder="Space type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="desk">Desk</SelectItem>
                <SelectItem value="meeting">Meeting Room</SelectItem>
                <SelectItem value="conference">Conference Room</SelectItem>
                <SelectItem value="phone">Phone Booth</SelectItem>
                <SelectItem value="event">Event Hall</SelectItem>
              </SelectContent>
            </Select>

            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={capacity} onValueChange={setCapacity}>
              <SelectTrigger>
                <SelectValue placeholder="Capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any capacity</SelectItem>
                <SelectItem value="1">1+ person</SelectItem>
                <SelectItem value="2">2+ people</SelectItem>
                <SelectItem value="4">4+ people</SelectItem>
                <SelectItem value="8">8+ people</SelectItem>
                <SelectItem value="12">12+ people</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSpaceType("")
                setLocation("")
                setCapacity("")
              }}
              className="mr-2"
            >
              Reset Filters
            </Button>
            <Button>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={view} value={view} onValueChange={setView}>
        <TabsList className="mb-4">
          <TabsTrigger value="day">Day View</TabsTrigger>
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="day">
          <Card>
            <CardHeader>
              <CardTitle>Day View - {format(date, "EEEE, MMMM d, yyyy")}</CardTitle>
              <CardDescription>Availability by time slot for each workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b p-2 text-left font-medium">Workspace</th>
                      {timeSlots.map((slot) => (
                        <th key={slot.label} className="border-b p-2 text-center font-medium">
                          {slot.label}
                        </th>
                      ))}
                      <th className="border-b p-2 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkspaces.length > 0 ? (
                      filteredWorkspaces.map((workspace) => (
                        <motion.tr
                          key={workspace.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-muted/50"
                        >
                          <td className="border-b p-2">
                            <div className="font-medium text-lg text-gray-900">{workspace.name}</div>
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <MapPin className="mr-1 h-4 w-4" />
                              {workspace.location}
                            </div>
                          </td>
                          {timeSlots.map((slot) => {
                            const isAvailable = isWorkspaceAvailable(workspace, date, slot)
                            return (
                              <td key={`${workspace.id}-${slot.label}`} className="border-b p-2 text-center">
                                <Badge
                                  variant={isAvailable ? "outline" : "secondary"}
                                  className={isAvailable ? "bg-green-500/10 hover:bg-green-500/20 text-green-600" : ""}
                                >
                                  {isAvailable ? "Available" : "Booked"}
                                </Badge>
                              </td>
                            )
                          })}
                          <td className="border-b p-2 text-center">
                            <Button size="sm" onClick={() => handleBookWorkspace(workspace)}>
                              Book
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={timeSlots.length + 2} className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center py-4">
                            <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">No workspaces found</h3>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your filters to find available workspaces
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>
                Week View - {format(daysInWeek[0], "MMMM d")} - {format(daysInWeek[6], "MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>Availability by day for each workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b p-2 text-left font-medium">Workspace</th>
                      {daysInWeek.map((day) => (
                        <th key={day.toString()} className="border-b p-2 text-center font-medium">
                          {format(day, "EEE")}
                          <br />
                          {format(day, "MMM d")}
                        </th>
                      ))}
                      <th className="border-b p-2 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkspaces.length > 0 ? (
                      filteredWorkspaces.map((workspace) => (
                        <motion.tr
                          key={workspace.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-muted/50"
                        >
                          <td className="border-b p-2">
                            <div className="font-medium">{workspace.name}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Badge variant="outline" className="mr-1">
                                {workspace.type.charAt(0).toUpperCase() + workspace.type.slice(1)}
                              </Badge>
                              <MapPin className="ml-1 mr-0.5 h-3 w-3" />
                              {workspace.location}
                            </div>
                          </td>
                          {daysInWeek.map((day) => {
                            // For week view, we'll check if the workspace is available for at least half of the day
                            const morningAvailable = isWorkspaceAvailable(workspace, day, {
                              start: "09:00",
                              end: "12:00",
                            })
                            const afternoonAvailable = isWorkspaceAvailable(workspace, day, {
                              start: "13:00",
                              end: "17:00",
                            })

                            let status = "Fully Available"
                            let variant = "outline"
                            let className = "bg-green-500/10 hover:bg-green-500/20 text-green-600"

                            if (!morningAvailable && !afternoonAvailable) {
                              status = "Fully Booked"
                              variant = "secondary"
                              className = ""
                            } else if (!morningAvailable) {
                              status = "PM Available"
                              variant = "outline"
                              className = "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600"
                            } else if (!afternoonAvailable) {
                              status = "AM Available"
                              variant = "outline"
                              className = "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600"
                            }

                            return (
                              <td key={`${workspace.id}-${day.toString()}`} className="border-b p-2 text-center">
                                <Badge variant={variant} className={className}>
                                  {status}
                                </Badge>
                              </td>
                            )
                          })}
                          <td className="border-b p-2 text-center">
                            <Button size="sm" onClick={() => handleBookWorkspace(workspace)}>
                              Book
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={daysInWeek.length + 2} className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center py-4">
                            <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">No workspaces found</h3>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your filters to find available workspaces
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkspaces.length > 0 ? (
              filteredWorkspaces.map((workspace, index) => {
                // For list view, we'll check if the workspace is available for the selected date
                const isAvailableToday = timeSlots.some((slot) => isWorkspaceAvailable(workspace, date, slot))

                // Count available time slots
                const availableSlots = timeSlots.filter((slot) => isWorkspaceAvailable(workspace, date, slot)).length

                return (
                  <motion.div
                    key={workspace.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{workspace.name}</CardTitle>
                          <Badge
                            variant={isAvailableToday ? "outline" : "secondary"}
                            className={isAvailableToday ? "bg-green-500/10 text-green-600" : ""}
                          >
                            {isAvailableToday ? "Available" : "Fully Booked"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {workspace.type.charAt(0).toUpperCase() + workspace.type.slice(1)} in {workspace.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="mr-2 h-4 w-4" />
                            <span>{workspace.location}</span>
                          </div>
                          {workspace.capacity && (
                            <div className="flex items-center text-muted-foreground">
                              <Users className="mr-2 h-4 w-4" />
                              <span>Capacity: {workspace.capacity}</span>
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>
                              {availableSlots} of {timeSlots.length} time slots available
                            </span>
                          </div>
                          {workspace.hourlyRate && (
                            <div className="flex items-center text-muted-foreground">
                              <span className="font-medium">${workspace.hourlyRate}/hour</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {workspace.amenities &&
                              workspace.amenities.map((amenity, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-4 pt-0">
                        <Button
                          className="w-full"
                          onClick={() => handleBookWorkspace(workspace)}
                          disabled={!isAvailableToday}
                        >
                          {isAvailableToday ? "Book Now" : "Unavailable Today"}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Search className="mb-2 h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-semibold">No workspaces found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters to find available workspaces
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
