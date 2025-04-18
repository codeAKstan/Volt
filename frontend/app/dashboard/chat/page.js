import { ImprovedChat } from "@/components/dashboard/improved-chat"

export const metadata = {
  title: "AI Assistant | Volt",
  description: "Chat with our AI assistant to help with workspace bookings",
}

export default function ChatPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">AI Assistant</h1>
      <p className="text-muted-foreground mb-6">
        Chat with our AI assistant to help you find and book the perfect workspace for your needs.
      </p>
      <ImprovedChat />
    </div>
  )
}
