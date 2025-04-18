/**
 * API client for making requests to the Django backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://volt-5dy7.onrender.com/api"

/**
 * Makes a fetch request to the API with the given options
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  console.log("Fetching from:", url)

  // Default headers
  const headers = {
    ...options.headers,
  }

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!options.formData) {
    headers["Content-Type"] = "application/json"
  }

  // Add authorization header if token exists
  const token = localStorage.getItem("volt_access_token")
  if (token && !options.skipAuth) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const config = {
    method: options.method || "GET",
    headers,
    ...options,
  }

  // Handle body based on whether it's FormData or JSON
  if (options.body) {
    if (options.formData) {
      config.body = options.body
      // Remove the Content-Type header for FormData
      delete config.headers["Content-Type"]
    } else {
      config.body = JSON.stringify(options.body)
    }
  }

  try {
    console.log("API Request:", { url, config })
    const response = await fetch(url, config)
    console.log("API Response status:", response.status)

    // Handle 401 Unauthorized - could be expired token
    if (response.status === 401 && !options.skipRefresh) {
      // Try to refresh the token
      const refreshed = await refreshToken()

      if (refreshed) {
        // Retry the original request with the new token
        return fetchAPI(endpoint, {
          ...options,
          skipRefresh: true, // Prevent infinite refresh loops
        })
      }
    }

    // Parse the JSON response
    let data = {}
    try {
      data = await response.json()
    } catch (e) {
      console.log("Response is not JSON:", e)
      // If response is not JSON, use an empty object
      data = {}
    }

    console.log("API Response data:", data)

    // If the response is not ok, throw an error
    if (!response.ok) {
      // Handle array error messages (common in Django REST Framework)
      if (Array.isArray(data)) {
        const errorMessage = data.join(", ")
        console.error("API Error Data (Array):", data)
        throw new Error(errorMessage)
      } else if (typeof data === "object" && data !== null) {
        // Extract error message from object
        const errorMessage =
          data.detail ||
          data.error ||
          (data.non_field_errors ? data.non_field_errors.join(", ") : null) ||
          Object.values(data).flat().join(", ") ||
          `API error: ${response.status}`
        console.error("API Error Data (Object):", data)
        throw new Error(errorMessage)
      } else {
        const errorMessage = `API error: ${response.status}`
        console.error("API Error Data (Unknown):", data)
        throw new Error(errorMessage)
      }
    }

    return data
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

/**
 * Attempts to refresh the access token using the refresh token
 */
export async function refreshToken() {
  const refreshToken = localStorage.getItem("volt_refresh_token")

  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    })

    if (!response.ok) {
      // If refresh fails, clear tokens and return false
      localStorage.removeItem("volt_access_token")
      localStorage.removeItem("volt_refresh_token")
      return false
    }

    const data = await response.json()

    // Store the new access token
    localStorage.setItem("volt_access_token", data.access)

    return true
  } catch (error) {
    console.error("Token refresh failed:", error)
    return false
  }
}

/**
 * API methods for authentication
 */
export const authAPI = {
  login: async (email, password) => {
    return fetchAPI("/login/", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    })
  },

  signup: async (userData) => {
    return fetchAPI("/signup/", {
      method: "POST",
      body: userData,
      skipAuth: true,
    })
  },

  getCurrentUser: async () => {
    try {
      // Use the user profile endpoint
      return await fetchAPI("/me/")
    } catch (error) {
      console.error("Failed to get current user:", error)
      return null
    }
  },

  updateProfile: async (userData) => {
    console.log("Updating profile with data:", userData)

    // Check if there's a profile image file to upload
    if (userData.profileImage instanceof File) {
      // Create FormData for file upload
      const formData = new FormData()

      // Add the profile image with the correct field name
      formData.append("profile_image", userData.profileImage)

      // Add other user data with snake_case field names
      if (userData.firstName) formData.append("first_name", userData.firstName)
      if (userData.lastName) formData.append("last_name", userData.lastName)
      if (userData.jobTitle) formData.append("job_title", userData.jobTitle)
      if (userData.department) formData.append("department", userData.department)
      if (userData.phoneNumber) formData.append("phone_number", userData.phoneNumber)

      console.log("Sending FormData with image:", formData)

      return fetchAPI("/me/", {
        method: "PATCH",
        body: formData,
        formData: true, // Signal that we're using FormData
      })
    }

    // Convert camelCase to snake_case for backend
    const backendData = {}
    if (userData.firstName) backendData.first_name = userData.firstName
    if (userData.lastName) backendData.last_name = userData.lastName
    if (userData.jobTitle) backendData.job_title = userData.jobTitle
    if (userData.department) backendData.department = userData.department
    if (userData.phoneNumber) backendData.phone_number = userData.phoneNumber

    console.log("Sending JSON data:", backendData)

    // Regular JSON update without file
    return fetchAPI("/me/", {
      method: "PATCH",
      body: backendData,
    })
  },

  logout: () => {
    localStorage.removeItem("volt_access_token")
    localStorage.removeItem("volt_refresh_token")
    localStorage.removeItem("volt_user")
  },
}

