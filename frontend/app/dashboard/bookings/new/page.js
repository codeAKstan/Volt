"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingForm } from "@/components/dashboard/booking-form"
import { workspaceApi } from "@/lib/api"

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspace")

  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) {
        setLoading(false)
        return
      }

      try {
        const data = await workspaceApi.getById(workspaceId)
        setWorkspace(data)
      } catch (error) {
        console.error("Error fetching workspace:", error)
        setError("Failed to load workspace details")
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspace()
  }, [workspaceId])

  const handleBookingSuccess = () => {
    router.push("/dashboard/bookings")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Booking</h2>
          <p className="text-muted-foreground">Create a new workspace booking</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/workspaces")}>
            Browse Workspaces
          </Button>
        </div>
      ) : !workspaceId ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-semibold">No Workspace Selected</h3>
          <p className="mt-2 text-muted-foreground">Please select a workspace to book from the workspaces page.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/workspaces")}>
            Browse Workspaces
          </Button>
        </div>
      ) : (
        <BookingForm workspaceId={workspaceId} onSuccess={handleBookingSuccess} />
      )}
    </div>
  )
}
