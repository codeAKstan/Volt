"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  ArrowRight,
  Building,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Zap,
  Sparkles,
  Globe,
  Shield,
  Smartphone,
  Laptop,
  Menu,
  X,
} from "lucide-react"
import { ChatBot } from "@/components/landing/chat-bot"
import { Marquee } from "@/components/landing/marquee"
import { Testimonials } from "@/components/landing/testimonials"
import { StatsSection } from "@/components/landing/stats-section"
import { FaqSection } from "@/components/landing/faq-section"
import { HeroTypewriter } from "@/components/ui/hero-typewriter"
import { workspaceApi } from "@/lib/api-client"

export default function Home() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [availableSpaces, setAvailableSpaces] = useState(0) // Add availableSpaces state
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch available workspaces count
  useEffect(() => {
    const fetchAvailableSpaces = async () => {
      try {
        const workspaces = await workspaceApi.getAll()
        const availableCount = workspaces.filter((w) => w.available).length
        setAvailableSpaces(availableCount)
      } catch (error) {
        console.error("Error fetching available spaces:", error)
        // Default to 0 if there's an error
        setAvailableSpaces(0)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableSpaces()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const handleBookDemo = () => {
    router.push("/contact")
  }

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
    { name: "Dashboard", href: "/dashboard" },
  ]

  const typewriterPhrases = [
    "Workspace Bookings",
    "Meeting Room Management",
    "Desk Reservations",
    "Office Space Optimization",
    "Video Conferencing",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-primary font-bold text-2xl flex items-center"
            >
              <Zap className="mr-2 h-6 w-6" />
              Volt
            </motion.div>
          </Link>
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground/80 hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center space-x-2">
              <ModeToggle />
              <Link href="/login" className="hidden md:block">
                <Button variant="outline" className="hover:scale-105 transition-transform">
                  Log In
                </Button>
              </Link>
              <Link href="/signup" className="hidden md:block">
                <Button className="hover:scale-105 transition-transform">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background border-t"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground/80 hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-5 overflow-hidden relative">
          {/* Background elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 1 }}
              className="absolute top-20 right-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="absolute bottom-20 left-[5%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
            />
          </div>

          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <motion.div
                className="md:w-1/2 mb-10 md:mb-0"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  Simplify Your{" "}
                  <span className="text-primary relative">
                    <HeroTypewriter phrases={typewriterPhrases} typingSpeed={80} />
                    <motion.span
                      className="absolute bottom-1 left-0 w-full h-2 bg-primary/20 rounded-full -z-10"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </span>
                </h1>
                <p className="text-xl text-foreground/70 mb-8">
                  Volt helps you manage workspace availability and provides data-driven insights for efficient office
                  space usage.
                </p>
                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Button size="lg" className="group animate-bounce" onClick={() => router.push("/signup")}>
                    Get Started
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleBookDemo}>
                    Book a Demo
                  </Button>
                </motion.div>

                <motion.div
                  className="mt-8 flex items-center gap-4 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-1" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-1" />
                    <span>Free 14-day trial</span>
                  </div>
                </motion.div>
              </motion.div>

              <div className="md:w-1/2 relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="relative z-10"
                >
                  <div className="bg-gradient-to-r from-primary/20 to-purple-400/10 rounded-2xl p-6 shadow-xl">
                    <img
                      src="/lp.png?height=400&width=600"
                      alt="Volt Dashboard Preview"
                      className="rounded-lg shadow-lg"
                    />

                    {/* Floating elements */}
                    <motion.div
                      className="absolute -top-6 -left-6 bg-background rounded-lg shadow-lg p-4 flex items-center space-x-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Easy Booking</span>
                    </motion.div>

                    <motion.div
                      className="absolute -bottom-6 -right-6 bg-background rounded-lg shadow-lg p-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <div className="w-3 h-3 bg-green-500 rounded-full pulse"></div>
                        <span>{loading ? "Loading..." : `${availableSpaces} Available Spaces`}</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Decorative elements */}
                <div className="absolute -z-10 top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    className="w-64 h-64 rounded-full border-4 border-dashed border-primary/20"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section with Marquee */}
        <section className="py-12 bg-muted/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <p className="text-lg text-foreground/60">Trusted by innovative companies</p>
            </motion.div>

            <Marquee speed={15} pauseOnHover={true}>
              {["Acme Inc", "Globex", "Soylent Corp", "Initech", "Umbrella", "ALX", "TechCorp", "Innovate"].map(
                (company, index) => (
                  <motion.div
                    key={company}
                    className="text-foreground/40 font-semibold text-xl mx-12 flex items-center"
                    whileHover={{ scale: 1.1, color: "var(--primary)" }}
                  >
                    {company === "ALX" ? <span className="text-primary font-bold">{company}</span> : company}
                  </motion.div>
                ),
              )}
            </Marquee>
          </div>
        </section>

        {/* Stats Section */}
        <StatsSection />

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Everything you need to manage your workspace efficiently
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Calendar className="h-10 w-10 text-primary" />,
                  title: "Smart Booking System",
                  description: "Browse and book available workspaces in real-time with just a few clicks.",
                },
                {
                  icon: <Building className="h-10 w-10 text-primary" />,
                  title: "Workspace Management",
                  description: "Easily manage different types of spaces: desks, meeting rooms, and event halls.",
                },
                {
                  icon: <Clock className="h-10 w-10 text-primary" />,
                  title: "Notifications & Reminders",
                  description: "Never miss a booking with automated email notifications and reminders.",
                },
                {
                  icon: <Users className="h-10 w-10 text-primary" />,
                  title: "Role-Based Access",
                  description: "Different permissions for admins, employees, and learners.",
                },
                {
                  icon: <Sparkles className="h-10 w-10 text-primary" />,
                  title: "Analytics Dashboard",
                  description: "Track workspace usage, peak hours, and occupancy trends with visual reports.",
                },
                {
                  icon: <Zap className="h-10 w-10 text-primary" />,
                  title: "AI-Powered Suggestions",
                  description: "Get personalized workspace recommendations based on your preferences and history.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg inline-block">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-foreground/70">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Volt makes workspace booking simple and efficient
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-primary/20 -translate-y-1/2 z-0"></div>

              {[
                {
                  step: "01",
                  title: "Find a Space",
                  description: "Browse available workspaces based on your preferences and requirements.",
                  icon: <Globe className="h-6 w-6 text-foreground" />,
                },
                {
                  step: "02",
                  title: "Book Instantly",
                  description: "Select your desired time slot and confirm your booking with just a few clicks.",
                  icon: <Zap className="h-6 w-6 text-foreground" />,
                },
                {
                  step: "03",
                  title: "Manage Easily",
                  description: "Receive confirmations, modify bookings, and get reminders before your scheduled time.",
                  icon: <Shield className="h-6 w-6 text-foreground" />,
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center relative z-10"
                >
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4 relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {step.step}
                    <div className="absolute -right-1 -top-1 bg-background rounded-full p-1 border border-border">
                      {step.icon}
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-foreground/70">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials">
          <Testimonials />
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Choose the plan that works best for your organization
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "$9",
                  description: "Perfect for small teams",
                  features: [
                    "Up to 10 users",
                    "Basic booking system",
                    "Email notifications",
                    "5 workspace types",
                    "Basic reporting",
                  ],
                  cta: "Get Started",
                  highlighted: false,
                  icon: <Smartphone className="h-5 w-5" />,
                },
                {
                  name: "Professional",
                  price: "$29",
                  description: "Ideal for growing companies",
                  features: [
                    "Up to 50 users",
                    "Advanced booking system",
                    "SMS & email notifications",
                    "Unlimited workspace types",
                    "Advanced analytics",
                    "Calendar integration",
                    "Priority support",
                  ],
                  cta: "Get Started",
                  highlighted: true,
                  icon: <Laptop className="h-5 w-5" />,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description: "For large organizations",
                  features: [
                    "Unlimited users",
                    "Custom booking rules",
                    "Advanced integrations",
                    "Dedicated account manager",
                    "Custom reporting",
                    "API access",
                    "24/7 premium support",
                  ],
                  cta: "Contact Sales",
                  highlighted: false,
                  icon: <Building className="h-5 w-5" />,
                },
              ].map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className={`bg-card rounded-xl p-6 shadow-sm ${
                    plan.highlighted ? "ring-2 ring-primary shadow-lg relative" : ""
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-end justify-center mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-foreground/70 ml-1">/month</span>}
                    </div>
                    <p className="text-foreground/70">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.highlighted ? "bg-primary hover:bg-primary/90" : ""}`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => router.push("/signup")}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq">
          <FaqSection />
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-2xl p-10 text-center max-w-4xl mx-auto relative overflow-hidden"
            >
              {/* Background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full"
                  animate={{
                    x: [0, 10, 0],
                    y: [0, 15, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />
                <motion.div
                  className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full"
                  animate={{
                    x: [0, -10, 0],
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative z-10"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your workspace?</h2>
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  Join thousands of companies that use Volt to manage their workspace efficiently.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="hover:scale-105 transition-transform"
                    onClick={() => router.push("/signup")}
                  >
                    Get Started for Free
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white hover:bg-white/10 hover:scale-105 transition-transform"
                    onClick={handleBookDemo}
                  >
                    Schedule a Demo
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-primary mb-4 flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Volt
              </div>
              <p className="text-foreground/70 mb-4">
                Simplify workspace bookings, manage availability, and get data-driven insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-foreground/70 hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-foreground/70 hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-foreground/70 hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-foreground/70 text-sm">© {new Date().getFullYear()} Volt. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-foreground/70 hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <ChatBot />
    </div>
  )
}
