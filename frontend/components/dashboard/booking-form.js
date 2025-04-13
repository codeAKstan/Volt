"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, addHours, parse, isAfter, isBefore } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Clock, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { workspaceApi, bookingApi } from "@/lib/api-client"

export function BookingForm({ workspaceId, onSuccess }) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [workspace, setWorkspace] = useState(null)
  const [availabilityStatus, setAvailabilityStatus] = useState(null)

  const [formData, setFormData] = useState({
    title: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    attendees: [],
    notes: "",
  })

  const [attendeeEmail, setAttendeeEmail] = useState("")

  // Time slot options
  const timeSlots = []
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour.toString().padStart(2, "0")
      const formattedMinute = minute.toString().padStart(2, "0")
      timeSlots.push(`${formattedHour}:${formattedMinute}`)
    }
  }

  // Load workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const data = await workspaceApi.getById(workspaceId)
        setWorkspace(data)
      } catch (error) {
        console.error("Error fetching workspace:", error)
        toast.error("Failed to load workspace details")
      }
    }

    if (workspaceId) {
      fetchWorkspace()
    }
  }, [workspaceId])

  // Check availability when date or time changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!workspace || !formData.date || !formData.startTime || !formData.endTime) return

      setChecking(true)
      try {
        const formattedDate = format(formData.date, "yyyy-MM-dd")
        const result = await workspaceApi.checkAvailability(
          workspace.id,
          formattedDate,
          formData.startTime,
          formData.endTime,
        )
        setAvailabilityStatus(result)
      } catch (error) {
        console.error("Error checking availability:", error)
        setAvailabilityStatus({ available: false, error: error.message })
      } finally {
        setChecking(false)
      }
    }

    checkAvailability()
  }, [workspace, formData.date, formData.startTime, formData.endTime])

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTimeChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // If start time changes, automatically set end time 1 hour later
    if (name === "startTime") {
      const startDate = parse(value, "HH:mm", new Date())
      const endDate = addHours(startDate, 1)
      const endTime = format(endDate, "HH:mm")

      // Only update if the new end time is valid
      if (timeSlots.includes(endTime)) {
        setFormData((prev) => ({ ...prev, endTime }))
      }
    }
  }

  const addAttendee = () => {
    if (!attendeeEmail) return

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(attendeeEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Check if already added
    if (formData.attendees.includes(attendeeEmail)) {
      toast.error("This attendee is already added")
      return
    }

    setFormData((prev) => ({
      ...prev,
      attendees: [...prev.attendees, attendeeEmail],
    }))
    setAttendeeEmail("")
  }

  const removeAttendee = (email) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((e) => e !== email),
    }))
  }

  const validateForm = () => {
    // Check if title is provided
    if (!formData.title.trim()) {
      toast.error("Please enter a booking title")
      return false
    }

    // Check if date is in the future
    if (isBefore(formData.date, new Date())) {
      toast.error("Please select a future date")
      return false
    }

    // Check if end time is after start time
    const startDateTime = parse(formData.startTime, "HH:mm", new Date())
    const endDateTime = parse(formData.endTime, "HH:mm", new Date())

    if (!isAfter(endDateTime, startDateTime)) {
      toast.error("End time must be after start time")
      return false
    }

    // Check availability
    if (!availabilityStatus?.available) {
      toast.error("This workspace is not available for the selected time")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const bookingData = {
        title: formData.title,
        workspaceId: workspace.id,
        date: format(formData.date, "yyyy-MM-dd"),
        startTime: formData.startTime,
        endTime: formData.endTime,
        attendees: [...formData.attendees, user.email], // Include the current user
        notes: formData.notes,
        userId: user.id,
        workspaceName: workspace.name,
        // Determine if it's a desk or meeting room based on workspace type
        ...(workspace.type === "desk" ? { deskId: workspace.id } : {}),
        ...(workspace.type === "meeting" ? { meetingRoomId: workspace.id } : {}),
      }

      const result = await bookingApi.create(bookingData)

      toast.success("Booking created successfully!")

      if (onSuccess) {
        onSuccess(result)
      } else {
        router.push("/dashboard/bookings")
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error(error.message || "Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book {workspace.name}</CardTitle>
        <CardDescription>
          {workspace.type.charAt(0).toUpperCase() + workspace.type.slice(1)} in {workspace.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Booking Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Team Meeting"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={handleDateChange}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <div className="flex space-x-2">
                <Select value={formData.startTime} onValueChange={(value) => handleTimeChange("startTime", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Start Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={`start-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={formData.endTime} onValueChange={(value) => handleTimeChange("endTime", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="End Time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attendees</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add attendee email"
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
              />
              <Button type="button" onClick={addAttendee}>
                Add
              </Button>
            </div>

            {formData.attendees.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.attendees.map((email) => (
                  <div key={email} className="flex items-center justify-between rounded-md bg-muted p-2 text-sm">
                    <span>{email}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAttendee(email)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional information about this booking"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="rounded-md bg-muted p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Booking Summary</span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="font-medium">Date:</span>{" "}
                {formData.date ? format(formData.date, "PPP") : "Not selected"}
              </p>
              <p>
                <span className="font-medium">Time:</span> {formData.startTime} - {formData.endTime}
              </p>
              <p>
                <span className="font-medium">Workspace:</span> {workspace.name}
              </p>
              <p>
                <span className="font-medium">Location:</span> {workspace.location}
              </p>
              {workspace.capacity && (
                <p>
                  <span className="font-medium">Capacity:</span> {workspace.capacity} people
                </p>
              )}
              <p>
                <span className="font-medium">Rate:</span> ${workspace.hourlyRate}/hour
              </p>

              {checking ? (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking availability...</span>
                </div>
              ) : availabilityStatus ? (
                <div
                  className={`flex items-center space-x-2 ${availabilityStatus.available ? "text-green-500" : "text-red-500"}`}
                >
                  <span className="font-medium">{availabilityStatus.available ? "Available" : "Not available"}</span>
                </div>
              ) : null}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !availabilityStatus?.available}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
