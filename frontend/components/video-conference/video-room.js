"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  StopCircle,
  Copy,
  X,
  LinkIcon,
  Share2,
} from "lucide-react"
import { useAuth } from "@/lib/auth"

// WebRTC configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
}

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
  const [localStream, setLocalStream] = useState(null)
  const [screenStream, setScreenStream] = useState(null)
  const [peerConnections, setPeerConnections] = useState({})
  const [remoteStreams, setRemoteStreams] = useState({})

  const localVideoRef = useRef(null)
  const screenShareRef = useRef(null)
  const socketRef = useRef(null)
  const peerConnectionsRef = useRef({})
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)

  // Generate meeting link
  useEffect(() => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/dashboard/video-conference?join=${roomId}`
    setMeetingLink(link)
  }, [roomId])

  // Initialize WebSocket connection
  useEffect(() => {
    // Determine the appropriate WebSocket URL
    let wsUrl
    if (process.env.NODE_ENV === "production") {
      // Production environment - use relative URL that will be properly routed
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      wsUrl = `${protocol}//${window.location.host}/ws/video-conference/${roomId}/`
    } else {
      // Development environment - connect directly to Django backend
      wsUrl = `ws://localhost:8000/ws/video-conference/${roomId}/`
    }

    console.log("Connecting to WebSocket:", wsUrl)

    socketRef.current = new WebSocket(wsUrl)

    // Add reconnection logic
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectInterval = 3000 // 3 seconds

    const attemptReconnect = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++
        console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)

        setTimeout(() => {
          console.log("Reconnecting to WebSocket...")
          socketRef.current = new WebSocket(wsUrl)

          // Re-attach event handlers
          socketRef.current.onopen = () => {
            console.log("WebSocket reconnected")
            reconnectAttempts = 0

            // Re-join the room
            sendToSignalingServer({
              type: "join",
              roomId,
              userId: user?.id || "anonymous",
              userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous",
              userAvatar: user?.image || "/placeholder.svg",
            })
          }

          socketRef.current.onclose = handleSocketClose
          socketRef.current.onerror = handleSocketError
          socketRef.current.onmessage = handleSocketMessage
        }, reconnectInterval)
      } else {
        console.error("Max reconnection attempts reached")
        toast.error("Could not connect to the meeting server. Please try again later.")
      }
    }

    const handleSocketClose = (event) => {
      console.log("WebSocket connection closed", event)

      if (!event.wasClean) {
        attemptReconnect()
      }
    }

    const handleSocketError = (error) => {
      console.error("WebSocket error:", error)
      toast.error("Connection error. Please try again.")
    }

    const handleSocketMessage = (event) => {
      const message = JSON.parse(event.data)
      console.log("WebSocket message received:", message)
      handleSignalingMessage(message)
    }

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established")
      // Join the room
      sendToSignalingServer({
        type: "join",
        roomId,
        userId: user?.id || "anonymous",
        userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous",
        userAvatar: user?.image || "/placeholder.svg",
      })
    }

    socketRef.current.onclose = handleSocketClose
    socketRef.current.onerror = handleSocketError
    socketRef.current.onmessage = handleSocketMessage

    return () => {
      // Clean up WebSocket connection
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [roomId, user])

  // Initialize local media stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: isMicOn,
        })

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        setLocalStream(stream)
        localStreamRef.current = stream

        // Add current user to participants
        const currentUser = {
          id: user?.id || "current-user",
          name: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You",
          isHost: true,
          isMicOn,
          isCameraOn,
          avatar: user?.image || "/placeholder.svg",
          isLocal: true,
        }

        setParticipants((prev) => {
          // Check if user already exists
          if (prev.some((p) => p.id === currentUser.id)) {
            return prev.map((p) => (p.id === currentUser.id ? { ...p, isMicOn, isCameraOn } : p))
          }
          return [currentUser, ...prev]
        })

        // If we already have peer connections, update the tracks
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          replaceTracksInPeerConnection(pc, stream)
        })
      } catch (err) {
        console.error("Error accessing media devices:", err)
        toast.error("Could not access camera or microphone")
        setIsCameraOn(false)
        setIsMicOn(false)
      }
    }

    initLocalStream()

    return () => {
      // Clean up local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isCameraOn, isMicOn, user])

  // Handle screen sharing
  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        if (screenShareRef.current) {
          screenShareRef.current.srcObject = stream
        }

        setScreenStream(stream)
        screenStreamRef.current = stream
        setIsScreenSharing(true)

        // Send screen share stream to all peers
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream)
          })
        })

        // Listen for the end of screen sharing
        stream.getVideoTracks()[0].onended = () => {
          stopScreenSharing()
        }

        // Notify others that we're screen sharing
        sendToSignalingServer({
          type: "screen-share-started",
          roomId,
          userId: user?.id || "anonymous",
        })
      } catch (err) {
        console.error("Error sharing screen:", err)
        toast.error("Could not share screen")
      }
    } else {
      stopScreenSharing()
    }
  }

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())

      // Remove screen share tracks from peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (screenStreamRef.current.getTracks().includes(sender.track)) {
            pc.removeTrack(sender)
          }
        })
      })

      screenStreamRef.current = null
      setScreenStream(null)
      setIsScreenSharing(false)

      // Notify others that we've stopped screen sharing
      sendToSignalingServer({
        type: "screen-share-stopped",
        roomId,
        userId: user?.id || "anonymous",
      })
    }
  }

  // Handle sending chat messages
  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    const newMessage = {
      id: Date.now(),
      sender: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You",
      senderId: user?.id || "anonymous",
      content: messageInput,
      timestamp: new Date(),
      isLocal: true,
    }

    setChatMessages((prev) => [...prev, newMessage])
    setMessageInput("")

    // Send message to signaling server
    sendToSignalingServer({
      type: "chat-message",
      roomId,
      userId: user?.id || "anonymous",
      userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous",
      message: messageInput,
      timestamp: new Date().toISOString(),
    })
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

  // Handle leaving the meeting
  const handleLeaveMeeting = () => {
    // Notify others that we're leaving
    sendToSignalingServer({
      type: "leave",
      roomId,
      userId: user?.id || "anonymous",
    })

    // Clean up peer connections
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.close()
    })

    // Clean up media streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close()
    }

    toast.info("You left the meeting")
    onClose()
  }

  // Send message to signaling server
  const sendToSignalingServer = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
      return true
    } else {
      console.error("WebSocket is not connected")
      toast.error("Connection lost. Trying to reconnect...")
      attemptReconnect()
      return false
    }
  }

  // Handle signaling messages
  const handleSignalingMessage = async (message) => {
    switch (message.type) {
      case "user-joined":
        handleUserJoined(message)
        break
      case "user-left":
        handleUserLeft(message)
        break
      case "offer":
        handleOffer(message)
        break
      case "answer":
        handleAnswer(message)
        break
      case "ice-candidate":
        handleIceCandidate(message)
        break
      case "chat-message":
        handleChatMessage(message)
        break
      case "screen-share-started":
        handleScreenShareStarted(message)
        break
      case "screen-share-stopped":
        handleScreenShareStopped(message)
        break
      default:
        console.log("Unknown message type:", message.type)
    }
  }

  // Handle when a new user joins
  const handleUserJoined = async (message) => {
    const { userId, userName, userAvatar } = message

    console.log(`User joined: ${userName} (${userId})`)

    // Add user to participants list
    setParticipants((prev) => {
      if (prev.some((p) => p.id === userId)) {
        return prev
      }
      return [
        ...prev,
        {
          id: userId,
          name: userName,
          avatar: userAvatar,
          isHost: false,
          isMicOn: true,
          isCameraOn: true,
          isScreenSharing: false,
        },
      ]
    })

    // Create a new peer connection for this user
    const peerConnection = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionsRef.current[userId] = peerConnection

    // Add local tracks to the peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current)
      })
    }

    // Add screen share tracks if we're screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, screenStreamRef.current)
      })
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendToSignalingServer({
          type: "ice-candidate",
          roomId,
          userId: user?.id || "anonymous",
          targetUserId: userId,
          candidate: event.candidate,
        })
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}: ${peerConnection.connectionState}`)
      if (
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "closed"
      ) {
        // Handle disconnection
        setParticipants((prev) => prev.filter((p) => p.id !== userId))
        delete peerConnectionsRef.current[userId]
      }
    }

    // Handle remote tracks
    peerConnection.ontrack = (event) => {
      console.log(`Received track from ${userId}`, event.track)

      // Create a new MediaStream for this user if it doesn't exist
      setRemoteStreams((prev) => {
        const stream = prev[userId] || new MediaStream()

        // Check if this track is already in the stream
        const trackExists = [...stream.getTracks()].some((t) => t.id === event.track.id)

        if (!trackExists) {
          stream.addTrack(event.track)
        }

        return { ...prev, [userId]: stream }
      })
    }

    // Create and send an offer
    try {
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      sendToSignalingServer({
        type: "offer",
        roomId,
        userId: user?.id || "anonymous",
        targetUserId: userId,
        sdp: peerConnection.localDescription,
      })
    } catch (err) {
      console.error("Error creating offer:", err)
      toast.error("Connection error")
    }
  }

  // Handle when a user leaves
  const handleUserLeft = (message) => {
    const { userId, userName } = message

    console.log(`User left: ${userName} (${userId})`)

    // Remove user from participants list
    setParticipants((prev) => prev.filter((p) => p.id !== userId))

    // Close and remove the peer connection
    if (peerConnectionsRef.current[userId]) {
      peerConnectionsRef.current[userId].close()
      delete peerConnectionsRef.current[userId]
    }

    // Remove remote stream
    setRemoteStreams((prev) => {
      const newStreams = { ...prev }
      delete newStreams[userId]
      return newStreams
    })

    toast.info(`${userName} left the meeting`)
  }

  // Handle receiving an offer
  const handleOffer = async (message) => {
    const { userId, targetUserId, sdp } = message

    // Only process if the offer is for us
    if (targetUserId !== (user?.id || "anonymous")) return

    console.log(`Received offer from ${userId}`)

    // Create a new peer connection if it doesn't exist
    if (!peerConnectionsRef.current[userId]) {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS)
      peerConnectionsRef.current[userId] = peerConnection

      // Add local tracks to the peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current)
        })
      }

      // Add screen share tracks if we're screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, screenStreamRef.current)
        })
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendToSignalingServer({
            type: "ice-candidate",
            roomId,
            userId: user?.id || "anonymous",
            targetUserId: userId,
            candidate: event.candidate,
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${userId}: ${peerConnection.connectionState}`)
        if (
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "closed"
        ) {
          // Handle disconnection
          setParticipants((prev) => prev.filter((p) => p.id !== userId))
          delete peerConnectionsRef.current[userId]
        }
      }

      // Handle remote tracks
      peerConnection.ontrack = (event) => {
        console.log(`Received track from ${userId}`, event.track)

        // Create a new MediaStream for this user if it doesn't exist
        setRemoteStreams((prev) => {
          const stream = prev[userId] || new MediaStream()

          // Check if this track is already in the stream
          const trackExists = [...stream.getTracks()].some((t) => t.id === event.track.id)

          if (!trackExists) {
            stream.addTrack(event.track)
          }

          return { ...prev, [userId]: stream }
        })
      }
    }

    const peerConnection = peerConnectionsRef.current[userId]

    try {
      // Set the remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))

      // Create and send an answer
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      sendToSignalingServer({
        type: "answer",
        roomId,
        userId: user?.id || "anonymous",
        targetUserId: userId,
        sdp: peerConnection.localDescription,
      })
    } catch (err) {
      console.error("Error handling offer:", err)
      toast.error("Connection error")
    }
  }

  // Handle receiving an answer
  const handleAnswer = async (message) => {
    const { userId, targetUserId, sdp } = message

    // Only process if the answer is for us
    if (targetUserId !== (user?.id || "anonymous")) return

    console.log(`Received answer from ${userId}`)

    const peerConnection = peerConnectionsRef.current[userId]
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
      } catch (err) {
        console.error("Error setting remote description:", err)
        toast.error("Connection error")
      }
    }
  }

  // Handle receiving an ICE candidate
  const handleIceCandidate = async (message) => {
    const { userId, targetUserId, candidate } = message

    // Only process if the candidate is for us
    if (targetUserId !== (user?.id || "anonymous")) return

    console.log(`Received ICE candidate from ${userId}`)

    const peerConnection = peerConnectionsRef.current[userId]
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error("Error adding ICE candidate:", err)
      }
    }
  }

  // Handle receiving a chat message
  const handleChatMessage = (message) => {
    const { userId, userName, message: content, timestamp } = message

    // Don't add our own messages (we already added them)
    if (userId === (user?.id || "anonymous")) return

    const newMessage = {
      id: Date.now(),
      sender: userName,
      senderId: userId,
      content,
      timestamp: new Date(timestamp),
      isLocal: false,
    }

    setChatMessages((prev) => [...prev, newMessage])

    // Show a toast notification if chat is closed
    if (!isChatOpen) {
      toast.info(`New message from ${userName}`, {
        description: content.length > 30 ? content.substring(0, 30) + "..." : content,
        action: {
          label: "View",
          onClick: () => setIsChatOpen(true),
        },
      })
    }
  }

  // Handle when a user starts screen sharing
  const handleScreenShareStarted = (message) => {
    const { userId } = message

    setParticipants((prev) => prev.map((p) => (p.id === userId ? { ...p, isScreenSharing: true } : p)))
  }

  // Handle when a user stops screen sharing
  const handleScreenShareStopped = (message) => {
    const { userId } = message

    setParticipants((prev) => prev.map((p) => (p.id === userId ? { ...p, isScreenSharing: false } : p)))
  }

  // Replace tracks in peer connection when media changes
  const replaceTracksInPeerConnection = (peerConnection, newStream) => {
    peerConnection.getSenders().forEach((sender) => {
      const track = newStream.getTracks().find((t) => t.kind === sender.track.kind)
      if (track) {
        sender.replaceTrack(track)
      }
    })
  }

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !isCameraOn
      })

      setIsCameraOn(!isCameraOn)

      // Update participant info
      setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isCameraOn: !isCameraOn } : p)))

      // Notify others about camera state
      sendToSignalingServer({
        type: "media-state-change",
        roomId,
        userId: user?.id || "anonymous",
        isCameraOn: !isCameraOn,
        isMicOn,
      })
    }
  }

  // Toggle microphone
  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !isMicOn
      })

      setIsMicOn(!isMicOn)

      // Update participant info
      setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isMicOn: !isMicOn } : p)))

      // Notify others about mic state
      sendToSignalingServer({
        type: "media-state-change",
        roomId,
        userId: user?.id || "anonymous",
        isCameraOn,
        isMicOn: !isMicOn,
      })
    }
  }

  // Add reconnection logic
  const reconnectAttempts = 0
  const maxReconnectAttempts = 5

  return (
    <div className="relative h-[calc(100vh-10rem)]">
      {/* Connection status message */}
      {reconnectAttempts > 0 && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center z-50">
          Connection issues detected. Attempting to reconnect... ({reconnectAttempts}/{maxReconnectAttempts})
        </div>
      )}
      {/* Meeting info */}
      <div className="flex justify-between items-center mb-4 p-3 bg-muted/30 rounded-lg">
        <div>
          <h3 className="font-medium">Meeting: {roomId}</h3>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <LinkIcon className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{meetingLink}</span>
          </div>
        </div>
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

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 h-[calc(100%-12rem)]">
        {/* Local user video */}
        <div className="relative rounded-lg overflow-hidden bg-muted h-full min-h-[200px]">
          {isCameraOn ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.image || "/placeholder.svg"} />
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
            <div className="bg-black/50 text-white px-2 py-1 rounded text-sm">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You"} (You)
            </div>
            <div className="flex gap-1">
              {!isMicOn && (
                <div className="bg-red-500/80 p-1 rounded-full">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              )}
              {!isCameraOn && (
                <div className="bg-red-500/80 p-1 rounded-full">
                  <VideoOff className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remote participants */}
        {participants
          .filter((p) => !p.isLocal)
          .map((participant) => (
            <div key={participant.id} className="relative rounded-lg overflow-hidden bg-muted h-full min-h-[200px]">
              {remoteStreams[participant.id] ? (
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  srcObject={remoteStreams[participant.id]}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <div className="bg-black/50 text-white px-2 py-1 rounded text-sm">{participant.name}</div>
                <div className="flex gap-1">
                  {!participant.isMicOn && (
                    <div className="bg-red-500/80 p-1 rounded-full">
                      <MicOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {!participant.isCameraOn && (
                    <div className="bg-red-500/80 p-1 rounded-full">
                      <VideoOff className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Screen sharing overlay */}
      {isScreenSharing && (
        <div className="absolute inset-0 bg-black/80 z-10 flex flex-col">
          <div className="flex-1 p-4">
            <video ref={screenShareRef} autoPlay className="w-full h-full object-contain" />
          </div>
          <div className="p-4 flex justify-center">
            <Button variant="destructive" onClick={stopScreenSharing}>
              <StopCircle className="h-4 w-4 mr-2" />
              Stop sharing
            </Button>
          </div>
        </div>
      )}

      {/* Participant screen sharing */}
      {participants.some((p) => p.isScreenSharing && !p.isLocal) && (
        <div className="absolute inset-0 bg-black/80 z-10 flex flex-col">
          <div className="flex-1 p-4">
            <div className="w-full h-full flex items-center justify-center text-white">
              {participants.find((p) => p.isScreenSharing && !p.isLocal)?.name} is sharing their screen
            </div>
          </div>
        </div>
      )}

      {/* Video controls */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMicOn ? "outline" : "secondary"}
                size="icon"
                onClick={toggleMicrophone}
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
                onClick={toggleCamera}
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
              <Button variant="destructive" size="icon" onClick={handleLeaveMeeting} className="rounded-full h-12 w-12">
                <Phone className="h-5 w-5 rotate-135" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave meeting</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Chat sidebar */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 bg-background border-l shadow-lg transition-transform duration-300 z-20 ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-medium">Chat</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 h-[calc(100%-8rem)] overflow-y-auto">
          {chatMessages.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            chatMessages.map((message) => (
              <div key={message.id} className={`mb-4 ${message.isLocal ? "text-right" : "text-left"}`}>
                <div className="flex items-center mb-1 gap-1 text-sm">
                  <span className="font-medium">{message.sender}</span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div
                  className={`inline-block rounded-lg px-3 py-2 text-sm ${message.isLocal ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-background">
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
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 bg-background border-l shadow-lg transition-transform duration-300 z-20 ${isParticipantsOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-3 border-b flex justify-between items-center">
          <h3 className="font-medium">Participants ({participants.length})</h3>
          <Button variant="ghost" size="icon" onClick={() => setIsParticipantsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 overflow-y-auto">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={participant.avatar || "/placeholder.svg"} />
                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{participant.name}</span>
                  {participant.isLocal && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                </div>
              </div>
              <div className="flex gap-1">
                {!participant.isMicOn && <MicOff className="h-4 w-4 text-muted-foreground" />}
                {!participant.isCameraOn && <VideoOff className="h-4 w-4 text-muted-foreground" />}
                {participant.isScreenSharing && <ScreenShare className="h-4 w-4 text-primary" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
