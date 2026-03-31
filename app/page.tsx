"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Radar, Megaphone, AlertTriangle, User } from "lucide-react"
import { ChatScreen }      from "@/components/screens/chat-screen"
import { NearbyScreen }    from "@/components/screens/nearby-screen"
import { BroadcastScreen } from "@/components/screens/broadcast-screen"
import { SOSScreen }       from "@/components/screens/sos-screen"
import { ProfileScreen }   from "@/components/screens/profile-screen"
import { OnboardingScreen } from "@/components/screens/onboarding-screen"
import { loadIdentity }    from "@/lib/identity-store"
import type { Identity }   from "@/lib/identity-store"

type Tab = "chat" | "nearby" | "broadcast" | "sos" | "profile"

const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat",      label: "Chat",      icon: MessageSquare },
  { id: "nearby",    label: "Nearby",    icon: Radar },
  { id: "broadcast", label: "Broadcast", icon: Megaphone },
  { id: "sos",       label: "SOS",       icon: AlertTriangle },
  { id: "profile",   label: "Profile",   icon: User },
]

export default function MeshChainApp() {
  const [identity,   setIdentity]   = useState<Identity | null>(null)
  const [activeTab,  setActiveTab]  = useState<Tab>("chat")
  const [hydrated,   setHydrated]   = useState(false)

  // Only check localStorage after hydration (avoids SSR mismatch)
  useEffect(() => {
    const existing = loadIdentity();
    if (existing) setIdentity(existing);
    setHydrated(true);
  }, []);

  // Show nothing until hydrated (prevents flash of onboarding on returning users)
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // First time user — show onboarding
  if (!identity) {
    return <OnboardingScreen onComplete={setIdentity} />;
  }

  // Returning user — show main app
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <main className="flex-1 overflow-hidden">
        {activeTab === "chat"      && <ChatScreen />}
        {activeTab === "nearby"    && <NearbyScreen />}
        {activeTab === "broadcast" && <BroadcastScreen />}
        {activeTab === "sos"       && <SOSScreen />}
        {activeTab === "profile"   && <ProfileScreen identity={identity} onIdentityUpdate={setIdentity} />}
      </main>

      <nav className="flex items-center justify-around border-t border-border bg-card px-2 py-2 safe-area-pb">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isSOS    = tab.id === "sos"
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px] ${
                isActive
                  ? isSOS ? "text-destructive" : "text-primary"
                  : isSOS ? "text-destructive/60" : "text-muted-foreground"
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
  );
}