/**
 * User API methods
 */
export const userApi = {
  getAll: async () => {
    try {
      // Fetch all users from the backend API
      const data = await fetchAPI("/users/")
      return data
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error // Re-throw the error to be handled by the component
    }
  },

  getById: async (userId) => {
    try {
      // Fetch a specific user by ID
      return await fetchAPI(`/users/${userId}/`)
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error)
      throw error
    }
  },

  update: async (userId, userData) => {
    try {
      // Update a user's data
      return await fetchAPI(`/users/${userId}/`, {
        method: "PATCH",
        body: userData,
      })
    } catch (error) {
      console.error(`Error updating user with ID ${userId}:`, error)
      throw error
    }
  },

  getUserBookings: async (userId) => {
    try {
      // Fetch bookings for a specific user
      return await fetchAPI(`/users/${userId}/bookings/`)
    } catch (error) {
      console.error(`Error fetching bookings for user with ID ${userId}:`, error)
      throw error
    }
  },
}

/**
 * Workspace API methods
 */
export const workspaceApi = {
  getAll: async () => {
    try {
      console.log("Fetching all workspaces")
      const data = await fetchAPI("/booking/workspace/")
      console.log("Workspace data received:", data)

      // Map the backend data structure to our frontend format
      return data.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        type: workspace.type || "desk", // Default to desk if type is not provided
        location: workspace.location?.name || "Unknown",
        amenities: workspace.features ? workspace.features.map((f) => f.name) : [],
        available: workspace.is_available !== undefined ? workspace.is_available : true,
        capacity: workspace.capacity,
        hourlyRate: workspace.hourly_rate || 5, // Default hourly rate if not provided
      }))
    } catch (error) {
      console.error("Error fetching workspaces:", error)
      // Return empty array if API fails
      return []
    }
  },

  getById: async (id) => {
    try {
      const workspace = await fetchAPI(`/booking/workspace/${id}/`)
      return {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type || "desk",
        location: workspace.location?.name || "Unknown",
        amenities: workspace.features ? workspace.features.map((f) => f.name) : [],
        available: workspace.is_available !== undefined ? workspace.is_available : true,
        capacity: workspace.capacity,
        hourlyRate: workspace.hourly_rate || 5, // Default hourly rate if not provided
      }
    } catch (error) {
      console.error("Error fetching workspace:", error)
      return null
    }
  },

  create: async (workspaceData) => {
    try {
      console.log("Creating workspace with data:", workspaceData)

      // Convert frontend data to backend format
      const backendData = {
        name: workspaceData.name,
        type: workspaceData.type,
        description: workspaceData.description || `${workspaceData.type} in ${workspaceData.location}`,
        capacity: workspaceData.capacity ? Number.parseInt(workspaceData.capacity) : null,
        is_available: workspaceData.available,
        location: workspaceData.location, // Simplified to match backend expectations
        hourly_rate: workspaceData.hourlyRate ? Number.parseFloat(workspaceData.hourlyRate) : 5,
        amenities: workspaceData.amenities || [], // Keep this as an array of strings
      }

      console.log("Sending workspace data to backend:", backendData)
      const response = await fetchAPI("/booking/workspace/", {
        method: "POST",
        body: backendData,
      })

      // Convert response to frontend format
      return {
        id: response.id,
        name: response.name,
        type: response.type || "desk",
        location: response.location || "Unknown",
        amenities: response.amenities || [],
        available: response.is_available !== undefined ? response.is_available : true,
        capacity: response.capacity,
        hourlyRate: response.hourly_rate || workspaceData.hourlyRate || 5,
      }
    } catch (error) {
      console.error("Error creating workspace:", error)
      // Check if it's a permission error
      if (
        error.message &&
        (error.message.includes("permission") ||
          error.message.includes("not authorized") ||
          error.message.includes("not allowed"))
      ) {
        throw new Error("You don't have permission to add a workspace")
      }
      throw error
    }
  },

  checkAvailability: async (workspaceId, date, startTime, endTime) => {
    try {
      const response = await fetchAPI(`/booking/workspace/${workspaceId}/check-availability/`, {
        method: "POST",
        body: { date, start_time: startTime, end_time: endTime },
      })
      return response
    } catch (error) {
      console.error("Error checking availability:", error)

      // Return a default response
      return {
        available: false,
        workspace: null,
        overlappingBookings: [],
      }
    }
  },
}

