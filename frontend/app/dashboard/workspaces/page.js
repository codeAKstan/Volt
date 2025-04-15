"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Filter, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WorkspaceCard } from "@/components/dashboard/workspace-card"
import { AddWorkspaceModal } from "@/components/dashboard/add-workspace-modal"
import { workspaceApi } from "@/lib/api-client"
import { toast } from "sonner"

export default function WorkspacesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [spaceType, setSpaceType] = useState("")
  const [location, setLocation] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Fetch workspaces from the backend
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setLoading(true)
      try {
        const data = await workspaceApi.getAll()
        setWorkspaces(data)
      } catch (error) {
        console.error("Error fetching workspaces:", error)
        toast.error("Failed to load workspaces")
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  // Filter workspaces based on search, type, location, and tab
  const filteredWorkspaces = workspaces.filter((workspace) => {
    // Filter by tab (all/available)
    if (activeTab === "available" && !workspace.available) return false

    // Filter by search query
    if (
      searchQuery &&
      !workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !workspace.type.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Filter by space type
    if (spaceType && workspace.type !== spaceType) {
      return false
    }

    // Filter by location
    if (location && workspace.location !== location) {
      return false
    }

    return true
  })

  // Get unique locations for filter
  const locations = [...new Set(workspaces.map((w) => w.location))]

  // Handle adding a new workspace
  const handleWorkspaceAdded = (newWorkspace) => {
    setWorkspaces((prev) => [...prev, newWorkspace])
    toast.success("Workspace added successfully!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workspaces</h2>
          <p className="text-muted-foreground">Browse and book available workspaces</p>
        </div>
        <AddWorkspaceModal onWorkspaceAdded={handleWorkspaceAdded} />
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
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
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Space type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="desk">Desk</SelectItem>
            <SelectItem value="meeting">Meeting Room</SelectItem>
            <SelectItem value="conference">Conference Room</SelectItem>
            <SelectItem value="phone">Phone Booth</SelectItem>
            <SelectItem value="event">Event Hall</SelectItem>
            <SelectItem value="collaboration">Collaboration Space</SelectItem>
          </SelectContent>
        </Select>

        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-full md:w-[180px]">
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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSearchQuery("")
            setSpaceType("")
            setLocation("")
          }}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Workspaces</TabsTrigger>
          <TabsTrigger value="available">Available Now</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {filteredWorkspaces.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredWorkspaces.map((workspace, index) => (
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
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No workspaces found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="available" className="space-y-4">
          {filteredWorkspaces.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredWorkspaces.map((workspace, index) => (
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
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No available workspaces</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
