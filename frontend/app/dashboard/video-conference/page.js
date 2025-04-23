"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoConferenceRoom } from "@/components/video-conference/video-room"
import { Video, Users, Calendar, Clock, Plus, Copy, LinkIcon, Share2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { meetingApi } from "@/lib/api-client"

export default function VideoConferencePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("join")
  const [roomId, setRoomId] = useState("")
  const [inMeeting, setInMeeting] = useState(false)
  const [meetingName, setMeetingName] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [generatedMeetingId, setGeneratedMeetingId] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [creatingMeeting, setCreatingMeeting] = useState(false)

  // Check if there's a join parameter in the URL
  useEffect(() => {
    const joinParam = searchParams.get("join")
    if (joinParam) {
      setRoomId(joinParam)
      setActiveTab("join")
    }
  }, [searchParams])

  const handleJoinMeeting = () => {
    if (!roomId.trim()) return
    toast.success(`Joining meeting: ${roomId}`)
    setInMeeting(true)
  }

  const handleCreateMeeting = async () => {
    setCreatingMeeting(true)
    try {
      const response = await meetingApi.createMeeting()
      setRoomId(response.meeting_id)
      toast.success(`Created new meeting: ${response.meeting_id}`)
      setInMeeting(true)
    } catch (error) {
      console.error("Error creating meeting:", error)
      toast.error("Failed to create meeting")
    } finally {
      setCreatingMeeting(false)
    }
  }

  const handleGenerateMeetingLink = () => {
    // Generate a random meeting ID
    const newMeetingId = `volt-${Math.random().toString(36).substring(2, 8)}`
    setGeneratedMeetingId(newMeetingId)

    // Generate meeting link
    const baseUrl = window.location.origin
    const link = `${baseUrl}/dashboard/video-conference?join=${newMeetingId}`
    setMeetingLink(link)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink)
    toast.success("Meeting link copied to clipboard")
  }

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

  const handleScheduleMeeting = () => {
    // In a real app, this would save the meeting to a database
    toast.success(`Meeting "${meetingName}" scheduled for ${scheduledDate} at ${scheduledTime}`)

    // Generate a meeting link for the scheduled meeting
    const newMeetingId = `volt-${Math.random().toString(36).substring(2, 8)}`
    const baseUrl = window.location.origin
    const link = `${baseUrl}/dashboard/video-conference?join=${newMeetingId}`

    // Show success message with the link
    toast.success("Meeting scheduled! Share this link with participants.", {
      description: link,
      action: {
        label: "Copy",
        onClick: () => {
          navigator.clipboard.writeText(link)
          toast.success("Link copied to clipboard")
        },
      },
    })

    setMeetingName("")
    setScheduledDate("")
    setScheduledTime("")
  }

  const handleLeaveMeeting = () => {
    toast.info("You left the meeting")
    setInMeeting(false)
    setRoomId("")
    // Remove the join parameter from the URL
    router.push("/dashboard/video-conference")
  }

  return (
    <div className="space-y-6">
      {!inMeeting ? (
        <>
          <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Video Conference</h2>
              <p className="text-muted-foreground">Connect with your team through video meetings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Join or Create a Meeting</CardTitle>
                <CardDescription>Enter a meeting code to join an existing meeting or create a new one</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="join" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="join">Join a Meeting</TabsTrigger>
                    <TabsTrigger value="new">New Meeting</TabsTrigger>
                  </TabsList>
                  <TabsContent value="join" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter meeting code"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleJoinMeeting} disabled={!roomId.trim()}>
                      <Video className="mr-2 h-4 w-4" />
                      Join Meeting
                    </Button>
                  </TabsContent>
                  <TabsContent value="new" className="space-y-4 pt-4">
                    <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                      <div className="text-center">
                        <Video className="h-10 w-10 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Start a New Meeting</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a new meeting and invite others to join
                        </p>
                        <Button onClick={handleCreateMeeting} disabled={creatingMeeting}>
                          {creatingMeeting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Meeting
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Generate Meeting Link</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate a link to share with participants for a future meeting
                      </p>

                      {meetingLink ? (
                        <div className="space-y-4">
                          <div className="flex items-center p-3 bg-muted rounded-md">
                            <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm truncate flex-1">{meetingLink}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopyLink} className="ml-2">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleShareLink} className="ml-1">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between">
                            <Button variant="outline" onClick={handleGenerateMeetingLink}>
                              Generate New Link
                            </Button>
                            <Button
                              onClick={() => {
                                setRoomId(generatedMeetingId)
                                handleJoinMeeting()
                              }}
                            >
                              Start This Meeting
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={handleGenerateMeetingLink} className="w-full">
                          Generate Meeting Link
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule a Meeting</CardTitle>
                <CardDescription>Plan ahead by scheduling a future meeting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Name</label>
                    <Input
                      placeholder="Enter meeting name"
                      value={meetingName}
                      onChange={(e) => setMeetingName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Participants</label>
                    <Input placeholder="Enter email addresses (comma separated)" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleScheduleMeeting}
                  disabled={!meetingName.trim() || !scheduledDate || !scheduledTime}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="h-10 w-10 text-primary" />,
                title: "Quick Meetings",
                description: "Start an instant meeting with your team members",
              },
              {
                icon: <Calendar className="h-10 w-10 text-primary" />,
                title: "Scheduled Conferences",
                description: "Plan ahead with scheduled video conferences",
              },
              {
                icon: <Users className="h-10 w-10 text-primary" />,
                title: "Team Collaboration",
                description: "Connect with up to 50 participants simultaneously",
              },
            ].map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <VideoConferenceRoom roomId={roomId} onClose={handleLeaveMeeting} />
      )}
    </div>
  )
}
