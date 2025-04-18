import axios from "axios"
import Cookies from "js-cookie"

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "/api", // This will be proxied to your Django backend
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// For demo purposes, we'll use local storage to simulate a database
const getLocalData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error)
    return defaultValue
  }
}

const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Workspace API functions
export const workspaceApi = {
  // Get all workspaces
  getAll: async () => {
    // For demo, we'll use mock data
    let workspaces = getLocalData("workspaces")

    // If no workspaces in storage, initialize with mock data
    if (!workspaces || workspaces.length === 0) {
      workspaces = [
        {
          id: 1,
          name: "Desk 101",
          type: "desk",
          location: "East Wing",
          amenities: ["Standing desk", "Dual monitors"],
          available: true,
          hourlyRate: 5,
        },
        {
          id: 2,
          name: "Meeting Room A",
          type: "meeting",
          location: "North Wing",
          amenities: ["Projector", "Whiteboard", "Video conferencing"],
          available: true,
          capacity: 8,
          hourlyRate: 20,
        },
        {
          id: 3,
          name: "Phone Booth 3",
          type: "phone",
          location: "West Wing",
          amenities: ["Soundproof", "Video call setup"],
          available: true,
          capacity: 1,
          hourlyRate: 8,
        },
        {
          id: 4,
          name: "Event Hall",
          type: "event",
          location: "South Wing",
          amenities: ["Stage", "Sound system", "Projector"],
          available: true,
          capacity: 50,
          hourlyRate: 100,
        },
        {
          id: 5,
          name: "Desk 102",
          type: "desk",
          location: "East Wing",
          amenities: ["Standing desk", "Single monitor", "Ergonomic chair"],
          available: true,
          hourlyRate: 5,
        },
        {
          id: 6,
          name: "Conference Room B",
          type: "conference",
          location: "North Wing",
          amenities: ["Large display", "Video conferencing", "Whiteboard"],
          available: true,
          capacity: 12,
          hourlyRate: 30,
        },
        {
          id: 7,
          name: "Quiet Zone Desk 5",
          type: "desk",
          location: "West Wing",
          amenities: ["Noise cancellation", "Privacy screen", "Ergonomic chair"],
          available: true,
          hourlyRate: 6,
        },
        {
          id: 8,
          name: "Collaboration Space",
          type: "collaboration",
          location: "Central Area",
          amenities: ["Whiteboards", "Flexible seating", "Projector"],
          available: true,
          capacity: 15,
          hourlyRate: 25,
        },
        {
          id: 9,
          name: "Phone Booth 1",
          type: "phone",
          location: "East Wing",
          amenities: ["Soundproof", "Video call setup"],
          available: true,
          capacity: 1,
          hourlyRate: 8,
        },
      ]
      setLocalData("workspaces", workspaces)
    }

    return workspaces
  },

  // Get workspace by ID
  getById: async (id) => {
    const workspaces = getLocalData("workspaces", [])
    return workspaces.find((w) => w.id === Number.parseInt(id)) || null
  },

  // Check availability for a specific time slot
  checkAvailability: async (workspaceId, date, startTime, endTime) => {
    const bookings = getLocalData("bookings", [])
    const workspace = await workspaceApi.getById(workspaceId)

    if (!workspace) {
      throw new Error("Workspace not found")
    }

    // Check if there are any overlapping bookings
    const overlappingBookings = bookings.filter(
      (booking) =>
        booking.workspaceId === workspaceId &&
        booking.date === date &&
        !(booking.endTime <= startTime || booking.startTime >= endTime) &&
        booking.status !== "cancelled",
    )

    return {
      available: overlappingBookings.length === 0,
      workspace,
      overlappingBookings,
    }
  },

  // Update workspace
  update: async (id, data) => {
    const workspaces = getLocalData("workspaces", [])
    const index = workspaces.findIndex((w) => w.id === Number.parseInt(id))

    if (index === -1) {
      throw new Error("Workspace not found")
    }

    workspaces[index] = { ...workspaces[index], ...data }
    setLocalData("workspaces", workspaces)

    return workspaces[index]
  },
}

