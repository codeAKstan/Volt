"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth"
import { userApi, bookingApi } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bell, Calendar, Clock, Upload, User, Settings, History } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, updateProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bookingHistory, setBookingHistory] = useState([])
  
  // Initialize form data with user info or empty strings
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || user?.first_name || "",
    lastName: user?.lastName || user?.last_name || "",
    email: user?.email || "",
    jobTitle: user?.jobTitle || "",
    department: user?.department || "",
    phoneNumber: user?.phoneNumber || user?.phone_number || "",
    profileImage: user?.profileImage || null,
  })

  const [preferences, setPreferences] = useState({
    preferredWorkspaceType: "desk",
    preferredLocation: "East Wing",
    preferredStartTime: "09:00",
    preferredEndTime: "17:00",
    autoCheckIn: false,
    receiveReminders: true,
    reminderTime: "1hour",
    calendarSync: false,
    darkMode: false,
  })

  const [notifications, setNotifications] = useState({
    bookingConfirmations: true,
    bookingReminders: true,
    bookingChanges: true,
    systemAnnouncements: true,
    marketingEmails: false,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
  })

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U"
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase()
  }

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch user profile
        const userData = await userApi.getById(user.id)

        // Set profile data
        setProfileData({
          firstName: userData.firstName || userData.first_name || "",
          lastName: userData.lastName || userData.last_name || "",
          email: userData.email || "",
          jobTitle: userData.jobTitle || "",
          department: userData.department || "",
          phoneNumber: userData.phoneNumber || userData.phone_number || "",
          profileImage: userData.profileImage || null,
        })

        // Set preferences (in a real app, these would come from the backend)
        if (userData.preferences) {
          setPreferences({
            ...userData.preferences,
            darkMode: document.documentElement.classList.contains("dark"),
          })
        }

        // Fetch booking history
        const bookings = await bookingApi.getByUser(user.id)
        setBookingHistory(bookings)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePreferenceChange = (name, value) => {
    setPreferences((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (name, value) => {
    setNotifications((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, you would upload this to your server
      // For demo purposes, we'll just create a local URL
      const reader = new FileReader()
      reader.onload = () => {
        setProfileData((prev) => ({ ...prev, profileImage: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Update user profile using the auth context's updateProfile function
      await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        jobTitle: profileData.jobTitle,
        department: profileData.department,
        phoneNumber: profileData.phoneNumber,
        // In a real app, you would handle the profile image upload separately
      })

      // In a real app, you would also save preferences and notification settings
      // await userApi.updatePreferences(user.id, preferences)
      // await userApi.updateNotificationSettings(user.id, notifications)

      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
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
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-4 sm:space-y-0">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {profileData.profileImage ? (
                        <AvatarImage src={profileData.profileImage} alt={profileData.firstName} />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          {getUserInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <label
                      htmlFor="profile-image"
                      className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="sr-only">Upload profile picture</span>
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email address is used for login and cannot be changed
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      value={profileData.jobTitle}
                      onChange={handleProfileChange}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      placeholder="e.g., Engineering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleProfileChange}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-muted-foreground">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Booking Preferences</CardTitle>
                <CardDescription>Customize your workspace booking experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferredWorkspaceType">Preferred Workspace Type</Label>
                    <Select
                      value={preferences.preferredWorkspaceType}
                      onValueChange={(value) => handlePreferenceChange("preferredWorkspaceType", value)}
                    >
                      <SelectTrigger id="preferredWorkspaceType">
                        <SelectValue placeholder="Select workspace type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desk">Desk</SelectItem>
                        <SelectItem value="meeting">Meeting Room</SelectItem>
                        <SelectItem value="phone">Phone Booth</SelectItem>
                        <SelectItem value="conference">Conference Room</SelectItem>
                        <SelectItem value="event">Event Space</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredLocation">Preferred Location</Label>
                    <Select
                      value={preferences.preferredLocation}
                      onValueChange={(value) => handlePreferenceChange("preferredLocation", value)}
                    >
                      <SelectTrigger id="preferredLocation">
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
                    <Label htmlFor="preferredStartTime">Preferred Start Time</Label>
                    <Select
                      value={preferences.preferredStartTime}
                      onValueChange={(value) => handlePreferenceChange("preferredStartTime", value)}
                    >
                      <SelectTrigger id="preferredStartTime">
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                          <SelectItem key={`${hour}:00`} value={`${hour.toString().padStart(2, "0")}:00`}>
                            {`${hour}:00 ${hour < 12 ? "AM" : "PM"}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredEndTime">Preferred End Time</Label>
                    <Select
                      value={preferences.preferredEndTime}
                      onValueChange={(value) => handlePreferenceChange("preferredEndTime", value)}
                    >
                      <SelectTrigger id="preferredEndTime">
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 9).map((hour) => (
                          <SelectItem key={`${hour}:00`} value={`${hour.toString().padStart(2, "0")}:00`}>
                            {`${hour}:00 ${hour < 12 ? "AM" : "PM"}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoCheckIn">Automatic Check-in</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically check in to your bookings when you arrive
                      </p>
                    </div>
                    <Switch
                      id="autoCheckIn"
                      checked={preferences.autoCheckIn}
                      onCheckedChange={(checked) => handlePreferenceChange("autoCheckIn", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="receiveReminders">Booking Reminders</Label>
                      <p className="text-sm text-muted-foreground">Receive reminders before your scheduled bookings</p>
                    </div>
                    <Switch
                      id="receiveReminders"
                      checked={preferences.receiveReminders}
                      onCheckedChange={(checked) => handlePreferenceChange("receiveReminders", checked)}
                    />
                  </div>
                  {preferences.receiveReminders && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="reminderTime">Reminder Time</Label>
                      <Select
                        value={preferences.reminderTime}
                        onValueChange={(value) => handlePreferenceChange("reminderTime", value)}
                      >
                        <SelectTrigger id="reminderTime">
                          <SelectValue placeholder="Select reminder time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15min">15 minutes before</SelectItem>
                          <SelectItem value="30min">30 minutes before</SelectItem>
                          <SelectItem value="1hour">1 hour before</SelectItem>
                          <SelectItem value="2hours">2 hours before</SelectItem>
                          <SelectItem value="1day">1 day before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="calendarSync">Calendar Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Sync your bookings with Google Calendar or Outlook
                      </p>
                    </div>
                    <Switch
                      id="calendarSync"
                      checked={preferences.calendarSync}
                      onCheckedChange={(checked) => handlePreferenceChange("calendarSync", checked)}
                    />
                  </div>
                  {preferences.calendarSync && (
                    <div className="ml-6 space-y-4">
                      <div className="flex items-center space-x-4">
                        <Button variant="outline" className="w-full">
                          <svg
                            className="mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm.5 2a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11zm0 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11zm0 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11zm0 4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-11z" />
                          </svg>
                          Connect Google Calendar
                        </Button>
                        <Button variant="outline" className="w-full">
                          <svg
                            className="mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M19 22H5a3 3 0 0 1-3-3V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12h4v4a3 3 0 0 1-3 3zm-1-5v2a1 1 0 0 0 2 0v-2h-2zm-2 3V4H4v15a1 1 0 0 0 1 1h11zM8 7h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" />
                          </svg>
                          Connect Outlook
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your bookings will be automatically added to your connected calendar
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="bookingConfirmations">Booking Confirmations</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when your booking is confirmed
                        </p>
                      </div>
                      <Switch
                        id="bookingConfirmations"
                        checked={notifications.bookingConfirmations}
                        onCheckedChange={(checked) => handleNotificationChange("bookingConfirmations", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="bookingReminders">Booking Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive reminders before your scheduled bookings
                        </p>
                      </div>
                      <Switch
                        id="bookingReminders"
                        checked={notifications.bookingReminders}
                        onCheckedChange={(checked) => handleNotificationChange("bookingReminders", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="bookingChanges">Booking Changes</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when your bookings are changed or cancelled
                        </p>
                      </div>
                      <Switch
                        id="bookingChanges"
                        checked={notifications.bookingChanges}
                        onCheckedChange={(checked) => handleNotificationChange("bookingChanges", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="systemAnnouncements">System Announcements</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important system announcements and updates
                        </p>
                      </div>
                      <Switch
                        id="systemAnnouncements"
                        checked={notifications.systemAnnouncements}
                        onCheckedChange={(checked) => handleNotificationChange("systemAnnouncements", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketingEmails">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">Receive promotional emails and newsletters</p>
                      </div>
                      <Switch
                        id="marketingEmails"
                        checked={notifications.marketingEmails}
                        onCheckedChange={(checked) => handleNotificationChange("marketingEmails", checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications in your browser or mobile app
                        </p>
                      </div>
                      <Switch
                        id="pushNotifications"
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={notifications.smsNotifications}
                        onCheckedChange={(checked) => handleNotificationChange("smsNotifications", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Notification Settings"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>View your past and upcoming bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {bookingHistory.length > 0 ? (
                  <div className="space-y-4">
                    {bookingHistory.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                          <div>
                            <h4 className="font-medium">{booking.title}</h4>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              <span>{format(new Date(booking.date), "PPP")}</span>
                              <span className="mx-1">•</span>
                              <Clock className="mr-1 h-3 w-3" />
                              <span>
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                booking.status === "confirmed"
                                  ? "outline"
                                  : booking.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                            <Badge variant="secondary">{booking.workspaceName}</Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <History className="mb-2 h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">No booking history</h3>
                    <p className="mt-1 text-sm text-muted-foreground">You haven't made any bookings yet</p>
                    <Button className="mt-4" onClick={() => router.push("/dashboard/workspaces")}>
                      Book a Workspace
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
