"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  Users,
  ScreenShare,
  Copy,
  X,
  LinkIcon,
  Share2,
} from "lucide-react"
import { useAuth } from "@/lib/auth"

export function VideoConferenceRoom({ roomId, onClose }) {
  const { user } = useAuth()
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [messageInput, setMessageInput] = useState("")
  const [participants, setParticipants] = useState([])
  const [meetingLink, setMeetingLink] = useState("")
  const videoRef = useRef(null)
  const screenShareRef = useRef(null)

  // Generate meeting link
  useEffect(() => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/dashboard/video-conference?join=${roomId}`
    setMeetingLink(link)
  }, [roomId])

  // Simulate video stream
  useEffect(() => {
    if (videoRef.current && isCameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: isMicOn })
        .then((stream) => {
          videoRef.current.srcObject = stream
        })
        .catch((err) => {
          console.error("Error accessing camera:", err)
          toast.error("Could not access camera")
          setIsCameraOn(false)
        })
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isCameraOn, isMicOn])

  // Simulate screen sharing
  const handleScreenShare = () => {
    if (!isScreenSharing) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((stream) => {
          if (screenShareRef.current) {
            screenShareRef.current.srcObject = stream
          }
          setIsScreenSharing(true)
          // Listen for the end of screen sharing
          const track = stream.getVideoTracks()[0]
          track.onended = () => {
            setIsScreenSharing(false)
          }
        })
        .catch((err) => {
          console.error("Error sharing screen:", err)
          toast.error("Could not share screen")
        })
    } else {
      if (screenShareRef.current && screenShareRef.current.srcObject) {
        const tracks = screenShareRef.current.srcObject.getTracks()
        tracks.forEach((track) => track.stop())
        screenShareRef.current.srcObject = null
      }
      setIsScreenSharing(false)
    }
  }

  // Simulate participants
  useEffect(() => {
    // Add current user
    const currentUser = {
      id: user?.id || "current-user",
      name: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You",
      isHost: true,
      isMicOn: isMicOn,
      isCameraOn: isCameraOn,
      avatar: user?.image || "/placeholder.svg",
    }

    // Add mock participants
    const mockParticipants = [
      {
        id: "user-1",
        name: "Alex Johnson",
        isHost: false,
        isMicOn: true,
        isCameraOn: true,
        avatar: "/placeholder.svg",
      },
      {
        id: "user-2",
        name: "Sam Williams",
        isHost: false,
        isMicOn: false,
        isCameraOn: true,
        avatar: "/placeholder.svg",
      },
    ]

    setParticipants([currentUser, ...mockParticipants])
  }, [user, isMicOn, isCameraOn])

  // Handle sending chat messages
  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    const newMessage = {
      id: Date.now(),
      sender: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You",
      content: messageInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, newMessage])
    setMessageInput("")
  }

  // Handle copying meeting link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink)
    toast.success("Meeting link copied to clipboard")
  }

  // Handle sharing meeting link
  const handleShareLink = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Join my Volt meeting",
          text: "Click the link to join my video conference",
          url: meetingLink,
        })
        .then(() => toast.success("Meeting link shared"))
        .catch((error) => console.error("Error sharing:", error))
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="relative h-[calc(100vh-10rem)]">
      {/* Meeting info */}
      <div className="meeting-info-container">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Meeting: {roomId}</h3>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy meeting link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleShareLink}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share meeting link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="meeting-link">
          <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-xs truncate">{meetingLink}</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="video-grid">
        {/* Current user video */}
        <div className="video-container">
          {isCameraOn ? (
            <video ref={videoRef} autoPlay muted playsInline className="rounded-lg" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.image || "/placeholder.svg"} />
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="participant-name">
            {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You"} (You)
          </div>
          {!isMicOn && (
            <div className="muted-indicator">
              <MicOff className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Other participants */}
        {participants
          .filter((p) => p.id !== (user?.id || "current-user"))
          .map((participant) => (
            <div key={participant.id} className="video-container">
              {participant.isCameraOn ? (
                <img
                  src="/placeholder.svg?height=300&width=400"
                  alt={participant.name}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="participant-name">{participant.name}</div>
              {!participant.isMicOn && (
                <div className="muted-indicator">
                  <MicOff className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Screen sharing overlay */}
      {isScreenSharing && (
        <div className="screen-share-container">
          <div className="screen-share-content">
            <video ref={screenShareRef} autoPlay className="w-full h-full" />
          </div>
          <div className="screen-share-controls">
            <Button variant="destructive" size="sm" onClick={() => setIsScreenSharing(false)}>
              Stop sharing
            </Button>
          </div>
        </div>
      )}

      {/* Video controls */}
      <div className="video-controls">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMicOn ? "outline" : "secondary"}
                size="icon"
                onClick={() => setIsMicOn(!isMicOn)}
                className="rounded-full h-12 w-12 bg-background"
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMicOn ? "Turn off microphone" : "Turn on microphone"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCameraOn ? "outline" : "secondary"}
                size="icon"
                onClick={() => setIsCameraOn(!isCameraOn)}
                className="rounded-full h-12 w-12 bg-background"
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isCameraOn ? "Turn off camera" : "Turn on camera"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "secondary" : "outline"}
                size="icon"
                onClick={handleScreenShare}
                className="rounded-full h-12 w-12 bg-background"
              >
                <ScreenShare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isChatOpen ? "secondary" : "outline"}
                size="icon"
                onClick={() => {
                  setIsChatOpen(!isChatOpen)
                  if (isParticipantsOpen) setIsParticipantsOpen(false)
                }}
                className="rounded-full h-12 w-12 bg-background"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isChatOpen ? "Close chat" : "Open chat"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isParticipantsOpen ? "secondary" : "outline"}
                size="icon"
                onClick={() => {
                  setIsParticipantsOpen(!isParticipantsOpen)
                  if (isChatOpen) setIsChatOpen(false)
                }}
                className="rounded-full h-12 w-12 bg-background"
              >
                <Users className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isParticipantsOpen ? "Close participants" : "Show participants"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" onClick={onClose} className="rounded-full h-12 w-12">
                <Phone className="h-5 w-5 rotate-135" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave meeting</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Chat sidebar */}
      <div className={`chat-container ${isChatOpen ? "" : "hidden"}`}>
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-medium">Chat</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            chatMessages.map((message) => (
              <div key={message.id} className="mb-4">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-sm">{message.sender}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="chat-input">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Participants sidebar */}
      <div className={`participants-container ${isParticipantsOpen ? "" : "hidden"}`}>
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-medium">Participants ({participants.length})</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsParticipantsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div>
          {participants.map((participant) => (
            <div key={participant.id} className="participant-item">
              <Avatar className="participant-avatar">
                <AvatarImage src={participant.avatar} />
                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{participant.name}</span>
                  {participant.isHost && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Host
                    </Badge>
                  )}
                  {participant.id === (user?.id || "current-user") && (
                    <span className="text-xs text-muted-foreground ml-1">(You)</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {!participant.isMicOn && <MicOff className="h-4 w-4 text-muted-foreground" />}
                {!participant.isCameraOn && <VideoOff className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
