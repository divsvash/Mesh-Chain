"use client"

import { useState } from "react"
import { Wifi, Bluetooth, Battery, Signal } from "lucide-react"

interface Device {
  id: number
  name: string
  connectionType: "BLE" | "WiFi Direct"
  signalStrength: 1 | 2 | 3
  batteryLevel: number
  connected: boolean
}

const initialDevices: Device[] = [
  {
    id: 1,
    name: "Rahul&apos;s Phone",
    connectionType: "BLE",
    signalStrength: 3,
    batteryLevel: 78,
    connected: true,
  },
  {
    id: 2,
    name: "Priya&apos;s Device",
    connectionType: "WiFi Direct",
    signalStrength: 2,
    batteryLevel: 45,
    connected: true,
  },
  {
    id: 3,
    name: "Emergency Node #7",
    connectionType: "BLE",
    signalStrength: 3,
    batteryLevel: 92,
    connected: false,
  },
  {
    id: 4,
    name: "Relief Station Alpha",
    connectionType: "WiFi Direct",
    signalStrength: 1,
    batteryLevel: 34,
    connected: false,
  },
  {
    id: 5,
    name: "Unknown Device",
    connectionType: "BLE",
    signalStrength: 2,
    batteryLevel: 67,
    connected: false,
  },
]

function SignalBars({ strength }: { strength: 1 | 2 | 3 }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      <div className={`w-1 h-1.5 rounded-sm ${strength >= 1 ? "bg-success" : "bg-muted"}`} />
      <div className={`w-1 h-2.5 rounded-sm ${strength >= 2 ? "bg-success" : "bg-muted"}`} />
      <div className={`w-1 h-4 rounded-sm ${strength >= 3 ? "bg-success" : "bg-muted"}`} />
    </div>
  )
}

export function NearbyScreen() {
  const [devices, setDevices] = useState<Device[]>(initialDevices)

  const toggleConnection = (deviceId: number) => {
    setDevices(
      devices.map((device) =>
        device.id === deviceId ? { ...device, connected: !device.connected } : device
      )
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground">Nearby Devices</h1>
      </div>

      {/* Radar Animation */}
      <div className="flex items-center justify-center py-8 relative">
        <div className="relative w-32 h-32">
          {/* Pulsing rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-full h-full rounded-full border border-primary/30 animate-radar" />
            <div className="absolute w-full h-full rounded-full border border-primary/30 animate-radar-delay" />
          </div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
          </div>
          {/* Device indicators */}
          <div className="absolute top-2 right-6 w-2 h-2 rounded-full bg-success animate-pulse" />
          <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-success animate-pulse" />
          <div className="absolute top-8 left-2 w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
        </div>
      </div>

      {/* Device List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-foreground">{device.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      device.connectionType === "BLE"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    {device.connectionType === "BLE" ? (
                      <span className="flex items-center gap-1">
                        <Bluetooth className="w-3 h-3" />
                        BLE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        WiFi
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <SignalBars strength={device.signalStrength} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Battery className="w-4 h-4" />
                    <span>{device.batteryLevel}%</span>
                  </div>
                  <span
                    className={`text-xs ${
                      device.connected ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {device.connected ? "Connected" : "Available"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleConnection(device.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  device.connected
                    ? "bg-success/20 text-success"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {device.connected ? "Connected" : "Connect"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
