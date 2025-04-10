"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

export function CalendarIntegration({ onClose }) {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState({
    google: false,
    outlook: false,
  })
  const [settings, setSettings] = useState({
    syncUpcoming: true,
    syncCancellations: true,
    addReminders: true,
    reminderTime: 15,
    createEvents: true,
  })

  const handleConnect = async (provider) => {
    setConnecting(true)

    try {
      // In a real app, this would redirect to OAuth flow
      // For demo purposes, we'll simulate a successful connection after a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setConnected((prev) => ({ ...prev, [provider]: true }))
      toast.success(`Connected to ${provider === "google" ? "Google Calendar" : "Outlook Calendar"}`)
    } catch (error) {
      console.error(`Error connecting to ${provider}:`, error)
      toast.error(`Failed to connect to ${provider === "google" ? "Google Calendar" : "Outlook Calendar"}`)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (provider) => {
    setConnecting(true)

    try {
      // In a real app, this would revoke OAuth tokens
      // For demo purposes, we'll simulate a successful disconnection after a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setConnected((prev) => ({ ...prev, [provider]: false }))
      toast.success(`Disconnected from ${provider === "google" ? "Google Calendar" : "Outlook Calendar"}`)
    } catch (error) {
      console.error(`Error disconnecting from ${provider}:`, error)
      toast.error(`Failed to disconnect from ${provider === "google" ? "Google Calendar" : "Outlook Calendar"}`)
    } finally {
      setConnecting(false)
    }
  }

  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSaveSettings = () => {
    // In a real app, this would save settings to the backend
    toast.success("Calendar integration settings saved")
    if (onClose) onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>Connect your calendar to sync your bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Connect Your Calendar</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Google Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Sync your bookings with Google Calendar</p>
                </CardContent>
                <CardFooter>
                  {connected.google ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDisconnect("google")}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleConnect("google")} disabled={connecting}>
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Outlook Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Sync your bookings with Outlook Calendar</p>
                </CardContent>
                <CardFooter>
                  {connected.outlook ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDisconnect("outlook")}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleConnect("outlook")} disabled={connecting}>
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
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sync Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="syncUpcoming">Sync Upcoming Bookings</Label>
                  <p className="text-sm text-muted-foreground">Add your upcoming bookings to your calendar</p>
                </div>
                <Switch
                  id="syncUpcoming"
                  checked={settings.syncUpcoming}
                  onCheckedChange={(checked) => handleSettingChange("syncUpcoming", checked)}
                  disabled={!connected.google && !connected.outlook}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="syncCancellations">Sync Cancellations</Label>
                  <p className="text-sm text-muted-foreground">Remove cancelled bookings from your calendar</p>
                </div>
                <Switch
                  id="syncCancellations"
                  checked={settings.syncCancellations}
                  onCheckedChange={(checked) => handleSettingChange("syncCancellations", checked)}
                  disabled={!connected.google && !connected.outlook}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="addReminders">Add Calendar Reminders</Label>
                  <p className="text-sm text-muted-foreground">Add reminders to your calendar events</p>
                </div>
                <Switch
                  id="addReminders"
                  checked={settings.addReminders}
                  onCheckedChange={(checked) => handleSettingChange("addReminders", checked)}
                  disabled={!connected.google && !connected.outlook}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="createEvents">Create Calendar Events</Label>
                  <p className="text-sm text-muted-foreground">Create events in your calendar for bookings</p>
                </div>
                <Switch
                  id="createEvents"
                  checked={settings.createEvents}
                  onCheckedChange={(checked) => handleSettingChange("createEvents", checked)}
                  disabled={!connected.google && !connected.outlook}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
