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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters long" })
      setIsLoading(false)
      return
    }

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
      if (error.response && error.response.data) {
        setErrors(error.response.data)
      } else if (error.message) {
        // Handle string error messages
        setErrors({ general: error.message })
      } else {
        toast.error("Failed to create account. Please try again.")
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
            {errors.general && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                {errors.general}
              </div>
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
                    errors.first_name ? "border-destructive" : ""
                  }`}
                />
                {errors.first_name && <p className="text-destructive text-sm mt-1">{errors.first_name}</p>}
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
                    errors.last_name ? "border-destructive" : ""
                  }`}
                />
                {errors.last_name && <p className="text-destructive text-sm mt-1">{errors.last_name}</p>}
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
                  errors.phone_number ? "border-destructive" : ""
                }`}
              />
              {errors.phone_number && <p className="text-destructive text-sm mt-1">{errors.phone_number}</p>}
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
              {formData.role === "ADMIN" && (
                <p className="text-xs text-amber-500">Note: Admin accounts require approval</p>
              )}
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
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
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
                  errors.confirmPassword || errors.password2 ? "border-destructive" : ""
                }`}
              />
              {(errors.confirmPassword || errors.password2) && (
                <p className="text-destructive text-sm mt-1">{errors.confirmPassword || errors.password2}</p>
              )}
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
