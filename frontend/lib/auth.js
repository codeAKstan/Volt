"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "@/lib/api-client"
import { useRouter } from "next/navigation"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authAPI.getCurrentUser()
        if (userData) {
          setUser(userData)
        }
      } catch (error) {
        // Ignore errors related to authentication
        console.warn("Authentication check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const data = await authAPI.login(email, password)
      localStorage.setItem("volt_access_token", data.tokens.access)
      localStorage.setItem("volt_refresh_token", data.tokens.refresh)
      localStorage.setItem("volt_user", JSON.stringify(data.user))
      setUser(data.user)
    } finally {
      setLoading(false)
    }
  }

  const signup = async (userData) => {
    setLoading(true)
    try {
      const data = await authAPI.signup(userData)
      localStorage.setItem("volt_user", JSON.stringify(data.user))
      setUser(data.user)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem("volt_user", JSON.stringify(updatedUser))
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    router.push("/login")
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
