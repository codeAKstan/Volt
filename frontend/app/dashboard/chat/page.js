import { ImprovedChat } from "@/components/dashboard/improved-chat"

export const metadata = {
  title: "AI Assistant | Volt",
  description: "Chat with our AI assistant to help with workspace bookings",
}

export default function ChatPage() {
  return (
    <div className="mx-auto py-2">
      <ImprovedChat />
    </div>
  )
}
