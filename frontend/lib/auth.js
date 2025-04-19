// lib/auth.js
"use client"
import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "@/lib/api-client"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if we have stored tokens
        const token = localStorage.getItem("volt_access_token")

        if (token) {
          // Fetch current user
          const userData = await authAPI.getCurrentUser()
          if (userData) {
            setUser(userData)
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        // If there's an error, clear tokens and user
        authAPI.logout()
        setUser(null)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    checkAuthStatus()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true)
      const data = await authAPI.login(email, password)

      // Store tokens in localStorage
      localStorage.setItem("volt_access_token", data.tokens.access)
      localStorage.setItem("volt_refresh_token", data.tokens.refresh)

      // Set user in state
      setUser(data.user)

      return data.user
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Signup function
  const signup = async (userData) => {
    try {
      setLoading(true)

      // First create the user
      const response = await authAPI.signup(userData)

      // Then automatically log them in
      const loginData = await authAPI.login(userData.email, userData.password)

      // Store tokens in localStorage
      localStorage.setItem("volt_access_token", loginData.tokens.access)
      localStorage.setItem("volt_refresh_token", loginData.tokens.refresh)

      // Set user in state
      setUser(loginData.user)

      return loginData.user
    } catch (error) {
      console.error("Signup error:", error)

      // Format error response for better handling
      if (error.response && error.response.data) {
        // Pass the API error directly up to the component
        error.formattedErrors = error.response.data
        throw error
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error("No response from server. Please check your internet connection and try again.")
      } else {
        // For network errors or other issues
        throw new Error(error.message || "Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    authAPI.logout()
    setUser(null)
  }

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      setLoading(true)
      const updatedUser = await authAPI.updateProfile(userData)
      setUser({ ...user, ...updatedUser })
      return updatedUser
    } catch (error) {
      console.error("Profile update error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        initialized,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
