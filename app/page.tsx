"use client"

import { useState } from "react"
import { MessageSquare, Radar, Megaphone, AlertTriangle, User } from "lucide-react"
import { ChatScreen } from "@/components/screens/chat-screen"
import { NearbyScreen } from "@/components/screens/nearby-screen"
import { BroadcastScreen } from "@/components/screens/broadcast-screen"
import { SOSScreen } from "@/components/screens/sos-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"

type Tab = "chat" | "nearby" | "broadcast" | "sos" | "profile"

const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "nearby", label: "Nearby", icon: Radar },
  { id: "broadcast", label: "Broadcast", icon: Megaphone },
  { id: "sos", label: "SOS", icon: AlertTriangle },
  { id: "profile", label: "Profile", icon: User },
]

export default function MeshChainApp() {
  const [activeTab, setActiveTab] = useState<Tab>("chat")

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      {/* Screen Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "chat" && <ChatScreen />}
        {activeTab === "nearby" && <NearbyScreen />}
        {activeTab === "broadcast" && <BroadcastScreen />}
        {activeTab === "sos" && <SOSScreen />}
        {activeTab === "profile" && <ProfileScreen />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="flex items-center justify-around border-t border-border bg-card px-2 py-2 safe-area-pb">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isSOS = tab.id === "sos"

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px] ${
                isActive
                  ? isSOS
                    ? "text-destructive"
                    : "text-primary"
                  : isSOS
                    ? "text-destructive/60"
                    : "text-muted-foreground"
              } ${isSOS ? "relative" : ""}`}
            >
              {isSOS && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
              <tab.icon className={`w-6 h-6 ${isSOS && !isActive ? "animate-pulse" : ""}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
