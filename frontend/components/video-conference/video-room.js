"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  Users,
  StopCircle,
  Copy,
  Check,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Share,
} from "lucide-react"
import { useAuth } from "@/lib/auth"

// WebRTC configuration
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
]

export function VideoConferenceRoom({ roomId, onClose }) {
  const router = useRouter()
  const { theme } = useTheme()
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
  const [activeTab, setActiveTab] = useState("video")
  const [linkCopied, setLinkCopied] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isMuted, setIsMuted] = useState({})

  const localVideoRef = useRef(null)
  const screenShareRef = useRef(null)
  const socketRef = useRef(null)
  const peerConnectionsRef = useRef({})
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const chatContainerRef = useRef(null)
  const videoContainerRef = useRef(null)

  // Generate meeting link
  useEffect(() => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/dashboard/video-conference?join=${roomId}`
    setMeetingLink(link)
  }, [roomId])

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConference = async () => {
      try {
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: isMicOn,
        })

        localStreamRef.current = stream

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Add current user to participants
        setParticipants([
          {
            id: user?.id || "current-user",
            name: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You",
            avatar: user?.image || "/ai-avatar.png",
            isLocal: true,
            isMicOn,
            isCameraOn,
          },
        ])

        // Connect to signaling server
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        const wsHost = process.env.NEXT_PUBLIC_API_URL || window.location.host
        const wsUrl = `${wsProtocol}//${wsHost}/ws/video-conference/${roomId}/`

        socketRef.current = new WebSocket(wsUrl)

        socketRef.current.onopen = () => {
          console.log("WebSocket connection established")
          // Join the room
          sendToSignalingServer({
            type: "join",
            userId: user?.id || "anonymous",
            userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous",
            userAvatar: user?.image || "/ai-avatar.png",
          })
        }

        socketRef.current.onmessage = (event) => {
          const message = JSON.parse(event.data)
          handleSignalingMessage(message)
        }

        socketRef.current.onerror = (error) => {
          console.error("WebSocket error:", error)
          toast.error("Connection error. Please try again.")
        }

        socketRef.current.onclose = () => {
          console.log("WebSocket connection closed")
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (document.visibilityState !== "hidden") {
              initializeConference()
            }
          }, 3000)
        }

        // Join the room via API
        // await apiClient.post(`/api/video-conference/${roomId}/join/`);
      } catch (error) {
        console.error("Error initializing conference:", error)
        toast.error("Could not access camera or microphone. Please check permissions.")
      }
    }

    initializeConference()

    return () => {
      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        if (pc) pc.close()
      })

      // Close WebSocket connection
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close()
      }
    }
  }, [roomId, user])

  // Handle signaling messages
  const handleSignalingMessage = useCallback(
    (message) => {
      const { type } = message

      switch (type) {
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
        case "media-state-change":
          handleMediaStateChange(message)
          break
        default:
          console.log("Unknown message type:", type)
      }
    },
    [user],
  )

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
      toast.info(`New message from ${userName}`)
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

  // Handle media state change
  const handleMediaStateChange = useCallback((message) => {
    const { userId, isCameraOn, isMicOn } = message

    // Update participant state
    setParticipants((prev) => prev.map((p) => (p.id === userId ? { ...p, isCameraOn, isMicOn } : p)))
  }, [])

  // Create a new peer connection
  const createPeerConnection = (userId) => {
    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendToSignalingServer({
          type: "ice-candidate",
          userId: user?.id || "anonymous",
          targetUserId: userId,
          candidate: event.candidate,
        })
      }
    }

    peerConnection.ontrack = (event) => {
      // Find the video element for this user
      const videoElement = document.getElementById(`video-${userId}`)
      if (videoElement && event.streams && event.streams[0]) {
        videoElement.srcObject = event.streams[0]
      }
    }

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state change: ${peerConnection.connectionState}`)
      if (
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "closed"
      ) {
        // Handle connection failure
        console.log(`Connection to peer ${userId} failed or closed`)
      }
    }

    peerConnectionsRef.current[userId] = peerConnection
    return peerConnection
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

  // Toggle screen sharing
  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        })

        screenStreamRef.current = screenStream

        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0]

        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const senders = pc.getSenders()
          const videoSender = senders.find((sender) => sender.track && sender.track.kind === "video")

          if (videoSender) {
            videoSender.replaceTrack(videoTrack)
          }
        })

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }

        // Listen for the end of screen sharing
        videoTrack.onended = () => {
          stopScreenSharing()
        }

        setIsScreenSharing(true)

        // Notify other participants
        sendToSignalingServer({
          type: "screen-share-started",
          userId: user?.id || "anonymous",
        })
      } else {
        // Stop screen sharing
        stopScreenSharing()
      }
    } catch (error) {
      console.error("Error toggling screen share:", error)
      toast.error("Could not share screen. Please try again.")
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

  // Send message to signaling server
  const sendToSignalingServer = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    } else {
      console.error("WebSocket is not connected")
      toast.error("Connection lost. Trying to reconnect...")

      // Try to reconnect
      if (socketRef.current && socketRef.current.readyState === WebSocket.CLOSED) {
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
        const wsHost = process.env.NEXT_PUBLIC_API_URL || window.location.host
        const wsUrl = `${wsProtocol}//${wsHost}/ws/video-conference/${roomId}/`

        socketRef.current = new WebSocket(wsUrl)

        socketRef.current.onopen = () => {
          console.log("WebSocket reconnected")
          socketRef.current.send(JSON.stringify(message))

          // Rejoin the room
          sendToSignalingServer({
            type: "join",
            userId: user?.id || "anonymous",
            userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous",
            userAvatar: user?.image || "/ai-avatar.png",
          })
        }

        // Set up other event handlers
        socketRef.current.onmessage = (event) => {
          const msg = JSON.parse(event.data)
          handleSignalingMessage(msg)
        }

        socketRef.current.onerror = (error) => {
          console.error("WebSocket reconnection error:", error)
        }
      }
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

  // Send chat message
  const sendChatMessage = () => {
    if (messageInput.trim() === "") return

    const message = {
      type: "chat-message",
      userId: user?.id || "anonymous",
      userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous",
      message: messageInput,
      timestamp: new Date().toISOString(),
    }

    sendToSignalingServer(message)

    // Add to local chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        userId: user?.id || "anonymous",
        userName: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Anonymous",
        text: messageInput,
        timestamp: new Date().toISOString(),
        isLocal: true,
      },
    ])

    setMessageInput("")

    // Scroll to bottom of chat
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }, 100)
    }
  }

  // Handle copying meeting link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink)
    toast.success("Meeting link copied to clipboard")
  }

  // Copy meeting link
  const copyMeetingLink = () => {
    const link = `${window.location.origin}/dashboard/video-conference?roomId=${roomId}`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    toast.success("Meeting link copied to clipboard")

    setTimeout(() => {
      setLinkCopied(false)
    }, 3000)
  }

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
      setIsFullScreen(true)
    } else {
      document.exitFullscreen()
      setIsFullScreen(false)
    }
  }

  // Toggle participant audio
  const toggleParticipantAudio = (participantId) => {
    setIsMuted((prev) => ({
      ...prev,
      [participantId]: !prev[participantId],
    }))

    // Find the audio element for this participant
    const audioElement = document.getElementById(`audio-${participantId}`)
    if (audioElement) {
      audioElement.muted = !isMuted[participantId]
    }
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

  // Handle leave meeting
  const handleLeaveMeeting2 = async () => {
    try {
      // Notify other participants
      sendToSignalingServer({
        type: "leave",
        userId: user?.id || "anonymous",
      })

      // Leave the room via API
      // await apiClient.post(`/api/video-conference/${roomId}/leave/`);

      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        if (pc) pc.close()
      })

      // Close WebSocket connection
      if (socketRef.current) {
        socketRef.current.close()
      }

      // Navigate back to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error leaving meeting:", error)
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">Meeting: {roomId}</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={copyMeetingLink}>
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy meeting link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleFullScreen}>
                  {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullScreen ? "Exit full screen" : "Enter full screen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="destructive" size="sm" onClick={handleLeaveMeeting2}>
            <Phone className="h-4 w-4 mr-2" /> Leave
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-4" ref={videoContainerRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`relative rounded-lg overflow-hidden bg-muted ${
                  participant.isScreenSharing ? "col-span-2 row-span-2" : ""
                }`}
              >
                {participant.isLocal ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      !participant.isCameraOn && !isScreenSharing ? "hidden" : ""
                    }`}
                  />
                ) : (
                  <video
                    id={`video-${participant.id}`}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${!participant.isCameraOn ? "hidden" : ""}`}
                  />
                )}

                {!participant.isCameraOn && !participant.isScreenSharing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="h-24 w-24">
                      <img src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
                    </Avatar>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span>
                      {participant.name} {participant.isLocal ? "(You)" : ""}
                    </span>
                    {!participant.isMicOn && <MicOff className="h-4 w-4 text-red-500" />}
                  </div>

                  {!participant.isLocal && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleParticipantAudio(participant.id)}
                    >
                      {isMuted[participant.id] ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 border-l">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="video">
                <Users className="h-4 w-4 mr-2" /> Participants ({participants.length})
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" /> Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <img src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">{participant.isLocal ? "You" : "Participant"}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {!participant.isMicOn && <MicOff className="h-4 w-4 text-red-500" />}
                        {!participant.isCameraOn && <VideoOff className="h-4 w-4 text-red-500" />}
                        {participant.isScreenSharing && <Share className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1" ref={chatContainerRef}>
                <div className="p-4 space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.userId === user?.id || "anonymous" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.userId === user?.id || "anonymous" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {msg.userId !== user?.id ||
                          ("anonymous" && <p className="text-xs font-medium mb-1">{msg.userName}</p>)}
                        <p>{msg.text}</p>
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendChatMessage()
                      }
                    }}
                  />
                  <Button onClick={sendChatMessage}>Send</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-4 p-4 border-t">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={isMicOn ? "outline" : "destructive"} size="icon" onClick={toggleMicrophone}>
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMicOn ? "Turn off microphone" : "Turn on microphone"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={isCameraOn ? "outline" : "destructive"} size="icon" onClick={toggleCamera}>
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCameraOn ? "Turn off camera" : "Turn on camera"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={isScreenSharing ? "destructive" : "outline"} size="icon" onClick={handleScreenShare}>
                {isScreenSharing ? <StopCircle className="h-5 w-5" /> : <Share className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isScreenSharing ? "Stop sharing screen" : "Share screen"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" onClick={handleLeaveMeeting2}>
                <Phone className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Leave meeting</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