// Booking API functions
export const bookingApi = {
  // Get all bookings
  getAll: async () => {
    // For demo, we'll use mock data if none exists
    let bookings = getLocalData("bookings")

    if (!bookings || bookings.length === 0) {
      // Initialize with some mock bookings
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const formatDate = (date) => {
        return date.toISOString().split("T")[0]
      }

      bookings = [
        {
          id: 1,
          title: "Team Meeting",
          workspaceId: 2,
          workspaceName: "Meeting Room A",
          date: formatDate(today),
          startTime: "10:00",
          endTime: "11:30",
          attendees: ["john@example.com", "sarah@example.com"],
          userId: "1",
          status: "confirmed",
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: "Project Planning",
          workspaceId: 6,
          workspaceName: "Conference Room B",
          date: formatDate(tomorrow),
          startTime: "14:00",
          endTime: "15:00",
          attendees: ["john@example.com", "mike@example.com"],
          userId: "1",
          status: "confirmed",
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          title: "Client Call",
          workspaceId: 3,
          workspaceName: "Phone Booth 3",
          date: formatDate(tomorrow),
          startTime: "09:30",
          endTime: "10:00",
          attendees: ["john@example.com"],
          userId: "1",
          status: "confirmed",
          createdAt: new Date().toISOString(),
        },
      ]
      setLocalData("bookings", bookings)
    }

    return bookings
  },

  // Get booking by ID
  getById: async (id) => {
    const bookings = getLocalData("bookings", [])
    return bookings.find((b) => b.id === Number.parseInt(id)) || null
  },

  // Get bookings for a user
  getByUser: async (userId) => {
    const bookings = getLocalData("bookings", [])
    return bookings.filter((b) => b.userId === userId)
  },

  // Create a new booking
  create: async (bookingData) => {
    const bookings = getLocalData("bookings", [])
    const workspaces = getLocalData("workspaces", [])

    // Check if workspace exists
    const workspace = workspaces.find((w) => w.id === Number.parseInt(bookingData.workspaceId))
    if (!workspace) {
      throw new Error("Workspace not found")
    }

    // Check availability
    const { available } = await workspaceApi.checkAvailability(
      bookingData.workspaceId,
      bookingData.date,
      bookingData.startTime,
      bookingData.endTime,
    )

    if (!available) {
      throw new Error("This workspace is not available for the selected time slot")
    }

    // Create new booking
    const newBooking = {
      id: bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1,
      workspaceName: workspace.name,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      ...bookingData,
    }

    bookings.push(newBooking)
    setLocalData("bookings", bookings)

    // Send notification
    notificationApi.sendBookingConfirmation(newBooking)

    // Schedule reminder
    notificationApi.scheduleReminder(newBooking)

    return newBooking
  },

  // Update a booking
  update: async (id, data) => {
    const bookings = getLocalData("bookings", [])
    const index = bookings.findIndex((b) => b.id === Number.parseInt(id))

    if (index === -1) {
      throw new Error("Booking not found")
    }

    // If changing time or date, check availability
    if (
      (data.date && data.date !== bookings[index].date) ||
      (data.startTime && data.startTime !== bookings[index].startTime) ||
      (data.endTime && data.endTime !== bookings[index].endTime)
    ) {
      const { available } = await workspaceApi.checkAvailability(
        bookings[index].workspaceId,
        data.date || bookings[index].date,
        data.startTime || bookings[index].startTime,
        data.endTime || bookings[index].endTime,
      )

      if (!available) {
        throw new Error("This workspace is not available for the selected time slot")
      }
    }

    // Update booking
    const updatedBooking = { ...bookings[index], ...data }
    bookings[index] = updatedBooking
    setLocalData("bookings", bookings)

    // Send notification if status changed
    if (data.status && data.status !== bookings[index].status) {
      if (data.status === "cancelled") {
        notificationApi.sendCancellationNotice(updatedBooking)
      } else if (data.status === "rescheduled") {
        notificationApi.sendRescheduleNotice(updatedBooking)
      }
    }

    return updatedBooking
  },

  // Cancel a booking
  cancel: async (id) => {
    return bookingApi.update(id, { status: "cancelled" })
  },

  // Get analytics data
  getAnalytics: async () => {
    const bookings = getLocalData("bookings", [])
    const workspaces = getLocalData("workspaces", [])

    // Calculate total bookings by workspace type
    const bookingsByType = {}
    workspaces.forEach((workspace) => {
      bookingsByType[workspace.type] = bookingsByType[workspace.type] || 0

      bookings.forEach((booking) => {
        if (booking.workspaceId === workspace.id && booking.status === "confirmed") {
          bookingsByType[workspace.type]++
        }
      })
    })

    // Calculate bookings by hour of day
    const bookingsByHour = Array(24).fill(0)
    bookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        const startHour = Number.parseInt(booking.startTime.split(":")[0])
        const endHour = Number.parseInt(booking.endTime.split(":")[0])

        for (let hour = startHour; hour < endHour; hour++) {
          bookingsByHour[hour]++
        }
      }
    })

    // Calculate occupancy rate
    const totalWorkspaces = workspaces.length
    const occupancyByDate = {}

    bookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        occupancyByDate[booking.date] = occupancyByDate[booking.date] || 0
        occupancyByDate[booking.date]++
      }
    })

    // Convert to percentage
    Object.keys(occupancyByDate).forEach((date) => {
      occupancyByDate[date] = (occupancyByDate[date] / totalWorkspaces) * 100
    })

    return {
      bookingsByType,
      bookingsByHour,
      occupancyByDate,
      peakHours: bookingsByHour.indexOf(Math.max(...bookingsByHour)),
      totalBookings: bookings.filter((b) => b.status === "confirmed").length,
      totalWorkspaces,
    }
  },
}

