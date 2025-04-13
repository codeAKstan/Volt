"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth"
import { bookingApi, authAPI } from "@/lib/api-client"
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
    jobTitle: user?.jobTitle || user?.job_title || "",
    department: user?.department || "",
    phoneNumber: user?.phoneNumber || user?.phone_number || "",
    profileImage: user?.profileImage || user?.profile_image || null,
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
        const userData = await authAPI.getCurrentUser()

        if (!userData) {
          throw new Error("Failed to fetch user data")
        }

        console.log("Fetched user data:", userData)

        // Set profile data
        setProfileData({
          firstName: userData.firstName || userData.first_name || "",
          lastName: userData.lastName || userData.last_name || "",
          email: userData.email || "",
          jobTitle: userData.jobTitle || userData.job_title || "",
          department: userData.department || "",
          phoneNumber: userData.phoneNumber || userData.phone_number || "",
          profileImage: userData.profileImage || userData.profile_image || null,
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
      console.log("Selected file:", file)

      // Store the actual file object for upload
      setProfileData((prev) => ({
        ...prev,
        profileImage: file,
      }))

      // Create a preview URL for display
      const reader = new FileReader()
      reader.onload = () => {
        setProfileData((prev) => ({
          ...prev,
          profileImagePreview: reader.result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      console.log("Saving profile with data:", profileData)

      // Update user profile using the auth context's updateProfile function
      const result = await authAPI.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        jobTitle: profileData.jobTitle,
        department: profileData.department,
        phoneNumber: profileData.phoneNumber,
        profileImage: profileData.profileImage instanceof File ? profileData.profileImage : undefined,
      })

      console.log("Profile update result:", result)

      // Update the user context with the new data
      if (updateProfile && typeof updateProfile === "function") {
        updateProfile(result)
      }

      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile: " + (error.message || "Unknown error"))
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
                      {profileData.profileImagePreview ? (
                        <AvatarImage
                          src={profileData.profileImagePreview || "/placeholder.svg"}
                          alt={profileData.firstName}
                        />
                      ) : profileData.profileImage ? (
                        <AvatarImage src={profileData.profileImage || "/placeholder.svg"} alt={profileData.firstName} />
                      ) : (
                        <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
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
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1).toLowerCase() || "User"}
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

        <TabsContent value="preferences">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your workspace and booking preferences</CardDescription>
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
                        <SelectValue placeholder="Select a workspace type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desk">Desk</SelectItem>
                        <SelectItem value="privateOffice">Private Office</SelectItem>
                        <SelectItem value="meetingRoom">Meeting Room</SelectItem>
                        <SelectItem value="openArea">Open Area</SelectItem>
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
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="East Wing">East Wing</SelectItem>
                        <SelectItem value="West Wing">West Wing</SelectItem>
                        <SelectItem value="North Wing">North Wing</SelectItem>
                        <SelectItem value="South Wing">South Wing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferredStartTime">Preferred Start Time</Label>
                    <Input
                      id="preferredStartTime"
                      type="time"
                      value={preferences.preferredStartTime}
                      onChange={(e) => handlePreferenceChange("preferredStartTime", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredEndTime">Preferred End Time</Label>
                    <Input
                      id="preferredEndTime"
                      type="time"
                      value={preferences.preferredEndTime}
                      onChange={(e) => handlePreferenceChange("preferredEndTime", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Booking Options</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoCheckIn" className="pr-2">
                        Auto Check-In
                      </Label>
                      <Switch
                        id="autoCheckIn"
                        checked={preferences.autoCheckIn}
                        onCheckedChange={(checked) => handlePreferenceChange("autoCheckIn", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="receiveReminders" className="pr-2">
                        Receive Booking Reminders
                      </Label>
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
                            <SelectValue placeholder="Select a reminder time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5min">5 minutes before</SelectItem>
                            <SelectItem value="15min">15 minutes before</SelectItem>
                            <SelectItem value="30min">30 minutes before</SelectItem>
                            <SelectItem value="1hour">1 hour before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="calendarSync" className="pr-2">
                        Calendar Sync
                      </Label>
                      <Switch
                        id="calendarSync"
                        checked={preferences.calendarSync}
                        onCheckedChange={(checked) => handlePreferenceChange("calendarSync", checked)}
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
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingConfirmations" className="pr-2">
                      Booking Confirmations
                    </Label>
                    <Switch
                      id="bookingConfirmations"
                      checked={notifications.bookingConfirmations}
                      onCheckedChange={(checked) => handleNotificationChange("bookingConfirmations", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingReminders" className="pr-2">
                      Booking Reminders
                    </Label>
                    <Switch
                      id="bookingReminders"
                      checked={notifications.bookingReminders}
                      onCheckedChange={(checked) => handleNotificationChange("bookingReminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bookingChanges" className="pr-2">
                      Booking Changes
                    </Label>
                    <Switch
                      id="bookingChanges"
                      checked={notifications.bookingChanges}
                      onCheckedChange={(checked) => handleNotificationChange("bookingChanges", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemAnnouncements" className="pr-2">
                      System Announcements
                    </Label>
                    <Switch
                      id="systemAnnouncements"
                      checked={notifications.systemAnnouncements}
                      onCheckedChange={(checked) => handleNotificationChange("systemAnnouncements", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="marketingEmails" className="pr-2">
                      Marketing Emails
                    </Label>
                    <Switch
                      id="marketingEmails"
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => handleNotificationChange("marketingEmails", checked)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pushNotifications" className="pr-2">
                      Push Notifications
                    </Label>
                    <Switch
                      id="pushNotifications"
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications" className="pr-2">
                      Email Notifications
                    </Label>
                    <Switch
                      id="emailNotifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smsNotifications" className="pr-2">
                      SMS Notifications
                    </Label>
                    <Switch
                      id="smsNotifications"
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("smsNotifications", checked)}
                    />
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

        <TabsContent value="history">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>View your past and upcoming bookings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookingHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No booking history available</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {bookingHistory.map((booking) => (
                      <div key={booking.id} className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-3">
                        <div className="col-span-1">
                          <div className="font-medium">{booking.workspace?.name || "Workspace"}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.startTime), "PPP")}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(booking.startTime), "h:mm a")} -{" "}
                            {format(new Date(booking.endTime), "h:mm a")}
                          </div>
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                          <Badge variant="secondary">Confirmed</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Close
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
