"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User, Sparkles, Paperclip, Mic, ImageIcon, Copy } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { TypewriterEffect } from "@/components/ui/typewriter-effect"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

// Mock DeepSeek AI responses for the chatbot
const mockAIResponses = {
  greeting: "Hello! I'm your Volt AI assistant powered by DeepSeek. How can I help you with workspace bookings today?",
  booking: "I can help you book a workspace. Would you like me to find available spaces for a specific date and time?",
  availability:
    "Let me check the availability for you. There are 5 desks, 2 meeting rooms, and 1 phone booth available tomorrow afternoon. Would you like me to book any of these for you?",
  confirmation:
    "Great! I've booked Meeting Room A for you tomorrow from 2:00 PM to 3:00 PM. You'll receive a confirmation email shortly. Is there anything else you need help with?",
  fallback: "I'm not sure I understand. Could you please rephrase your question about workspace bookings?",
  workspace_info:
    "Our workspaces include desks, meeting rooms, conference rooms, phone booths, and video conference rooms. Each space is equipped with high-speed internet and modern amenities. Would you like to know more about a specific type of workspace?",
  pricing:
    "Our pricing varies by workspace type. Desks start at $5/hour, meeting rooms at $20/hour, and conference rooms at $30/hour. For video conference rooms, the rate is $25/hour. Would you like to book a space now?",
  features:
    "Volt offers smart booking, real-time availability tracking, calendar integration, and AI-powered workspace recommendations. You can also receive notifications and reminders for your bookings. Is there a specific feature you'd like to learn more about?",
  analytics:
    "Based on our analytics, the most popular booking times are between 10 AM and 2 PM on weekdays. The East Wing meeting rooms tend to be booked most frequently. Would you like me to show you availability during less busy hours?",
  help: "I can help you with booking workspaces, checking availability, managing your reservations, and providing information about our facilities. Just let me know what you need assistance with!",
}

// Function to get AI response based on user message
const getAIResponse = (message) => {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return mockAIResponses.greeting
  } else if (lowerMessage.includes("book") || lowerMessage.includes("reserve") || lowerMessage.includes("schedule")) {
    return mockAIResponses.booking
  } else if (lowerMessage.includes("available") || lowerMessage.includes("free") || lowerMessage.includes("open")) {
    return mockAIResponses.availability
  } else if (lowerMessage.includes("confirm") || lowerMessage.includes("yes") || lowerMessage.includes("sure")) {
    return mockAIResponses.confirmation
  } else if (
    lowerMessage.includes("workspace") ||
    lowerMessage.includes("space") ||
    lowerMessage.includes("room") ||
    lowerMessage.includes("desk")
  ) {
    return mockAIResponses.workspace_info
  } else if (
    lowerMessage.includes("price") ||
    lowerMessage.includes("cost") ||
    lowerMessage.includes("rate") ||
    lowerMessage.includes("fee")
  ) {
    return mockAIResponses.pricing
  } else if (
    lowerMessage.includes("feature") ||
    lowerMessage.includes("offer") ||
    lowerMessage.includes("what") ||
    lowerMessage.includes("can")
  ) {
    return mockAIResponses.features
  } else if (
    lowerMessage.includes("analytics") ||
    lowerMessage.includes("stats") ||
    lowerMessage.includes("popular") ||
    lowerMessage.includes("busy")
  ) {
    return mockAIResponses.analytics
  } else if (lowerMessage.includes("help") || lowerMessage.includes("support") || lowerMessage.includes("assist")) {
    return mockAIResponses.help
  } else {
    return mockAIResponses.fallback
  }
}

export function ImprovedChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, content: mockAIResponses.greeting, sender: "ai", isTyping: false, completed: true },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage = { id: Date.now(), content: inputValue, sender: "user", completed: true }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI thinking
    setIsThinking(true)

    // Simulate AI response after thinking
    setTimeout(() => {
      setIsThinking(false)
      setIsTyping(true)

      // Add AI message with typing state
      const aiMessageId = Date.now() + 1
      const aiResponse = getAIResponse(inputValue)

      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, content: aiResponse, sender: "ai", isTyping: true, completed: false },
      ])
    }, 1500)
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
      setTimeout(() => {
        setIsRecording(false)
        setInputValue("Book a meeting room for tomorrow at 2 PM")
        toast.success("Voice input captured")
      }, 2000)
    } else {
      toast.info("Voice recording cancelled")
    }
  }

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content)
    toast.success("Message copied to clipboard")
  }

  const getSuggestions = () => {
    return [
      "Book a workspace",
      "Check availability for tomorrow",
      "What types of workspaces do you offer?",
      "How much does it cost?",
    ]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center">
            <Bot className="h-5 w-5 mr-2 text-primary" />
            DeepSeek AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
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
                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.sender === "ai" && message.isTyping ? (
                      <div className="whitespace-pre-wrap break-words max-w-[500px]">
                        <TypewriterEffect
                          text={message.content}
                          speed={20}
                          onComplete={() => handleTypewriterComplete(message.id)}
                        />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words max-w-[500px]">{message.content}</div>
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
                  </div>
                </div>
              </motion.div>
            ))}

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                      <span>DeepSeek is thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {isTyping && !isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                      <span>DeepSeek is thinking...</span>
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
                  key={index}
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
                <TooltipContent>Attach image</TooltipContent>
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

            <Button onClick={handleSendMessage} disabled={!inputValue.trim()} className="flex-shrink-0">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 mr-1" />
            <span>Powered by DeepSeek AI</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
