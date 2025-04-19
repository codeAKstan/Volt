"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("volt_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // Make API call to login
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Invalid credentials")
      }

      const data = await response.json()

      // Log the token for debugging
      console.log("Login response tokens:", data.tokens)

      // Store user data in localStorage
      localStorage.setItem("volt_user", JSON.stringify(data.user))

      // Also store the tokens separately for easier access
      if (data.tokens) {
        localStorage.setItem("volt_tokens", JSON.stringify(data.tokens))

        // Add tokens to the user object for convenience
        const userWithTokens = {
          ...data.user,
          tokens: data.tokens,
        }
        localStorage.setItem("volt_user", JSON.stringify(userWithTokens))
        setUser(userWithTokens)
      } else {
        setUser(data.user)
      }

      return data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  // Update the signup function to better handle and parse error responses
  const signup = async (userData) => {
    try {
      // Make API call to signup
      const response = await fetch("/api/auth/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Parse and format error messages from the backend
        const formattedErrors = {}

        // Handle specific error cases
        if (data.email) {
          formattedErrors.email = Array.isArray(data.email) ? data.email[0] : data.email
        }

        if (data.password) {
          formattedErrors.password = Array.isArray(data.password) ? data.password[0] : data.password
        }

        if (data.password2) {
          formattedErrors.confirmPassword = Array.isArray(data.password2) ? data.password2[0] : data.password2
        }

        if (data.role) {
          formattedErrors.role = Array.isArray(data.role) ? data.role[0] : data.role
        }

        if (data.non_field_errors) {
          formattedErrors.general = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors
        }

        // If we have no specific errors but the request failed, add a general error
        if (Object.keys(formattedErrors).length === 0) {
          formattedErrors.general = "Signup failed. Please try again."
        }

        throw { response: { data: formattedErrors } }
      }

      // After signup, automatically log in
      return await login(userData.email, userData.password)
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("volt_user")
    localStorage.removeItem("volt_tokens")
    setUser(null)
  }

  const updateProfile = (updatedUser) => {
    // Update user in state and localStorage
    const newUserData = { ...user, ...updatedUser }
    setUser(newUserData)
    localStorage.setItem("volt_user", JSON.stringify(newUserData))
  }

  // Get the authentication token
  const getAuthToken = () => {
    try {
      // Try to get the token from localStorage
      const userData = localStorage.getItem("volt_user")
      if (userData) {
        const user = JSON.parse(userData)
        return user.tokens?.access || null
      }

      // If not found in user data, try the separate tokens storage
      const tokensData = localStorage.getItem("volt_tokens")
      if (tokensData) {
        const tokens = JSON.parse(tokensData)
        return tokens.access || null
      }
    } catch (error) {
      console.error("Error getting auth token:", error)
    }
    return null
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, getAuthToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Export the getAuthToken function for use outside the context
export const getAuthToken = () => {
  try {
    // Try to get the token from localStorage
    const userData = localStorage.getItem("volt_user")
    if (userData) {
      const user = JSON.parse(userData)
      return user.tokens?.access || null
    }

    // If not found in user data, try the separate tokens storage
    const tokensData = localStorage.getItem("volt_tokens")
    if (tokensData) {
      const tokens = JSON.parse(tokensData)
      return tokens.access || null
    }
  } catch (error) {
    console.error("Error getting auth token:", error)
  }
  return null
}
