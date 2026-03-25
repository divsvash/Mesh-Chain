"use client"

import { useState } from "react"
import { AlertTriangle, MapPin, Check, Radio, Forward, Shield } from "lucide-react"

export function SOSScreen() {
  const [isActive, setIsActive] = useState(false)

  const logs = [
    { icon: Radio, text: "Reached 3 devices", time: "2s ago" },
    { icon: Forward, text: "Forwarded by 2 peers", time: "5s ago" },
    { icon: Shield, text: "Message verified", time: "7s ago" },
  ]

  return (
    <div
      className={`flex flex-col h-full transition-colors duration-500 ${
        isActive ? "bg-destructive/10" : "bg-background"
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50 backdrop-blur">
        <h1 className="text-lg font-semibold text-foreground">Emergency SOS</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* SOS Button Container */}
        <div className="relative">
          {/* Animated pulse rings */}
          {isActive && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-destructive/50 animate-pulse-ring" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-destructive/50 animate-pulse-ring-delay-1" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-destructive/50 animate-pulse-ring-delay-2" />
              </div>
            </>
          )}

          {/* Main SOS Button */}
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
              isActive
                ? "bg-destructive shadow-[0_0_60px_rgba(239,68,68,0.5)]"
                : "bg-destructive/20 border-4 border-destructive hover:bg-destructive/30"
            }`}
          >
            <AlertTriangle className={`w-16 h-16 ${isActive ? "text-white" : "text-destructive"}`} />
            <span className={`text-2xl font-bold mt-2 ${isActive ? "text-white" : "text-destructive"}`}>
              SOS
            </span>
          </button>
        </div>

        {/* Status Text */}
        <div className="mt-8 text-center">
          {isActive ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-destructive animate-pulse">
                SOS ACTIVE
              </p>
              <p className="text-sm text-muted-foreground">
                Broadcasting to all nearby devices
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tap to activate emergency broadcast
            </p>
          )}
        </div>

        {/* GPS Coordinates (shown when active) */}
        {isActive && (
          <div className="mt-6 bg-card border border-border rounded-xl p-4 w-full max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-foreground">Your Location</span>
            </div>
            <p className="text-sm font-mono text-muted-foreground">
              28.6139° N, 77.2090° E
            </p>
          </div>
        )}

        {/* Activity Log (shown when active) */}
        {isActive && (
          <div className="mt-4 w-full max-w-xs space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-card/50 border border-border rounded-lg p-3"
              >
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  {log.icon === Shield ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <log.icon className="w-4 h-4 text-success" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{log.text}</p>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Warning */}
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          This will broadcast your location to all mesh peers
        </p>
      </div>
    </div>
  )
}
