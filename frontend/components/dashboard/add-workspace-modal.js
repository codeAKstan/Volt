"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import { workspaceApi } from "@/lib/api"

export function AddWorkspaceModal({ onWorkspaceAdded }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "desk",
    location: "East Wing",
    capacity: "",
    hourlyRate: "",
    amenities: "",
    available: true,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare the data
      const workspaceData = {
        ...formData,
        id: Date.now(), // Generate a unique ID
        capacity: formData.capacity ? Number.parseInt(formData.capacity) : null,
        hourlyRate: formData.hourlyRate ? Number.parseFloat(formData.hourlyRate) : null,
        amenities: formData.amenities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }

      // Get existing workspaces
      const existingWorkspaces = await workspaceApi.getAll()

      // Add the new workspace
      const updatedWorkspaces = [...existingWorkspaces, workspaceData]

      // Save to localStorage (simulating API)
      localStorage.setItem("workspaces", JSON.stringify(updatedWorkspaces))

      toast.success("Workspace added successfully!")
      setOpen(false)
      setFormData({
        name: "",
        type: "desk",
        location: "East Wing",
        capacity: "",
        hourlyRate: "",
        amenities: "",
        available: true,
      })

      // Notify parent component
      if (onWorkspaceAdded) {
        onWorkspaceAdded(workspaceData)
      }
    } catch (error) {
      console.error("Error adding workspace:", error)
      toast.error("Failed to add workspace")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Workspace</DialogTitle>
          <DialogDescription>Fill in the details to add a new workspace to your inventory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Meeting Room A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desk">Desk</SelectItem>
                  <SelectItem value="meeting">Meeting Room</SelectItem>
                  <SelectItem value="conference">Conference Room</SelectItem>
                  <SelectItem value="phone">Phone Booth</SelectItem>
                  <SelectItem value="event">Event Hall</SelectItem>
                  <SelectItem value="collaboration">Collaboration Space</SelectItem>
                  <SelectItem value="video">Video Conference Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                name="location"
                value={formData.location}
                onValueChange={(value) => handleSelectChange("location", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="East Wing">East Wing</SelectItem>
                  <SelectItem value="West Wing">West Wing</SelectItem>
                  <SelectItem value="North Wing">North Wing</SelectItem>
                  <SelectItem value="South Wing">South Wing</SelectItem>
                  <SelectItem value="Central Area">Central Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (people)</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="e.g., 8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="e.g., 25.00"
              />
            </div>
            <div className="space-y-2 flex items-center">
              <div className="flex items-center space-x-2">
                <Label htmlFor="available">Available</Label>
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => handleSwitchChange("available", checked)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities (comma-separated)</Label>
            <Textarea
              id="amenities"
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              placeholder="e.g., Projector, Whiteboard, Video conferencing"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Workspace"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
