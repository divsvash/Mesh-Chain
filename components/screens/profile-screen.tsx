"use client"

import { useState } from "react"
import { Copy, Check, MessageSquare, Radio, Users, Clock } from "lucide-react"
import { toast } from "sonner"

export function ProfileScreen() {
  const [displayName, setDisplayName] = useState("Alex Chen")
  const [isEditing, setIsEditing] = useState(false)
  const [relayMode, setRelayMode] = useState(true)
  const [storeForward, setStoreForward] = useState(true)
  const [copied, setCopied] = useState(false)

  const publicKey = "0x7f3E...9a2B4c8D1e6F"
  const fullPublicKey = "0x7f3E4a5B6c8D1e9F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B"

  const stats = [
    { label: "Messages Sent", value: "127", icon: MessageSquare },
    { label: "Messages Relayed", value: "342", icon: Radio },
    { label: "Peers Connected", value: "8", icon: Users },
    { label: "Uptime", value: "4h 23m", icon: Clock },
  ]

  const copyPublicKey = () => {
    navigator.clipboard.writeText(fullPublicKey)
    setCopied(true)
    toast.success("Public key copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground">My Identity</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar and Name */}
        <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {displayName.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
                autoFocus
                className="bg-secondary text-foreground rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary w-full"
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-left"
              >
                <p className="text-lg font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">Tap to edit</p>
              </button>
            )}
          </div>
        </div>

        {/* Public Key */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">Public Key</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-foreground bg-secondary rounded-lg px-3 py-2 truncate">
              {publicKey}
            </code>
            <button
              onClick={copyPublicKey}
              className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-4"
            >
              <stat.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {/* Relay Mode */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Relay Mode</p>
              <p className="text-xs text-muted-foreground">Forward messages for others</p>
            </div>
            <button
              onClick={() => setRelayMode(!relayMode)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                relayMode ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  relayMode ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Store & Forward */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Store & Forward</p>
              <p className="text-xs text-muted-foreground">Save and deliver when peers found</p>
            </div>
            <button
              onClick={() => setStoreForward(!storeForward)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                storeForward ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  storeForward ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Network Status */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-4">Network Status</p>
          <div className="flex items-center justify-center">
            {/* Simple mesh network SVG */}
            <svg
              width="200"
              height="120"
              viewBox="0 0 200 120"
              className="text-primary"
            >
              {/* Connection lines */}
              <line x1="50" y1="60" x2="100" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="50" y1="60" x2="100" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="100" y1="30" x2="150" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="100" y1="90" x2="150" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="100" y1="30" x2="100" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              
              {/* Nodes */}
              <circle cx="50" cy="60" r="12" fill="currentColor" className="animate-pulse" />
              <circle cx="100" cy="30" r="10" fill="currentColor" opacity="0.8" />
              <circle cx="100" cy="90" r="10" fill="currentColor" opacity="0.8" />
              <circle cx="150" cy="60" r="10" fill="currentColor" opacity="0.6" />
              
              {/* You indicator */}
              <text x="50" y="85" textAnchor="middle" fill="currentColor" fontSize="10" className="font-medium">
                You
              </text>
            </svg>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">Mesh network healthy</span>
          </div>
        </div>
      </div>
    </div>
  )
}
