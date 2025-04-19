"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar, DashboardSidebarWrapper } from "@/components/dashboard/sidebar"
import { useAuth, AuthProvider } from "@/lib/auth"
import { SidebarInset } from "@/components/ui/sidebar"
import { LoadingAnimation } from "@/components/ui/loading-animation"

function DashboardLayoutContent({ children }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  if (!user) {
    return null // Don't render anything while redirecting
  }

  return (
    <DashboardSidebarWrapper>
      <DashboardSidebar />
      <SidebarInset className="flex flex-col">
        <DashboardHeader />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-auto p-4 md:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </SidebarInset>
    </DashboardSidebarWrapper>
  )
}

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  )
}
