"use client"

import { useState } from "react"
import { Shield, Check } from "lucide-react"
import { toast } from "sonner"

type Channel = "General" | "Emergency" | "Village Updates" | "Relief Info"

interface Broadcast {
  id: number
  channel: Channel
  sender: string
  message: string
  time: string
  verified: boolean
}

const initialBroadcasts: Broadcast[] = [
  {
    id: 1,
    channel: "Emergency",
    sender: "Relief Coordinator",
    message: "Medical supplies arriving at checkpoint B in 2 hours",
    time: "10 mins ago",
    verified: true,
  },
  {
    id: 2,
    channel: "General",
    sender: "Rahul",
    message: "Road to sector 5 is clear now, vehicles can pass",
    time: "25 mins ago",
    verified: true,
  },
  {
    id: 3,
    channel: "Village Updates",
    sender: "Village Head",
    message: "Community meeting at 4 PM near the well",
    time: "1 hour ago",
    verified: true,
  },
  {
    id: 4,
    channel: "Relief Info",
    sender: "NGO Volunteer",
    message: "Food packets being distributed at school building",
    time: "2 hours ago",
    verified: false,
  },
]

const channels: Channel[] = ["General", "Emergency", "Village Updates", "Relief Info"]

const channelColors: Record<Channel, string> = {
  General: "bg-blue-500/20 text-blue-400",
  Emergency: "bg-red-500/20 text-red-400",
  "Village Updates": "bg-yellow-500/20 text-yellow-400",
  "Relief Info": "bg-green-500/20 text-green-400",
}

export function BroadcastScreen() {
  const [message, setMessage] = useState("")
  const [selectedChannel, setSelectedChannel] = useState<Channel>("General")
  const [requireVerification, setRequireVerification] = useState(true)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts)

  const handleBroadcast = () => {
    if (!message.trim()) {
      toast.error("Please enter a message to broadcast")
      return
    }

    const newBroadcast: Broadcast = {
      id: broadcasts.length + 1,
      channel: selectedChannel,
      sender: "You",
      message: message,
      time: "Just now",
      verified: requireVerification,
    }

    setBroadcasts([newBroadcast, ...broadcasts])
    setMessage("")
    toast.success("Message broadcast to all nearby devices!", {
      description: `Sent on ${selectedChannel} channel`,
    })
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground">Broadcast Message</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Message Input */}
        <div className="p-4 space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message to send to all nearby devices..."
            className="w-full h-32 bg-card border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Channel Selector */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Channel</label>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedChannel === channel
                      ? channelColors[channel]
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Toggle */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Require Verification</p>
                <p className="text-xs text-muted-foreground">Sign message with your identity</p>
              </div>
            </div>
            <button
              onClick={() => setRequireVerification(!requireVerification)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                requireVerification ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  requireVerification ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Broadcast Button */}
          <button
            onClick={handleBroadcast}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors"
          >
            Broadcast to All
          </button>
        </div>

        {/* Recent Broadcasts */}
        <div className="px-4 pb-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Broadcasts</h2>
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${channelColors[broadcast.channel]}`}>
                    {broadcast.channel}
                  </span>
                  <span className="text-xs text-muted-foreground">{broadcast.time}</span>
                  {broadcast.verified && (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground mb-1">{broadcast.message}</p>
                <p className="text-xs text-muted-foreground">From: {broadcast.sender}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
