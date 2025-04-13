"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  BarChart3,
  Clock,
  Building,
  MessageSquare,
  Video,
  CreditCard,
  PlusCircle,
  Plug,
  User,
  Search,
  HelpCircle,
  Bell,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarProvider,
} from "@/components/ui/sidebar"

// Export the wrapper component
export function DashboardSidebarWrapper({ children }) {
  return <SidebarProvider>{children}</SidebarProvider>
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New booking",
      message: "Your booking for Meeting Room A has been confirmed",
      read: false,
    },
    {
      id: 2,
      title: "Booking reminder",
      message: "You have a booking in 30 minutes",
      read: true,
    },
  ])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to log out")
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length

  // Navigation items with role-based access
  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Workspaces",
      href: "/dashboard/workspaces",
      icon: Building,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Bookings",
      href: "/dashboard/bookings",
      icon: Calendar,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Workspace Calendar",
      href: "/dashboard/workspace-calendar",
      icon: Clock,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Availability",
      href: "/dashboard/availability",
      icon: Clock,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Chat",
      href: "/dashboard/chat",
      icon: MessageSquare,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Video Conference",
      href: "/dashboard/video-conference",
      icon: Video,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["ADMIN", "admin"],
    },
    {
      title: "Integrations",
      href: "/dashboard/integrations",
      icon: Plug,
      roles: ["ADMIN", "EMPLOYEE", "admin", "employee"],
    },
    {
      title: "Pricing",
      href: "/dashboard/pricing",
      icon: CreditCard,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["ADMIN", "EMPLOYEE", "LEARNER", "admin", "employee", "learner"],
    },
  ]

  // Filter navigation items based on user role
  // Default to showing all items if user role is not available
  const filteredNavItems = navItems.filter((item) => {
    if (!user || !user.role) return true
    return item.roles.includes(user.role)
  })

  // Filter navigation items based on search query
  const searchedNavItems = filteredNavItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Building className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">Volt</span>
          </Link>
        </div>
        <form className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <SidebarInput
              type="search"
              placeholder="Search..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {searchedNavItems.length > 0 ? (
                searchedNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-muted-foreground">No navigation items found</div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Create New Booking"
                  onClick={() => router.push("/dashboard/bookings/new")}
                >
                  <div>
                    <PlusCircle className="h-4 w-4" />
                    <span>New Booking</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Notifications">
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                    {unreadNotifications > 0 && <SidebarMenuBadge>{unreadNotifications}</SidebarMenuBadge>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Help & Support">
                  <div>
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard/profile" className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="/placeholder.svg" alt={user?.firstName} />
                  <AvatarFallback>
                    {user?.firstName?.[0] || "U"}
                    {user?.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user?.firstName || user?.first_name} {user?.lastName || user?.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{user?.role || "User"}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
