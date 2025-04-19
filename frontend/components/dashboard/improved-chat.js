"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User, Sparkles, Paperclip, Mic, ImageIcon, Copy, AlertCircle, MapPin, Building } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { TypewriterEffect } from "@/components/ui/typewriter-effect"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { sendMessageToAI } from "@/lib/api"
import { workspaceApi, bookingApi } from "@/lib/api-client"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

// Fallback responses in case of API failure
const fallbackResponses = {
  error: "I'm sorry, I'm having trouble connecting to the server. Please try again in a moment.",
  greeting: "Hello! I'm your Volt AI assistant. How can I help you with workspace bookings today?",
}

// Component to display workspace recommendations
const WorkspaceRecommendation = ({ workspace, onBook, onViewMore }) => {
  return (
    <div className="bg-muted/50 rounded-lg p-3 my-2 hover:bg-muted transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{workspace.name}</h4>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Building className="h-3 w-3 mr-1" />
            <span className="capitalize">{workspace.type}</span>
            {workspace.capacity && (
              <>
                <span className="mx-1">•</span>
                <span>Capacity: {workspace.capacity}</span>
              </>
            )}
          </div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{workspace.location}</span>
          </div>
          {workspace.hourlyRate && (
            <div className="text-xs text-muted-foreground mt-1">${workspace.hourlyRate}/hour</div>
          )}
        </div>
        <Button size="sm" onClick={() => onBook(workspace)}>
          Book
        </Button>
      </div>
    </div>
  )
}

