"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Loader2, Users } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function BookingCard({ booking, onCancel, onReschedule, isPast = false, isToday = false }) {
  const [cancelling, setCancelling] = useState(false)

  const formatDate = (dateString) => {
    try {
      const options = { weekday: "short", month: "short", day: "numeric" }
      return format(parseISO(dateString), "EEE, MMM d")
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return dateString || "Unknown date"
    }
  }

  const getStatusBadge = () => {
    if (booking.status === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>
    } else if (isToday) {
      return <Badge className="bg-green-500">Today</Badge>
    } else if (isPast) {
      return <Badge variant="outline">Completed</Badge>
    } else {
      return <Badge variant="outline">Upcoming</Badge>
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await onCancel()
    } finally {
      setCancelling(false)
    }
  }

  // Ensure we have a valid workspace name
  let workspaceName = "Unknown Workspace" // Default value
  if (booking.workspaceName) {
    workspaceName = booking.workspaceName
  } else if (booking.work_space) {
    workspaceName = booking.work_space.name
  } else if (booking.desk) {
    workspaceName = booking.desk.name
  } else if (booking.meeting_room) {
    workspaceName = booking.meeting_room.name
  }

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className={`overflow-hidden h-full flex flex-col ${isToday ? "border-primary" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{booking.title || "Untitled Booking"}</CardTitle>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
              {getStatusBadge()}
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-1">
          <div className="space-y-2 text-sm">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center text-muted-foreground"
            >
              <Badge variant="secondary" className="mr-2">
                {workspaceName}
              </Badge>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center text-muted-foreground"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>{booking.date ? formatDate(booking.date) : "Unknown date"}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center text-muted-foreground"
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>
                {booking.startTime || "00:00"} - {booking.endTime || "00:00"}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-center text-muted-foreground"
            >
              <Users className="mr-2 h-4 w-4" />
              <span>{booking.attendees?.length || 0} attendees</span>
            </motion.div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          {!isPast && booking.status !== "cancelled" && (
            <div className="flex justify-between w-full">
              {onReschedule && (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" onClick={onReschedule}>
                    Reschedule
                  </Button>
                </motion.div>
              )}

              {onCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        Cancel
                      </Button>
                    </motion.div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this booking? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep booking</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
                        {cancelling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          "Yes, cancel booking"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}

          {(isPast || booking.status === "cancelled") && (
            <div className="flex justify-between w-full">
              <motion.div whileTap={{ scale: 0.95 }} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  Book Again
                </Button>
              </motion.div>
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
