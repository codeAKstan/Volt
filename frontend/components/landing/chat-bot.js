"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageSquare, X, Send, Zap, ChevronDown } from "lucide-react"

// Comprehensive knowledge base from the Volt Workspace PDF
const voltKnowledgeBase = {
  overview: "Volt Workspace is an innovative, AI-powered workspace booking solution designed to streamline how users discover, reserve, and manage workspaces. The platform caters to freelancers, remote workers, startups, and companies seeking efficient, smart, and accessible spaces to work from.",
  
  features: [
    "Search for nearby or specialized workspaces",
    "View availability in real-time",
    "Filter based on preferences (e.g., Wi-Fi, power outlets, quiet zones)",
    "Book instantly through an intuitive interface",
    "Interact with an integrated AI assistant for help and suggestions"
  ],
  
  objectives: [
    "Simplify workspace booking across locations",
    "Leverage AI to provide real-time assistance and smart recommendations",
    "Support workspace managers with backend tools for space monitoring and control",
    "Enable users to make fast and informed decisions on where and when to work"
  ],
  
  uniqueValue: "Volt Workspace redefines how people discover and book workspaces by merging the power of artificial intelligence with a clean, user-friendly interface. Unlike traditional booking platforms, Volt offers personalized, conversational assistance that understands user needs in real time and delivers tailored workspace recommendations.",
  
  uniqueFeatures: [
    "AI-Powered Booking Assistant: Users can interact with an AI to ask questions like, 'Where can I work quietly this afternoon?' and instantly receive smart suggestions.",
    "Location-Based, Real-Time Availability: Whether users need a private room, an open desk, or a meeting space, Volt shows real-time availability based on their location and preferences.",
    "Intuitive and Fast Booking Experience: No complex steps. Just search, ask, and book in seconds through a highly responsive UI.",
    "Support for Workspace Providers: Volt also caters to workspace owners with a management dashboard to monitor reservations, check-ins, and analytics, making operations smooth and efficient."
  ],
  
  userJourney: [
    "User Login/Signup: New users register or log in using email, Google, or preferred authentication. Users can set preferences such as location, type of workspace, or amenities.",
    "Ask the AI Assistant or Browse Manually: Users can chat with the AI assistant (e.g., 'Find me a quiet workspace for two people near Enugu this Friday at 2 PM.') or manually search/filter available spaces.",
    "Smart Recommendations & Availability: The platform returns personalized suggestions using real-time availability, user preferences, and workspace ratings and features (Wi-Fi, natural light, AC, etc.).",
    "Book a Workspace: Users select their desired time slot. Booking confirmation is shown instantly with details (location, duration, amenities).",
    "Get Notifications & Reminders: Users receive booking confirmations and reminders via email or in-app.",
    "View & Manage Bookings: Users can cancel, reschedule, or view past and upcoming bookings from their dashboard."
  ],
  
  adminWorkflow: "Workspace providers log in to: list new spaces, set availability schedules, monitor bookings in real-time, and analyze user traffic and preferences through the admin dashboard."
}

