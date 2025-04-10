"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, CreditCard, Loader2, Building, Calendar, Users, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [processing, setProcessing] = useState(false)

  const plans = [
    {
      id: "basic",
      name: "Basic",
      description: "Perfect for small teams",
      price: billingCycle === "monthly" ? 9 : 90,
      features: [
        "Up to 10 users",
        "Basic booking system",
        "Email notifications",
        "5 workspace types",
        "Basic reporting",
      ],
      popular: false,
    },
    {
      id: "professional",
      name: "Professional",
      description: "Ideal for growing companies",
      price: billingCycle === "monthly" ? 29 : 290,
      features: [
        "Up to 50 users",
        "Advanced booking system",
        "SMS & email notifications",
        "Unlimited workspace types",
        "Advanced analytics",
        "Calendar integration",
        "Priority support",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations",
      price: billingCycle === "monthly" ? 99 : 990,
      features: [
        "Unlimited users",
        "Custom booking rules",
        "Advanced integrations",
        "Dedicated account manager",
        "Custom reporting",
        "API access",
        "24/7 premium support",
      ],
      popular: false,
    },
  ]

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setCheckoutOpen(true)
  }

  const handleCheckout = async () => {
    setProcessing(true)

    try {
      // In a real app, this would process the payment
      // For demo purposes, we'll simulate a successful payment after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setCheckoutOpen(false)
      toast.success(`Successfully subscribed to ${selectedPlan.name} plan!`)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("Failed to process payment. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pricing & Plans</h2>
          <p className="text-muted-foreground">Choose the plan that works best for your organization</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Tabs defaultValue="monthly" value={billingCycle} onValueChange={setBillingCycle} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual (Save 20%)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`flex h-full flex-col ${plan.popular ? "border-primary shadow-md" : ""}`}>
              <CardHeader>
                {plan.popular && <Badge className="w-fit bg-primary text-primary-foreground">Most Popular</Badge>}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="ml-1 text-muted-foreground">/{billingCycle === "monthly" ? "month" : "year"}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {plan.id === "enterprise" ? "Contact Sales" : "Subscribe Now"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <Separator className="my-8" />

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Premium Features</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Building className="h-10 w-10 text-primary" />,
              title: "Advanced Workspace Management",
              description: "Customize workspace types, set booking rules, and manage capacity limits.",
            },
            {
              icon: <Calendar className="h-10 w-10 text-primary" />,
              title: "Calendar Integration",
              description: "Sync with Google Calendar and Outlook for seamless scheduling.",
            },
            {
              icon: <Users className="h-10 w-10 text-primary" />,
              title: "Team Management",
              description: "Assign roles, set permissions, and manage team access to workspaces.",
            },
            {
              icon: <Shield className="h-10 w-10 text-primary" />,
              title: "Advanced Security",
              description: "Enhanced security features including SSO, 2FA, and audit logs.",
            },
            {
              icon: (
                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              ),
              title: "Advanced Analytics",
              description: "Detailed reports on workspace usage, occupancy trends, and cost analysis.",
            },
            {
              icon: (
                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: "AI-Powered Suggestions",
              description: "Get personalized workspace recommendations based on your preferences and history.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Subscribe to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Enter your payment details to subscribe to the {selectedPlan?.name} plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name on card</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-number">Card number</Label>
              <Input id="card-number" placeholder="4242 4242 4242 4242" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry">Expiry date</Label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billing-cycle">Billing cycle</Label>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger id="billing-cycle">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual (Save 20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${selectedPlan?.price}/{billingCycle === "monthly" ? "month" : "year"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
