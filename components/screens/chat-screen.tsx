"use client"

import { useState } from "react"
import { Send, Shield, ShieldAlert, Link2 } from "lucide-react"

interface Message {
  id: number
  sender: string
  text: string
  timestamp: string
  isMe: boolean
  verified: boolean
  hops: number
}

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "Priya",
    text: "Is anyone receiving this? Power&apos;s been out since yesterday.",
    timestamp: "10:32 AM",
    isMe: false,
    verified: true,
    hops: 3,
  },
  {
    id: 2,
    sender: "You",
    text: "Yes, I can hear you. We have a generator running. Where are you located?",
    timestamp: "10:34 AM",
    isMe: true,
    verified: true,
    hops: 0,
  },
  {
    id: 3,
    sender: "Rahul",
    text: "Relief camp is set up at the community center. Coordinates shared.",
    timestamp: "10:38 AM",
    isMe: false,
    verified: true,
    hops: 2,
  },
  {
    id: 4,
    sender: "Unknown Device",
    text: "Water available at sector 7 checkpoint",
    timestamp: "10:45 AM",
    isMe: false,
    verified: false,
    hops: 5,
  },
  {
    id: 5,
    sender: "You",
    text: "Can anyone verify the sector 7 water supply info?",
    timestamp: "10:47 AM",
    isMe: true,
    verified: true,
    hops: 0,
  },
]

export function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: messages.length + 1,
      sender: "You",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
      verified: true,
      hops: 0,
    }

    setMessages([...messages, newMessage])
    setInputValue("")
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Link2 className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">MeshChain</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-success rounded-full animate-dot-pulse" />
          <span className="text-sm text-muted-foreground">3 peers online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.isMe ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.isMe
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card text-card-foreground rounded-bl-md border border-border"
              }`}
            >
              {!message.isMe && (
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {message.sender}
                </p>
              )}
              <p className="text-sm">{message.text}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-xs text-muted-foreground">{message.timestamp}</span>
              {message.verified ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <ShieldAlert className="w-3 h-3" />
                  Tampered
                </span>
              )}
              {message.hops > 0 && (
                <span className="text-xs text-muted-foreground">{message.hops} hops</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