// Function to get a response based on user input
const getBotResponse = (message) => {
  const lowerMessage = message.toLowerCase()

  // Basic greeting responses
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello! I'm Volt Assistant. I can answer any questions you have about Volt Workspace. How can I help you today?"
  }
  
  // Overview questions
  if (lowerMessage.includes("what is volt") || lowerMessage.includes("about volt") || lowerMessage.includes("volt workspace")) {
    return (
      voltKnowledgeBase.overview +
      "\n\nKey Features:\n• " + voltKnowledgeBase.features.join("\n• ") +
      "\n\nObjectives:\n• " + voltKnowledgeBase.objectives.join("\n• ") +
      "\n\nUnique Value:\n" + voltKnowledgeBase.uniqueValue +
      "\n\nWhat Makes It Unique:\n• " + voltKnowledgeBase.uniqueFeatures.join("\n• ") +
      "\n\nUser Journey:\n1. " + voltKnowledgeBase.userJourney.join("\n2. ") +
      "\n\nAdmin Workflow:\n" + voltKnowledgeBase.adminWorkflow
    )
  }
  
  // Features questions
  if (lowerMessage.includes("feature") || lowerMessage.includes("what can volt do") || lowerMessage.includes("capabilities")) {
    return `Volt Workspace offers the following features:\n• ${voltKnowledgeBase.features.join("\n• ")}`
  }
  
  // Objectives questions
  if (lowerMessage.includes("objective") || lowerMessage.includes("goal") || lowerMessage.includes("aim")) {
    return `Volt Workspace has the following key objectives:\n• ${voltKnowledgeBase.objectives.join("\n• ")}`
  }
  
  // Unique value proposition questions
  if (lowerMessage.includes("unique") || lowerMessage.includes("different") || lowerMessage.includes("special") || lowerMessage.includes("value")) {
    return voltKnowledgeBase.uniqueValue
  }
  
  // Unique features questions
  if (lowerMessage.includes("unique feature") || lowerMessage.includes("special feature")) {
    return `What makes Volt Workspace unique:\n• ${voltKnowledgeBase.uniqueFeatures.join("\n• ")}`
  }
  
  // How it works questions
  if (lowerMessage.includes("how it works") || lowerMessage.includes("how does it work") || lowerMessage.includes("process") || lowerMessage.includes("steps")) {
    return `Here's how Volt Workspace works for users:\n\n${voltKnowledgeBase.userJourney.join("\n\n")}`
  }
  
  // Admin workflow questions
  if (lowerMessage.includes("admin") || lowerMessage.includes("workspace owner") || lowerMessage.includes("provider") || lowerMessage.includes("management")) {
    return `For workspace owners and administrators: ${voltKnowledgeBase.adminWorkflow}`
  }
  
  // Booking questions
  if (lowerMessage.includes("book") || lowerMessage.includes("reserve") || lowerMessage.includes("workspace")) {
    return "To book a workspace with Volt, you can either chat with our AI assistant with your requirements (like 'Find me a quiet workspace for two people near downtown this Friday at 2 PM') or manually browse and filter available spaces. Once you find a suitable space, you can select your desired time slot and receive instant booking confirmation with all the details."
  }
  
  // AI assistant questions
  if (lowerMessage.includes("ai assistant") || lowerMessage.includes("assistant")) {
    return "Volt's AI Assistant allows you to interact conversationally to find workspaces. You can ask natural language questions like 'Where can I work quietly this afternoon?' and instantly receive smart suggestions based on your preferences and real-time availability."
  }
  
  // Notifications questions
  if (lowerMessage.includes("notification") || lowerMessage.includes("reminder")) {
    return "Volt Workspace sends booking confirmations and reminders via email or in-app notifications, so you never miss your reservation."
  }
  
  // Managing bookings questions
  if (lowerMessage.includes("manage booking") || lowerMessage.includes("cancel") || lowerMessage.includes("reschedule")) {
    return "You can easily view, cancel, reschedule, or check your past and upcoming bookings from your Volt Workspace dashboard."
  }

  // Pricing questions (not explicitly mentioned in PDF, but a common question)
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("plan") || lowerMessage.includes("subscription")) {
    return (
      "Volt Workspace offers flexible pricing plans tailored to individuals, teams, and workspace providers. " +
      "Visit our website for current rates or contact our sales team for enterprise options."
    )
  }
  
  // Demo questions
  if (lowerMessage.includes("demo") || lowerMessage.includes("show") || lowerMessage.includes("presentation")) {
    return "I'd be happy to help you schedule a demo of Volt Workspace. Would you like me to connect you with our sales team?"
  }
  
  // Fallback response
  return "I'm not sure I understand that question. You can ask me about what Volt Workspace is, its features, how the booking process works, how workspace providers can use it, or any other aspect of our platform. How can I help you learn more about Volt Workspace?"
}

// TypewriterText component to animate bot messages
function TypewriterText({ text, speed = 20, onDone }) {
  const [displayed, setDisplayed] = useState("")
  const indexRef = useRef(0)
  useEffect(() => {
    setDisplayed("")
    indexRef.current = 0
    const id = setInterval(() => {
      const next = indexRef.current + 1
      setDisplayed(text.slice(0, next))
      indexRef.current = next
      if (next >= text.length) {
        clearInterval(id)
        if (onDone) onDone()
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return <p className="text-sm whitespace-pre-line">{displayed}</p>
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, content: "Hello! I'm Volt Assistant. I can answer questions about Volt Workspace and help you find and book the perfect workspace. How can I help you today?", sender: "bot" },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = { id: Date.now(), content: inputValue, sender: "user" }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot typing
    setIsTyping(true)

    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponse = { id: Date.now() + 1, content: getBotResponse(inputValue), sender: "bot" }
      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      {/* Transparent backdrop to close chat on outside click */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={toggleChat} />}
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                height: isMinimized ? "auto" : "500px",
              }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <Card className="w-[400px] shadow-2xl rounded-xl bg-white/90 backdrop-blur-md border border-gray-200">
                <CardHeader className="p-4 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-xl">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Zap className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-sm">Volt Assistant</h3>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={toggleMinimize} className="h-8 w-8">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleChat} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                {!isMinimized && (
                  <>
                    <CardContent className="p-4 h-[350px] overflow-y-auto">
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
                          >
                            {message.sender === "bot" && (
                              <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  <Zap className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`rounded-lg px-3 py-2 max-w-[80%] ${message.sender === "user" ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                              {message.sender === "user" ? (
                                <p className="text-sm whitespace-pre-line">{message.content}</p>
                              ) : (
                                <TypewriterText text={message.content} />
                              )}
                            </div>
                          </motion.div>
                        ))}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-start mb-4"
                          >
                            <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <Zap className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg px-3 py-2 bg-muted">
                              <div className="flex space-x-1">
                                <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce"></div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                      </AnimatePresence>
                    </CardContent>
                    <CardFooter className="p-3 border-t">
                      <div className="flex w-full space-x-2">
                        <Input
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask about Volt Workspace..."
                          className="flex-1"
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={!inputValue.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={toggleChat}
          className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MessageSquare className="h-6 w-6" />
        </motion.button>
      </div>
    </>
  )
}