/**
 * Booking API methods
 */
export const bookingApi = {
  getAll: async () => {
    try {
      const data = await fetchAPI("/booking/list/")
      return data.map((booking) => ({
        id: booking.id,
        title:
          booking.title ||
          (booking.desk
            ? `Desk Booking: ${booking.desk.name}`
            : `Meeting Room: ${booking.meeting_room?.name || "Unknown"}`),
        workspaceId: booking.work_space?.id,
        workspaceName: booking.workspace_name || booking.desk?.name || booking.meeting_room?.name || "Unknown",
        date: booking.date || new Date(booking.start_time).toISOString().split("T")[0],
        startTime: booking.start_time
          ? typeof booking.start_time === "string" && booking.start_time.includes("T")
            ? booking.start_time.split("T")[1].substring(0, 5)
            : booking.start_time
          : "09:00",
        endTime: booking.end_time
          ? typeof booking.end_time === "string" && booking.end_time.includes("T")
            ? booking.end_time.split("T")[1].substring(0, 5)
            : booking.end_time
          : "10:00",
        attendees: booking.attendees || [],
        userId: booking.user,
        status: booking.status || "confirmed",
        createdAt: booking.booking_date || booking.created_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error("Error fetching bookings:", error)
      // Return empty array if API fails
      return []
    }
  },

  getByUser: async (userId) => {
    try {
      const data = await fetchAPI("/booking/list/")
      return data.map((booking) => ({
        id: booking.id,
        title:
          booking.title ||
          (booking.desk
            ? `Desk Booking: ${booking.desk.name}`
            : `Meeting Room: ${booking.meeting_room?.name || "Unknown"}`),
        workspaceId: booking.work_space?.id,
        workspaceName: booking.workspace_name || booking.desk?.name || booking.meeting_room?.name || "Unknown",
        date: booking.date || new Date(booking.start_time).toISOString().split("T")[0],
        startTime: booking.start_time
          ? typeof booking.start_time === "string" && booking.start_time.includes("T")
            ? booking.start_time.split("T")[1].substring(0, 5)
            : booking.start_time
          : "09:00",
        endTime: booking.end_time
          ? typeof booking.end_time === "string" && booking.end_time.includes("T")
            ? booking.end_time.split("T")[1].substring(0, 5)
            : booking.end_time
          : "10:00",
        attendees: booking.attendees || [],
        userId: booking.user,
        status: booking.status || "confirmed",
        createdAt: booking.booking_date || booking.created_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error("Error fetching user bookings:", error)
      // Return empty array if API fails
      return []
    }
  },

  create: async (bookingData) => {
    try {
      console.log("Creating booking with data:", bookingData)

      // Convert frontend booking data to backend format
      const backendData = {
        title: bookingData.title,
        work_space: bookingData.workspaceId,
        date: bookingData.date,
        start_time: `${bookingData.date}T${bookingData.startTime}:00`,
        end_time: `${bookingData.date}T${bookingData.endTime}:00`,
        status: bookingData.status || "confirmed",
        attendees: bookingData.attendees || [],
        notes: bookingData.notes || "",
        // If we know if it's a desk or meeting room, include that info
        ...(bookingData.deskId ? { desk: bookingData.deskId } : {}),
        ...(bookingData.meetingRoomId ? { meeting_room: bookingData.meetingRoomId } : {}),
      }

      console.log("Sending booking data to backend:", backendData)

      const response = await fetchAPI("/booking/create/", {
        method: "POST",
        body: backendData,
      })

      // Convert the response back to frontend format
      const createdBooking = {
        id: response.id,
        title: bookingData.title,
        workspaceId: bookingData.workspaceId,
        workspaceName: bookingData.workspaceName,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        attendees: bookingData.attendees || [],
        userId: response.user || bookingData.userId,
        status: response.status || "confirmed",
        createdAt: response.booking_date || response.created_at || new Date().toISOString(),
      }

      // Note: We don't need to manually create a notification here anymore
      // as the backend will automatically create it and send the email

      return createdBooking
    } catch (error) {
      console.error("Error creating booking:", error)
      throw error
    }
  },

  cancel: async (bookingId) => {
    try {
      const response = await fetchAPI(`/booking/${bookingId}/cancel/`, {
        method: "POST",
      })
      return response
    } catch (error) {
      console.error("Error cancelling booking:", error)
      throw error
    }
  },

  getById: async (id) => {
    try {
      const booking = await fetchAPI(`/booking/${id}/`)
      return {
        id: booking.id,
        title:
          booking.title ||
          (booking.desk
            ? `Desk Booking: ${booking.desk.name}`
            : `Meeting Room: ${booking.meeting_room?.name || "Unknown"}`),
        workspaceId: booking.work_space?.id,
        workspaceName: booking.desk?.name || booking.meeting_room?.name || booking.workspace_name|| "Unknown",
        date: booking.date || new Date(booking.start_time).toISOString().split("T")[0],
        startTime: booking.start_time
          ? typeof booking.start_time === "string" && booking.start_time.includes("T")
            ? booking.start_time.split("T")[1].substring(0, 5)
            : booking.start_time
          : "09:00",
        endTime: booking.end_time
          ? typeof booking.end_time === "string" && booking.end_time.includes("T")
            ? booking.end_time.split("T")[1].substring(0, 5)
            : booking.end_time
          : "10:00",
        attendees: booking.attendees || [],
        userId: booking.user,
        status: booking.status || "confirmed",
        createdAt: booking.booking_date || booking.created_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error fetching booking:", error)
      return null
    }
  },

  getAnalytics: async () => {
    // This can be implemented later if needed
    const bookings = await bookingApi.getAll()
    const workspaces = await workspaceApi.getAll()

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

/**
 * Notification API methods
 */
export const notificationApi = {
  getByUser: async (userId) => {
    try {
      const data = await fetchAPI("/booking/notifications/list/")
      return data.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.created_at,
        bookingId: notification.booking,
        read: notification.read || false,
      }))
    } catch (error) {
      console.error("Error fetching notifications:", error)
      return []
    }
  },

  create: async (userId, notification) => {
    try {
      const response = await fetchAPI("/booking/notifications/create/", {
        method: "POST",
        body: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          booking: notification.bookingId, // This matches the backend field name
        },
      })
      return response
    } catch (error) {
      console.error("Error creating notification:", error)
      throw error
    }
  },

  markAsRead: async (userId, notificationId) => {
    try {
      const response = await fetchAPI(`/booking/notifications/${notificationId}/mark-as-read/`, {
        method: "POST",
      })
      return response
    } catch (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  },
}

// Create a simple email service for frontend notifications
export const emailService = {
  sendBookingConfirmation: async (booking, recipients) => {
    try {
      // In a real app, this would call an API endpoint to send emails
      console.log("Sending booking confirmation email to:", recipients)
      console.log("Booking details:", booking)

      // For now, just log the email that would be sent
      return {
        success: true,
        message: `Email would be sent to ${recipients.join(", ")} for booking ${booking.id}`,
      }
    } catch (error) {
      console.error("Error sending booking confirmation email:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },

  sendBookingCancellation: async (booking, recipients) => {
    try {
      // In a real app, this would call an API endpoint to send emails
      console.log("Sending booking cancellation email to:", recipients)
      console.log("Booking details:", booking)

      // For now, just log the email that would be sent
      return {
        success: true,
        message: `Cancellation email would be sent to ${recipients.join(", ")} for booking ${booking.id}`,
      }
    } catch (error) {
      console.error("Error sending booking cancellation email:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  },
}

export default fetchAPI
