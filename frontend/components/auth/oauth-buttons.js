"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"

export function OAuthButtons({ onSuccess }) {
  const { login } = useAuth()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false)

  // Note: These OAuth methods would need to be implemented on your Django backend
  // For now, we'll keep the mock implementation but with a note that this is where
  // you would integrate with your backend OAuth endpoints

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      // This would call your backend OAuth endpoint
      // For now, we'll simulate a successful login
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock user data - in a real implementation, this would come from your backend
      const mockUser = {
        id: "user_123",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "EMPLOYEE",
      }

      // Store the user data
      localStorage.setItem("volt_user", JSON.stringify(mockUser))

      toast.success("Successfully signed in with Google")
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Google login error:", error)
      toast.error(error.message || "Failed to sign in with Google")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setIsAppleLoading(true)
    try {
      // This would call your backend OAuth endpoint
      // For now, we'll simulate a successful login
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock user data - in a real implementation, this would come from your backend
      const mockUser = {
        id: "user_456",
        email: "apple_user@example.com",
        firstName: "Jane",
        lastName: "Smith",
        role: "EMPLOYEE",
      }

      // Store the user data
      localStorage.setItem("volt_user", JSON.stringify(mockUser))

      toast.success("Successfully signed in with Apple")
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Apple login error:", error)
      toast.error("Failed to sign in with Apple")
    } finally {
      setIsAppleLoading(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true)
    try {
      // This would call your backend OAuth endpoint
      // For now, we'll simulate a successful login
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock user data - in a real implementation, this would come from your backend
      const mockUser = {
        id: "user_789",
        email: "ms_user@example.com",
        firstName: "Alex",
        lastName: "Johnson",
        role: "EMPLOYEE",
      }

      // Store the user data
      localStorage.setItem("volt_user", JSON.stringify(mockUser))

      toast.success("Successfully signed in with Microsoft")
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Microsoft login error:", error)
      toast.error("Failed to sign in with Microsoft")
    } finally {
      setIsMicrosoftLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-3">
      <Button
        variant="outline"
        type="button"
        disabled={isGoogleLoading}
        onClick={handleGoogleLogin}
        className="flex items-center justify-center"
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        type="button"
        disabled={isAppleLoading}
        onClick={handleAppleLogin}
        className="flex items-center justify-center"
      >
        {isAppleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M16.7 7.1c-1.3 0-2.4.7-3.1 1.8-.7-1.1-1.8-1.8-3.1-1.8-2 0-3.7 1.7-3.7 3.7 0 3.1 5.5 7.4 6.8 7.4 1.3 0 6.8-4.3 6.8-7.4 0-2-1.7-3.7-3.7-3.7z"
              fill="currentColor"
            />
          </svg>
        )}
        Continue with Apple
      </Button>

      <Button
        variant="outline"
        type="button"
        disabled={isMicrosoftLoading}
        onClick={handleMicrosoftLogin}
        className="flex items-center justify-center"
      >
        {isMicrosoftLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M11.4 24H0V12.6h11.4V24z" fill="#F1511B" />
            <path d="M24 24H12.6V12.6H24V24z" fill="#80CC28" />
            <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#00ADEF" />
            <path d="M24 11.4H12.6V0H24v11.4z" fill="#FBBC09" />
          </svg>
        )}
        Continue with Microsoft
      </Button>
    </div>
  )
}