// Notification API functions
export const notificationApi = {
  // Get all notifications for a user
  getByUser: async (userId) => {
    const notifications = getLocalData(`notifications_${userId}`, [])
    return notifications
  },

  // Create a notification
  create: async (userId, notification) => {
    const notifications = getLocalData(`notifications_${userId}`, [])

    const newNotification = {
      id: notifications.length > 0 ? Math.max(...notifications.map((n) => n.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    }

    notifications.push(newNotification)
    setLocalData(`notifications_${userId}`, notifications)

    return newNotification
  },

  // Mark notification as read
  markAsRead: async (userId, notificationId) => {
    const notifications = getLocalData(`notifications_${userId}`, [])
    const index = notifications.findIndex((n) => n.id === Number.parseInt(notificationId))

    if (index === -1) {
      throw new Error("Notification not found")
    }

    notifications[index].read = true
    setLocalData(`notifications_${userId}`, notifications)

    return notifications[index]
  },

  // Send booking confirmation notification
  sendBookingConfirmation: async (booking) => {
    return notificationApi.create(booking.userId, {
      type: "booking_confirmation",
      title: "Booking Confirmed",
      message: `Your booking for ${booking.workspaceName} on ${booking.date} from ${booking.startTime} to ${booking.endTime} has been confirmed.`,
      bookingId: booking.id,
    })
  },

  // Send booking reminder notification
  sendReminder: async (booking) => {
    return notificationApi.create(booking.userId, {
      type: "booking_reminder",
      title: "Upcoming Booking Reminder",
      message: `Reminder: You have a booking for ${booking.workspaceName} today from ${booking.startTime} to ${booking.endTime}.`,
      bookingId: booking.id,
    })
  },

  // Schedule a reminder for a booking
  scheduleReminder: async (booking) => {
    // In a real app, this would use a job scheduler
    // For demo purposes, we'll just simulate it
    console.log(`Reminder scheduled for booking ${booking.id}`)

    // For demo, we'll create the reminder immediately
    return notificationApi.sendReminder(booking)
  },

  // Send cancellation notice
  sendCancellationNotice: async (booking) => {
    return notificationApi.create(booking.userId, {
      type: "booking_cancellation",
      title: "Booking Cancelled",
      message: `Your booking for ${booking.workspaceName} on ${booking.date} from ${booking.startTime} to ${booking.endTime} has been cancelled.`,
      bookingId: booking.id,
    })
  },

  // Send reschedule notice
  sendRescheduleNotice: async (booking) => {
    return notificationApi.create(booking.userId, {
      type: "booking_rescheduled",
      title: "Booking Rescheduled",
      message: `Your booking for ${booking.workspaceName} has been rescheduled to ${booking.date} from ${booking.startTime} to ${booking.endTime}.`,
      bookingId: booking.id,
    })
  },

  // Send conflict notice
  sendConflictNotice: async (userId, workspace, date, startTime, endTime) => {
    return notificationApi.create(userId, {
      type: "booking_conflict",
      title: "Booking Conflict",
      message: `There is a conflict with your requested booking for ${workspace.name} on ${date} from ${startTime} to ${endTime}. Please select a different time or workspace.`,
    })
  },
}

// User API functions
export const userApi = {
  // Get all users (admin only)
  getAll: async () => {
    let users = getLocalData("users")

    if (!users || users.length === 0) {
      users = [
        {
          id: "1",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        },
        {
          id: "2",
          email: "employee@example.com",
          firstName: "Employee",
          lastName: "User",
          role: "employee",
        },
        {
          id: "3",
          email: "learner@example.com",
          firstName: "Learner",
          lastName: "User",
          role: "learner",
        },
      ]
      setLocalData("users", users)
    }

    return users
  },

  // Get user by ID
  getById: async (id) => {
    const users = getLocalData("users", [])
    return users.find((u) => u.id === id) || null
  },

  // Create a new user
  create: async (userData) => {
    const users = getLocalData("users", [])

    // Check if email already exists
    if (users.some((u) => u.email === userData.email)) {
      throw new Error("Email already in use")
    }

    const newUser = {
      id: users.length > 0 ? String(Number.parseInt(users[users.length - 1].id) + 1) : "1",
      ...userData,
    }

    users.push(newUser)
    setLocalData("users", users)

    return newUser
  },

  // Update a user
  update: async (id, data) => {
    const users = getLocalData("users", [])
    const index = users.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new Error("User not found")
    }

    // Check if updating email and it already exists
    if (data.email && data.email !== users[index].email && users.some((u) => u.email === data.email)) {
      throw new Error("Email already in use")
    }

    users[index] = { ...users[index], ...data }
    setLocalData("users", users)

    return users[index]
  },
}

// User profile services
export const userService = {
  getProfile: async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const storedUser = localStorage.getItem("volt_user")
        const user = storedUser ? JSON.parse(storedUser) : null
        resolve({
          firstName: user?.firstName || "Test",
          lastName: user?.lastName || "User",
          email: user?.email || "test@example.com",
          jobTitle: user?.jobTitle || "Software Engineer",
          department: user?.department || "Engineering",
          phoneNumber: user?.phoneNumber || "+1 (555) 123-4567",
          profileImage: user?.profileImage || "/placeholder.svg",
        })
      }, 500)
    })
  },

  updateProfile: async (profileData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(profileData)
      }, 500)
    })
  },

  uploadProfileImage: async (imageFile) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ profileImage: URL.createObjectURL(imageFile) })
      }, 500)
    })
  },
}

