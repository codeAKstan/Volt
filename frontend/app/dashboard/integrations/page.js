"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Check, X } from "lucide-react"
import { CalendarIntegration } from "@/components/integrations/calendar-integration"

export default function IntegrationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [dialogContent, setDialogContent] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [open, setOpen] = useState(false)

  const integrations = [
    {
      id: "google-workspace",
      name: "Google Workspace",
      description: "Integrate with Google Calendar, Gmail, and Google Drive",
      category: "productivity",
      connected: true,
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm.5 2a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11zm0 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11zm0 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11zm0 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Integrate with Outlook Calendar and Email",
      category: "productivity",
      connected: false,
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19 22H5a3 3 0 0 1-3-3V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12h4v4a3 3 0 0 1-3 3zm-1-5v2a1 1 0 0 0 2 0v-2h-2zm-2 3V4H4v15a1 1 0 0 0 1 1h11zM8 7h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Create and join Zoom meetings directly from bookings",
      category: "communication",
      connected: true,
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: "slack",
      name: "Slack",
      description: "Receive notifications and updates in Slack",
      category: "communication",
      connected: false,
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14.5 2C13.1 2 12 3.1 12 4.5V10c0 1.4 1.1 2.5 2.5 2.5H18c1.4 0 2.5-1.1 2.5-2.5S19.4 7.5 18 7.5H16V4.5C16 3.1 14.9 2 13.5 2zm-2.5 7.5H4.5C3.1 9.5 2 10.6 2 12s1.1 2.5 2.5 2.5h7.5c1.4 0 2.5-1.1 2.5-2.5s-1.1-2.5-2.5-2.5z"
            fill="currentColor"
          />
          <path
            d="M18 14.5c-1.4 0-2.5 1.1-2.5 2.5v3c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5v-3c0-1.4-1.1-2.5-2.5-2.5zm-13.5-10C3.1 4.5 2 5.6 2 7s1.1 2.5 2.5 2.5H7v2.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5v-7C12 3.6 10.9 2.5 9.5 2.5h-5z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      description: "Create Teams meetings and receive notifications",
      category: "communication",
      connected: false,
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-17.93c3.94.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Process payments for premium workspaces",
      category: "payment",
      connected: true,
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ]

  const filteredIntegrations =
    activeTab === "all" ? integrations : integrations.filter((integration) => integration.category === activeTab)

  const handleConnect = async (integration) => {
    setConnecting(true)

    try {
      // In a real app, this would redirect to OAuth flow
      // For demo purposes, we'll simulate a successful connection after a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update the integration status
      const updatedIntegrations = integrations.map((i) => (i.id === integration.id ? { ...i, connected: true } : i))

      toast.success(`Connected to ${integration.name}`)
    } catch (error) {
      console.error(`Error connecting to ${integration.name}:`, error)
      toast.error(`Failed to connect to ${integration.name}`)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (integration) => {
    setConnecting(true)

    try {
      // In a real app, this would revoke OAuth tokens
      // For demo purposes, we'll simulate a successful disconnection after a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the integration status
      const updatedIntegrations = integrations.map((i) => (i.id === integration.id ? { ...i, connected: false } : i))

      toast.success(`Disconnected from ${integration.name}`)
    } catch (error) {
      console.error(`Error disconnecting from ${integration.name}:`, error)
      toast.error(`Failed to disconnect from ${integration.name}`)
    } finally {
      setConnecting(false)
    }
  }

  const handleOpenCalendarIntegration = () => {
    setDialogContent("calendar")
  }

  const handleCloseDialog = () => {
    setDialogContent(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground">Connect Volt with your favorite tools and services</p>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {integration.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.category.charAt(0).toUpperCase() + integration.category.slice(1)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={integration.connected ? "outline" : "secondary"}>
                      {integration.connected ? (
                        <span className="flex items-center text-green-500">
                          <Check className="mr-1 h-3 w-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <X className="mr-1 h-3 w-3" />
                          Not Connected
                        </span>
                      )}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </CardContent>
                  <CardFooter>
                    {integration.connected ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          if (integration.id === "google-workspace" || integration.id === "outlook") {
                            handleOpenCalendarIntegration()
                          } else {
                            handleDisconnect(integration)
                          }
                        }}
                      >
                        {integration.id === "google-workspace" || integration.id === "outlook"
                          ? "Configure"
                          : "Disconnect"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (integration.id === "google-workspace" || integration.id === "outlook") {
                            handleOpenCalendarIntegration()
                          } else {
                            handleConnect(integration)
                          }
                        }}
                        disabled={connecting}
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogContent === "calendar"} onOpenChange={(open) => setOpen(open)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calendar Integration</DialogTitle>
            <DialogDescription>Connect and configure your calendar integration</DialogDescription>
          </DialogHeader>
          <CalendarIntegration onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
