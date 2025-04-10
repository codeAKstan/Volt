"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { MessageSquare, X, Send, Zap, ChevronDown } from "lucide-react"

// Sample responses for the chatbot
const botResponses = {
  greeting: "Hello! I'm Volt Assistant. How can I help you today?",
  booking: "I can help you book a workspace. Would you like to see available spaces?",
  pricing: "Our pricing starts at $9/month for the Starter plan. Would you like to see all our pricing options?",
  features:
    "Volt offers smart booking, workspace management, notifications, analytics, and more. What feature would you like to know more about?",
  demo: "I'd be happy to schedule a demo for you. Would you like me to connect you with our sales team?",
  fallback: "I'm not sure I understand. Could you try rephrasing your question?",
}

// Function to get a response based on user input
const getBotResponse = (message) => {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return botResponses.greeting
  } else if (lowerMessage.includes("book") || lowerMessage.includes("reserve") || lowerMessage.includes("workspace")) {
    return botResponses.booking
  } else if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("plan")) {
    return botResponses.pricing
  } else if (lowerMessage.includes("feature") || lowerMessage.includes("offer") || lowerMessage.includes("what")) {
    return botResponses.features
  } else if (lowerMessage.includes("demo") || lowerMessage.includes("show") || lowerMessage.includes("presentation")) {
    return botResponses.demo
  } else {
    return botResponses.fallback
  }
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, content: "Hello! I'm Volt Assistant. How can I help you today?", sender: "bot" },
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
            <Card className="w-[350px] shadow-lg border-primary/20">
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-primary/5">
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
                          <div
                            className={`rounded-lg px-3 py-2 max-w-[80%] ${
                              message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
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
                        placeholder="Type your message..."
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
  )
}
