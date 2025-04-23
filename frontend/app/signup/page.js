"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, User, Mail, Lock, Briefcase, Zap, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "EMPLOYEE",
  })
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState("")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
    if (generalError) {
      setGeneralError("")
    }
  }

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }))
    // Clear role error if it exists
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: null }))
    }
  }

  // Update the handleSubmit function to better handle errors
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" })
      return
    }

    setIsLoading(true)

    try {
      // Map frontend form data to backend expected format
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        phone_number: formData.phoneNumber,
        role: formData.role,
      }

      // Use the signup function from auth context
      await signup(userData)
      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (error) {
      console.error("Signup error:", error)

      // Handle validation errors
      if (error.formattedErrors) {
        // Map backend errors to frontend fields
        const backendErrors = error.formattedErrors
        const newErrors = {}
        let hasSetError = false

        // Handle email errors - specifically check for uniqueness violations
        if (backendErrors.email) {
          const emailError = Array.isArray(backendErrors.email) ? backendErrors.email[0] : backendErrors.email

          // Check specifically for email uniqueness error with the exact message
          if (emailError === "This field must be unique.") {
            newErrors.email = "Email already exists"
          }
          // Also keep the other checks for different error messages
          else if (
            emailError.toLowerCase().includes("already exists") ||
            emailError.toLowerCase().includes("already in use") ||
            emailError.toLowerCase().includes("unique")
          ) {
            newErrors.email = "Email already exists"
          } else {
            newErrors.email = emailError
          }
          hasSetError = true
        }

        // Handle role errors - specifically for admin role restrictions
        if (backendErrors.role) {
          const roleError = Array.isArray(backendErrors.role) ? backendErrors.role[0] : backendErrors.role

          // Check specifically for admin permission error
          if (roleError.toLowerCase().includes("superuser") || roleError.toLowerCase().includes("admin account")) {
            newErrors.role = "Only administrators can create admin accounts. Please select a different role."
          } else {
            newErrors.role = roleError
          }
          hasSetError = true
        }

        // Handle password errors with clear messaging
        if (backendErrors.password) {
          newErrors.password = Array.isArray(backendErrors.password)
            ? backendErrors.password[0]
            : backendErrors.password
          hasSetError = true
        }

        // Handle password confirmation errors
        if (backendErrors.password2) {
          newErrors.confirmPassword = Array.isArray(backendErrors.password2)
            ? backendErrors.password2[0]
            : backendErrors.password2
          hasSetError = true
        }

        // Handle other field errors
        const fieldMappings = {
          first_name: "firstName",
          last_name: "lastName",
          phone_number: "phoneNumber",
        }

        // Process each field mapping
        Object.entries(fieldMappings).forEach(([backendField, frontendField]) => {
          if (backendErrors[backendField]) {
            newErrors[frontendField] = Array.isArray(backendErrors[backendField])
              ? backendErrors[backendField][0]
              : backendErrors[backendField]
            hasSetError = true
          }
        })

        // General error (non-field errors)
        if (backendErrors.non_field_errors || backendErrors.detail || backendErrors.error) {
          const message = backendErrors.non_field_errors || backendErrors.detail || backendErrors.error
          setGeneralError(Array.isArray(message) ? message[0] : message)
          hasSetError = true
        }

        // Set all collected errors
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
        } else if (!hasSetError) {
          // If no specific errors were found but we have backend errors
          setGeneralError("An error occurred during signup. Please try again.")
        }
      } else if (error.message) {
        // Check if the error message contains the uniqueness error for email
        if (error.message.includes("This field must be unique") && error.message.toLowerCase().includes("email")) {
          setErrors({ email: "Email already exists" })
        } else {
          // Handle error with message
          setGeneralError(error.message)
        }
      } else {
        // Handle network or unexpected errors
        setGeneralError("An unexpected error occurred. Please try again later.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSuccess = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <div className="container mx-auto px-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 bg-card rounded-xl shadow-lg"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4"
            >
              <Zap className="h-6 w-6" />
            </motion.div>
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-foreground/70 mt-2">Sign up to get started</p>
          </div>

          <OAuthButtons onSuccess={handleOAuthSuccess} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs text-muted-foreground">OR CONTINUE WITH EMAIL</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <Alert variant="destructive" className="text-sm py-2">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  First name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.firstName ? "border-destructive" : ""
                  }`}
                />
                {errors.firstName && <p className="text-destructive text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.lastName ? "border-destructive" : ""
                  }`}
                />
                {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName}</p>}
              </div>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                  errors.email ? "border-destructive" : ""
                }`}
              />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Label htmlFor="phoneNumber" className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                  errors.phoneNumber ? "border-destructive" : ""
                }`}
              />
              {errors.phoneNumber && <p className="text-destructive text-sm mt-1">{errors.phoneNumber}</p>}
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="role" className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                Role
              </Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger
                  className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                    errors.role ? "border-destructive" : ""
                  }`}
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="LEARNER">Learner</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-destructive text-sm mt-1">{errors.role}</p>}
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="password" className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                  errors.password ? "border-destructive" : ""
                }`}
              />
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                  errors.confirmPassword ? "border-destructive" : ""
                }`}
              />
              {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            className="mt-6 text-center text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