/**
 * Ensure URL has a trailing slash
 * @param {string} url - The URL to check
 * @returns {string} - URL with trailing slash
 */
function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`
}

/**
 * Get the authentication token from local storage
 * @returns {string|null} - The authentication token or null if not found
 */
function getAuthToken() {
  if (typeof window !== "undefined") {
    try {
      // Try to get the token from localStorage
      const userData = localStorage.getItem("volt_user")
      if (userData) {
        const user = JSON.parse(userData)
        // Check different possible token formats
        return user.tokens?.access || user.access || user.token || null
      }
    } catch (error) {
      console.error("Error getting auth token:", error)
    }
  }
  return null
}

/**
 * Send a message to the AI assistant
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise} - Response from the AI assistant
 */
export async function sendMessageToAI(message, conversationHistory = []) {
  try {
    // Format conversation history for the backend
    const formattedHistory = conversationHistory.map((msg) => ({
      message: msg.content,
      is_user: msg.role === "user",
    }))

    const apiUrl = ensureTrailingSlash("/api/ai/assistant")
    const token = getAuthToken()

    // Log token for debugging (remove in production)
    console.log("Using auth token:", token ? "Token exists" : "No token found")

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Add authorization header if token exists
    if (token) {
      // Try both Bearer and Token formats
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        conversation_history: formattedHistory,
      }),
      credentials: "include", // Include cookies in the request
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending message to AI:", error)
    throw error
  }
}

/**
 * Get booking instructions from the AI assistant
 * @returns {Promise} - Booking instructions
 */
export async function getBookingInstructions() {
  try {
    const apiUrl = ensureTrailingSlash("/api/ai/assistant")
    const token = getAuthToken()

    const headers = {
      Accept: "application/json",
    }

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(apiUrl, {
      headers,
      credentials: "include", // Include cookies in the request
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error getting booking instructions:", error)
    throw error
  }
}

/**
 * Find available workspaces based on user criteria
 * @param {Object} criteria - Search criteria (type, location, capacity, etc.)
 * @returns {Promise} - Available workspaces matching criteria
 */
export async function findAvailableWorkspaces(criteria = {}) {
  try {
    const apiUrl = ensureTrailingSlash("/api/ai/assistant/find-workspaces")
    const token = getAuthToken()

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(criteria),
      credentials: "include", // Include cookies in the request
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error finding available workspaces:", error)
    throw error
  }
}

/**
 * Update workspace embeddings (admin only)
 * @returns {Promise} - Response with update count
 */
export async function updateWorkspaceEmbeddings() {
  try {
    const apiUrl = ensureTrailingSlash("/api/ai/admin")
    const token = getAuthToken()

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "update_embeddings",
      }),
      credentials: "include", // Include cookies in the request
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating workspace embeddings:", error)
    throw error
  }
}

export default api