// Component to display booking form in chat
const BookingForm = ({ workspace, onConfirm, onCancel }) => {
  const [date, setDate] = useState(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [title, setTitle] = useState(`Booking for ${workspace.name}`)
  const [loading, setLoading] = useState(false)
  const [availability, setAvailability] = useState(null)

  // Check availability when date or time changes
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const formattedDate = format(date, "yyyy-MM-dd")
        const result = await workspaceApi.checkAvailability(workspace.id, formattedDate, startTime, endTime)
        setAvailability(result)
      } catch (error) {
        console.error("Error checking availability:", error)
        setAvailability({ available: false })
      }
    }

    checkAvailability()
  }, [workspace.id, date, startTime, endTime])

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const formattedDate = format(date, "yyyy-MM-dd")
      const bookingData = {
        title,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        date: formattedDate,
        startTime,
        endTime,
        attendees: [],
      }

      await onConfirm(bookingData)
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error("Failed to create booking")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4 my-2">
      <h4 className="font-medium mb-3">Book {workspace.name}</h4>

      <div className="space-y-3 mb-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block">Date</label>
          <Input
            type="date"
            value={format(date, "yyyy-MM-dd")}
            onChange={(e) => setDate(new Date(e.target.value))}
            min={format(new Date(), "yyyy-MM-dd")}
            className="h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium mb-1 block">Start Time</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">End Time</label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
      </div>

      {availability && (
        <div
          className={`text-xs mb-3 p-2 rounded ${availability.available ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
        >
          {availability.available
            ? "This workspace is available for the selected time!"
            : "This workspace is not available for the selected time."}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={loading || !availability?.available}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </div>
  )
}

export function ImprovedChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: "initial-greeting", content: fallbackResponses.greeting, sender: "ai", isTyping: false, completed: true, role: "assistant" },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef(null)
  
  // Add a state to track if there's an infinite loop
  const [isLooping, setIsLooping] = useState(false)
  
  // Add refs to store timeout/interval IDs for cleanup
  const timeoutRefs = useRef([])
  const intervalRefs = useRef([])

  // New state for workspace recommendations and booking
  const [workspaceRecommendations, setWorkspaceRecommendations] = useState([])
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)
  const [isBookingInProgress, setIsBookingInProgress] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, workspaceRecommendations, selectedWorkspace])
  
  // Cleanup function to stop all ongoing processes
  const stopAllProcesses = () => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
    timeoutRefs.current = []
    
    // Clear all intervals
    intervalRefs.current.forEach(intervalId => clearInterval(intervalId))
    intervalRefs.current = []
    
    // Reset all states that might be causing loops
    setIsThinking(false)
    setIsTyping(false)
    setIsLooping(false)
    
    // Reset any other states that might be in an inconsistent state
    setWorkspaceRecommendations([])
    
    // Show a confirmation toast
    toast.success("All processes stopped. The interface has been reset.")
    
    // Update messages with a system notice
    if (isLooping) {
      const systemNoticeId = `system-notice-${Date.now()}`
      setMessages(prev => [
        ...prev,
        {
          id: systemNoticeId,
          content: "The system detected an issue and has been reset. You can continue with your conversation.",
          sender: "ai",
          completed: true,
          role: "assistant",
        }
      ])
    }
  }

  // Function to find available workspaces based on criteria
  const findAvailableWorkspaces = async (criteria = {}) => {
    try {
      // Fetch all workspaces
      const allWorkspaces = await workspaceApi.getAll()

      // Filter based on criteria
      let filteredWorkspaces = allWorkspaces.filter((workspace) => workspace.available === true)

      // Apply additional filters if provided
      if (criteria.type) {
        filteredWorkspaces = filteredWorkspaces.filter((w) =>
          w.type.toLowerCase().includes(criteria.type.toLowerCase()),
        )
      }

      if (criteria.location) {
        filteredWorkspaces = filteredWorkspaces.filter((w) =>
          w.location.toLowerCase().includes(criteria.location.toLowerCase()),
        )
      }

      if (criteria.capacity) {
        filteredWorkspaces = filteredWorkspaces.filter((w) => w.capacity >= criteria.capacity)
      }

      // Sort by relevance (this is a simple implementation)
      // In a real app, you might have more sophisticated sorting
      filteredWorkspaces.sort((a, b) => {
        // Sort by type match first
        if (criteria.type) {
          const aTypeMatch = a.type.toLowerCase() === criteria.type.toLowerCase()
          const bTypeMatch = b.type.toLowerCase() === criteria.type.toLowerCase()
          if (aTypeMatch && !bTypeMatch) return -1
          if (!aTypeMatch && bTypeMatch) return 1
        }

        // Then by location
        if (criteria.location) {
          const aLocationMatch = a.location.toLowerCase() === criteria.location.toLowerCase()
          const bLocationMatch = b.location.toLowerCase() === criteria.location.toLowerCase()
          if (aLocationMatch && !bLocationMatch) return -1
          if (!aLocationMatch && bLocationMatch) return 1
        }

        return 0
      })

      return filteredWorkspaces.slice(0, 5) // Return top 5 matches
    } catch (error) {
      console.error("Error finding available workspaces:", error)
      return []
    }
  }

  // Function to extract workspace criteria from user message
  const extractWorkspaceCriteria = (message) => {
    const criteria = {}

    // Extract workspace type
    const typeMatches = message.match(
      /\b(desk|meeting room|conference room|phone booth|event hall|collaboration space)\b/i,
    )
    if (typeMatches) {
      criteria.type = typeMatches[0].toLowerCase()
    }

    // Extract location
    const locationMatches = message.match(/\b(east wing|west wing|north wing|south wing|central area)\b/i)
    if (locationMatches) {
      criteria.location = locationMatches[0]
    }

    // Extract capacity
    const capacityMatches = message.match(/\b(\d+)\s*(people|person|capacity)\b/i)
    if (capacityMatches) {
      criteria.capacity = Number.parseInt(capacityMatches[1])
    }

    // Extract date/time (simplified)
    const dateMatches = message.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
    if (dateMatches) {
      criteria.date = dateMatches[0].toLowerCase()
    }

    return criteria
  }

  // Function to create a booking
  const createBooking = async (bookingData) => {
    try {
      const result = await bookingApi.create(bookingData)

      // Add a confirmation message from the AI
      const confirmationMessage = {
        id: `booking-confirmation-${Date.now()}`,
        content: `Great! I've booked ${bookingData.workspaceName} for you on ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}. You'll receive a confirmation email shortly.`,
        sender: "ai",
        completed: true,
        role: "assistant",
      }

      setMessages((prev) => [...prev, confirmationMessage])
      setIsBookingInProgress(false)
      setSelectedWorkspace(null)

      toast.success("Booking created successfully!")
      return result
    } catch (error) {
      console.error("Error creating booking:", error)

      // Add an error message from the AI
      const errorMessage = {
        id: `booking-error-${Date.now()}`,
        content: `I'm sorry, I couldn't complete your booking. ${error.message || "Please try again later."}`,
        sender: "ai",
        completed: true,
        role: "assistant",
        error: true,
      }

      setMessages((prev) => [...prev, errorMessage])
      setIsBookingInProgress(false)
      setSelectedWorkspace(null)

      throw error
    }
  }

  // Add error handling with retry logic
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Check if user is authenticated
    if (!user) {
      toast.error("You need to be logged in to use the AI assistant")
      return
    }

    // Add user message to UI
    const userMessageId = `user-message-${Date.now()}`
    const userMessage = {
      id: userMessageId,
      content: inputValue,
      sender: "user",
      completed: true,
      role: "user",
    }
    setMessages((prev) => [...prev, userMessage])

    // Clear input and show thinking state
    setInputValue("")
    setIsThinking(true)

    // Clear any previous recommendations when sending a new message
    setWorkspaceRecommendations([])

    // Extract workspace criteria from the message
    const criteria = extractWorkspaceCriteria(inputValue)

    // Check if the message is asking about available workspaces
    const isAskingForWorkspaces =
      inputValue.toLowerCase().includes("available") ||
      inputValue.toLowerCase().includes("find") ||
      inputValue.toLowerCase().includes("book") ||
      inputValue.toLowerCase().includes("workspace") ||
      inputValue.toLowerCase().includes("meeting room") ||
      inputValue.toLowerCase().includes("desk")

    // If asking for workspaces, find recommendations
    if (isAskingForWorkspaces) {
      try {
        const recommendations = await findAvailableWorkspaces(criteria)

        // If we found recommendations, show them
        if (recommendations.length > 0) {
          // Important: Stop thinking state before showing results
          setIsThinking(false)
          setWorkspaceRecommendations(recommendations)

          // Add AI response about the recommendations
          const aiResponseId = `ai-response-${Date.now()}`
          const responseText = `I found ${recommendations.length} available workspace${recommendations.length > 1 ? "s" : ""} that match your criteria. Here are my recommendations:`

          setIsTyping(true)

          setMessages((prev) => [
            ...prev,
            {
              id: aiResponseId,
              content: responseText,
              sender: "ai",
              isTyping: true,
              completed: false,
              role: "assistant",
            },
          ])

          return
        }
      } catch (error) {
        console.error("Error finding workspaces:", error)
        // If we hit an error finding workspaces, continue to standard AI response
      }
    }

    // Maximum number of retry attempts
    const maxRetries = 3
    let retryCount = 0
    let success = false

    while (retryCount < maxRetries && !success) {
      try {
        // Send message to backend AI
        // Get all messages for context
        const conversationHistory = messages.map((msg) => ({
          content: msg.content,
          role: msg.role,
        }))

        // Add the new user message
        conversationHistory.push({
          content: inputValue,
          role: "user",
        })

        // Log authentication status for debugging
        console.log("Auth status:", user ? "Logged in" : "Not logged in")

        const aiResponse = await sendMessageToAI(inputValue, conversationHistory)

        // IMPORTANT: Always hide thinking state when getting a response
        setIsThinking(false)
        setIsTyping(true)

        // Add AI response with typing animation
        const aiMessageId = `ai-message-${Date.now()}`
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            content: aiResponse.response,
            sender: "ai",
            isTyping: true,
            completed: false,
            timestamp: aiResponse.timestamp,
            role: "assistant",
          },
        ])

        success = true
      } catch (error) {
        console.error(`Error getting AI response (attempt ${retryCount + 1}):`, error)
        retryCount++

        // If we've reached max retries, show error message
        if (retryCount >= maxRetries) {
          // IMPORTANT: Always hide thinking state when showing error
          setIsThinking(false)

          // Show error message
          const errorMessageId = `error-message-${Date.now()}`
          setMessages((prev) => [
            ...prev,
            {
              id: errorMessageId,
              content: "I'm sorry, I'm having trouble connecting to the server. Please try again in a moment.",
              sender: "ai",
              isTyping: true,
              completed: false,
              error: true,
              role: "assistant",
            },
          ])
        } else {
          // Wait before retrying (exponential backoff)
          const timeoutId = setTimeout(() => {}, 1000 * Math.pow(2, retryCount))
          timeoutRefs.current.push(timeoutId)
        }
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const handleTypewriterComplete = (id) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, isTyping: false, completed: true } : msg)))
    setIsTyping(false)
  }

  const handleMicClick = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      toast.info("Listening...")
      // Simulate voice recording
      const timeoutId = setTimeout(() => {
        setIsRecording(false)
        setInputValue("Book a meeting room for tomorrow at 2 PM")
        toast.success("Voice input captured")
      }, 2000)
      timeoutRefs.current.push(timeoutId)
    } else {
      toast.info("Voice recording cancelled")
    }
  }

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content)
    toast.success("Message copied to clipboard")
  }

  // Handle booking a workspace
  const handleBookWorkspace = (workspace) => {
    setSelectedWorkspace(workspace)
    setIsBookingInProgress(true)

    // Add a message from the AI about the selected workspace
    const aiMessage = {
      id: `workspace-selection-${Date.now()}`,
      content: `You've selected ${workspace.name}. Let's set up your booking details:`,
      sender: "ai",
      completed: true,
      role: "assistant",
    }

    setMessages((prev) => [...prev, aiMessage])
    
    // Ensure thinking state is turned off when selecting a workspace
    setIsThinking(false)
  }

  // Handle cancelling a booking
  const handleCancelBooking = () => {
    setSelectedWorkspace(null)
    setIsBookingInProgress(false)

    // Add a message from the AI
    const aiMessage = {
      id: `booking-cancelled-${Date.now()}`,
      content:
        "No problem. Let me know if you'd like to book a different workspace or if there's anything else I can help with.",
      sender: "ai",
      completed: true,
      role: "assistant",
    }

    setMessages((prev) => [...prev, aiMessage])
  }

  const getSuggestions = () => {
    return [
      "Find me an available desk",
      "Book a meeting room for tomorrow",
      "Are there any conference rooms available?",
      "Find a workspace in the East Wing",
    ]
  }

  // Add an effect to detect potential infinite loops
  useEffect(() => {
    // Initialize a counter to detect rapid state changes
    let stateChangeCounter = 0
    
    // Set up an interval to check for rapidly changing states
    const intervalId = setInterval(() => {
      if (isThinking || isTyping) {
        stateChangeCounter++
        
        // If state is changing rapidly, we might be in a loop
        if (stateChangeCounter > 5) {
          setIsLooping(true)
          console.warn("Potential infinite loop detected")
        }
      } else {
        stateChangeCounter = 0
      }
    }, 1000)
    
    intervalRefs.current.push(intervalId)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [isThinking, isTyping])

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-primary" />
            Volt AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] group ${
                    message.sender === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className="mt-1 h-8 w-8">
                    {message.sender === "ai" ? (
                      <>
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={user?.image || "/placeholder.svg"} />
                        <AvatarFallback>{user?.firstName?.charAt(0) || <User className="h-4 w-4" />}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg px-4 py-2 relative ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.error
                          ? "bg-destructive/10 border border-destructive/20"
                          : "bg-muted"
                    }`}
                  >
                    {message.sender === "ai" && message.isTyping ? (
                      <div className="whitespace-pre-wrap break-words max-w-[500px]">
                        {message.error && <AlertCircle className="h-4 w-4 text-destructive inline mr-2" />}
                        <TypewriterEffect
                          text={message.content}
                          speed={20}
                          onComplete={() => handleTypewriterComplete(message.id)}
                        />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words max-w-[500px]">
                        {message.error && <AlertCircle className="h-4 w-4 text-destructive inline mr-2" />}
                        {message.content}
                      </div>
                    )}
                    {message.sender === "ai" && message.completed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-10 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopyMessage(message.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {message.timestamp && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Workspace recommendations */}
            {workspaceRecommendations.length > 0 && !isBookingInProgress && (
              <motion.div
                key="workspace-recommendations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start mb-4"
              >
                <div className="flex items-start gap-2 max-w-[90%]">
                  <Avatar className="mt-1 h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 w-full">
                    {workspaceRecommendations.map((workspace) => (
                      <WorkspaceRecommendation key={workspace.id} workspace={workspace} onBook={handleBookWorkspace} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Booking form */}
            {selectedWorkspace && isBookingInProgress && (
              <motion.div
                key="booking-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start mb-4"
              >
                <div className="flex items-start gap-2 max-w-[90%]">
                  <Avatar className="mt-1 h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full">
                    <BookingForm
                      workspace={selectedWorkspace}
                      onConfirm={createBooking}
                      onCancel={handleCancelBooking}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Thinking indicator - only show if isThinking is true */}
            {isThinking && (
              <motion.div
                key="thinking-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex justify-start"
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  <Avatar className="mt-1 h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      <span>Volt AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </AnimatePresence>
        </CardContent>

        {/* Suggestions */}
        {messages.length < 3 && (
          <div className="px-4 py-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {getSuggestions().map((suggestion, index) => (
                <Button
                  key={`suggestion-${index}`}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue(suggestion)
                    setTimeout(() => handleSendMessage(), 100)
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    className="flex-shrink-0"
                    onClick={handleMicClick}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRecording ? "Stop recording" : "Voice input"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isThinking || isTyping}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              <span>Powered by Volt AI</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}