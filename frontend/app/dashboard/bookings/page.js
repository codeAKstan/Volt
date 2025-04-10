"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { format, parseISO, isBefore, isToday } from "date-fns"
import { CalendarIcon, Filter, Plus, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { bookingApi } from "@/lib/api"
import { BookingCard } from "@/components/dashboard/booking-card"
import { NewBookingModal } from "@/components/dashboard/new-booking-modal"

export default function BookingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [date, setDate] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [spaceType, setSpaceType] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      try {
        let data = []

        if (user?.role === "admin") {
          // Admins can see all bookings
          data = await bookingApi.getAll()
        } else {
          // Regular users only see their own bookings
          data = await bookingApi.getByUser(user.id)
        }

        setBookings(data)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        toast.error("Failed to load bookings")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchBookings()
    }
  }, [user])

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

  // Handle new booking creation
  const handleNewBooking = (newBooking) => {
    setBookings((prev) => [newBooking, ...prev])
  }

  // Filter bookings based on search, date, space type, and tab
  const filteredBookings = bookings.filter((booking) => {
    const now = new Date()
    const bookingDate = parseISO(`${booking.date}T${booking.endTime}:00`)
    const isPast = isBefore(bookingDate, now)

    // Filter by tab (upcoming/past)
    if ((activeTab === "upcoming" && isPast) || (activeTab === "past" && !isPast)) {
      return false
    }

    // Filter cancelled bookings out of upcoming
    if (activeTab === "upcoming" && booking.status === "cancelled") {
      return false
    }

    // Filter by search query
    if (
      searchQuery &&
      !booking.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !booking.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Filter by date
    if (date && booking.date !== format(date, "yyyy-MM-dd")) {
      return false
    }

    // Filter by space type
    if (spaceType && spaceType !== "all" && !booking.workspaceName.toLowerCase().includes(spaceType.toLowerCase())) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
          <p className="text-muted-foreground">Manage your workspace bookings</p>
        </div>
        <NewBookingModal onSuccess={handleNewBooking} />
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bookings..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Button variant="ghost" className="absolute right-2 top-2 h-6 w-6 p-0" onClick={() => setDate(null)}>
              ×
            </Button>
          </PopoverContent>
        </Popover>

        <Select value={spaceType} onValueChange={setSpaceType}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Space type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All spaces</SelectItem>
            <SelectItem value="conference">Conference rooms</SelectItem>
            <SelectItem value="meeting">Meeting rooms</SelectItem>
            <SelectItem value="desk">Desks</SelectItem>
            <SelectItem value="phone">Phone booths</SelectItem>
            <SelectItem value="video">Video conference</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSearchQuery("")
            setDate(null)
            setSpaceType("")
          }}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking, index) => (
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
                <CalendarIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || date || spaceType
                  ? "Try adjusting your filters"
                  : "You don't have any upcoming bookings"}
              </p>
              <NewBookingModal onSuccess={handleNewBooking}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Book a workspace
                </Button>
              </NewBookingModal>
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <BookingCard booking={booking} isPast={true} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <CalendarIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No past bookings</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || date || spaceType ? "Try adjusting your filters" : "You don't have any past bookings"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
