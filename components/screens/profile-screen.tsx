"use client"

import { useState, useRef } from "react"
import {
  Copy, Check, MessageSquare, Radio, Users, Clock,
  MapPin, Phone, Wrench, ChevronRight, X, Plus, Save, Shield
} from "lucide-react"
import { toast } from "sonner"
import { updateDisplayName, loadExtendedProfile, saveExtendedProfile } from "@/lib/identity-store"
import type { Identity, ExtendedProfile } from "@/lib/identity-store"
import { validatePin, setRescueUnlocked, isRescueUnlocked } from "@/lib/rescue-store"
import { RescueDashboard } from "@/components/screens/rescue-dashboard"

interface ProfileScreenProps {
  identity:         Identity;
  onIdentityUpdate: (updated: Identity) => void;
}

const SKILL_OPTIONS = [
  "Medical / First Aid",
  "Engineer",
  "Search & Rescue",
  "Communications",
  "Food & Water",
  "Shelter",
  "Transportation",
  "Translation",
  "Security",
  "Mental Health",
]

export function ProfileScreen({ identity, onIdentityUpdate }: ProfileScreenProps) {
  const [displayName,            setDisplayName]            = useState(identity.displayName)
  const [isEditing,              setIsEditing]              = useState(false)
  const [relayMode,              setRelayMode]              = useState(true)
  const [storeForward,           setStoreForward]           = useState(true)
  const [copied,                 setCopied]                 = useState(false)
  const [showProfile,            setShowProfile]            = useState(false)
  const [pinInput,               setPinInput]               = useState("")
  const [pinError,               setPinError]               = useState("")
  const [pinAttempts,            setPinAttempts]            = useState(0)
  const [rescueMode,             setRescueMode]             = useState(isRescueUnlocked())
  const pinRef = useRef<HTMLInputElement>(null)

  // Extended profile state
  const saved = loadExtendedProfile()
  const [location,               setLocation]               = useState(saved?.location ?? "")
  const [emergencyContactName,   setEmergencyContactName]   = useState(saved?.emergencyContactName ?? "")
  const [emergencyContactNumber, setEmergencyContactNumber] = useState(saved?.emergencyContactNumber ?? "")
  const [skills,                 setSkills]                 = useState<string[]>(saved?.skills ?? [])
  const [customSkill,            setCustomSkill]            = useState("")
  const [saving,                 setSaving]                 = useState(false)

  const shortKey    = identity.publicKey.slice(0, 20) + "..."
  const profileDone = !!(saved?.location || saved?.emergencyContactName || saved?.skills?.length)

  const stats = [
    { label: "Messages Sent",    value: "127",    icon: MessageSquare },
    { label: "Messages Relayed", value: "342",    icon: Radio        },
    { label: "Peers Connected",  value: "8",      icon: Users        },
    { label: "Uptime",           value: "4h 23m", icon: Clock        },
  ]

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleNameSave() {
    const trimmed = displayName.trim()
    if (!trimmed || trimmed.length < 2) {
      setDisplayName(identity.displayName)
      setIsEditing(false)
      return
    }
    updateDisplayName(trimmed)
    onIdentityUpdate({ ...identity, displayName: trimmed })
    setIsEditing(false)
    toast.success("Display name updated")
  }

  function copyPublicKey() {
    navigator.clipboard.writeText(identity.publicKey)
    setCopied(true)
    toast.success("Public key copied")
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleSkill(skill: string) {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function addCustomSkill() {
    const trimmed = customSkill.trim()
    if (!trimmed || skills.includes(trimmed)) return
    setSkills(prev => [...prev, trimmed])
    setCustomSkill("")
  }

  async function handleSaveProfile() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    saveExtendedProfile({ location, emergencyContactName, emergencyContactNumber, skills })
    setSaving(false)
    toast.success("Profile saved")
    setShowProfile(false)
  }

  function handlePinChange(val: string) {
    const digits = val.replace(/\D/g, "")
    setPinInput(digits)
    setPinError("")
    if (digits.length === 4) {
      if (validatePin(digits)) {
        setRescueUnlocked(true)
        setRescueMode(true)
        setPinInput("")
        toast.success("Rescue mode unlocked")
      } else {
        setPinError("Incorrect PIN")
        setPinAttempts(a => a + 1)
        setTimeout(() => setPinInput(""), 600)
      }
    }
  }

  // ─── Rescue dashboard ───────────────────────────────────────────────────────

  if (rescueMode && isRescueUnlocked()) {
    return (
      <RescueDashboard
        identity={identity}
        onExit={() => {
          setRescueUnlocked(false)
          setRescueMode(false)
        }}
      />
    )
  }

  // ─── Extended profile sheet ─────────────────────────────────────────────────

  if (showProfile) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <button onClick={() => setShowProfile(false)}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Complete Profile</h1>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-1.5 text-primary text-sm font-semibold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Location */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Location</p>
            </div>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City or region (e.g. Delhi, North Zone)"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground">
              Shared with nearby mesh peers during emergencies
            </p>
          </div>

          {/* Emergency contact */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Emergency Contact</p>
            </div>
            <input
              type="text"
              value={emergencyContactName}
              onChange={e => setEmergencyContactName(e.target.value)}
              placeholder="Contact name"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <input
              type="tel"
              value={emergencyContactNumber}
              onChange={e => setEmergencyContactNumber(e.target.value)}
              placeholder="Phone number"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground">
              Included automatically in your SOS broadcast
            </p>
          </div>

          {/* Skills */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Skills</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Helps nearby peers know who can assist in an emergency
            </p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-all ${
                    skills.includes(skill)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={e => setCustomSkill(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCustomSkill()}
                placeholder="Add custom skill..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <button
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
                className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center disabled:opacity-40"
              >
                <Plus className="w-4 h-4 text-primary" />
              </button>
            </div>
            {skills.filter(s => !SKILL_OPTIONS.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.filter(s => !SKILL_OPTIONS.includes(s)).map(skill => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-full px-3 py-1.5"
                  >
                    {skill}
                    <button onClick={() => toggleSkill(skill)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Main profile screen ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 py-3 border-b border-border bg-card shrink-0">
        <h1 className="text-lg font-semibold text-foreground">My Identity</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Avatar and name */}
        <div className="flex items-center gap-4 bg-card border border-border rounded-xl p-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {displayName.split(" ").map(n => n[0]).join("").toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={e => e.key === "Enter" && handleNameSave()}
                autoFocus
                maxLength={30}
                className="bg-secondary text-foreground rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary w-full"
              />
            ) : (
              <button onClick={() => setIsEditing(true)} className="text-left">
                <p className="text-lg font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">Tap to edit name</p>
              </button>
            )}
            <p className="text-xs text-muted-foreground mt-1">ID: {identity.shortId}</p>
          </div>
        </div>

        {/* Complete profile banner */}
        <button
          onClick={() => setShowProfile(true)}
          className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">
                {profileDone ? "Edit complete profile" : "Complete your profile"}
              </p>
              <p className="text-xs text-muted-foreground">
                {profileDone
                  ? `${saved?.skills?.length ?? 0} skills · ${saved?.location || "no location"}`
                  : "Add location, emergency contact & skills"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!profileDone && (
              <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">Optional</span>
            )}
            {profileDone && (
              <span className="text-xs bg-green-500/10 text-green-500 rounded-full px-2 py-0.5">Done</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>

        {/* Rescue mode PIN — always visible, unlocks dashboard */}
        {!rescueMode && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Rescue mode</p>
            </div>
            <div className={`flex items-center gap-3 bg-background border rounded-xl px-3 py-2.5 transition-all ${
              pinError
                ? "border-destructive"
                : "border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            }`}>
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={e => handlePinChange(e.target.value)}
                placeholder="Enter rescue PIN"
                disabled={pinAttempts >= 5}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none tracking-widest"
              />
              {pinInput.length > 0 && (
                <span className="text-xs text-muted-foreground">{pinInput.length}/4</span>
              )}
            </div>
            {pinError && (
              <p className="text-xs text-destructive">{pinError}</p>
            )}
            {pinAttempts >= 5 && (
              <p className="text-xs text-destructive">Too many attempts. Restart the app.</p>
            )}
            <p className="text-xs text-muted-foreground">Authorized rescue personnel only</p>
          </div>
        )}

        {/* Rescue dashboard button — only after PIN unlocked */}
        {rescueMode && (
          <button
            onClick={() => setRescueMode(true)}
            className="w-full flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Rescue Dashboard</p>
                <p className="text-xs text-muted-foreground">View alerts, deploy teams, track rescues</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Public key */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">Public Key</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-foreground bg-secondary rounded-lg px-3 py-2 truncate">
              {shortKey}
            </code>
            <button
              onClick={copyPublicKey}
              className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              {copied
                ? <Check className="w-5 h-5 text-green-500" />
                : <Copy  className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Member since {new Date(identity.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <stat.icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {[
            { label: "Relay Mode",      desc: "Forward messages for others",       state: relayMode,    toggle: () => setRelayMode(v => !v)    },
            { label: "Store & Forward", desc: "Save and deliver when peers found",  state: storeForward, toggle: () => setStoreForward(v => !v) },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                onClick={item.toggle}
                className={`w-12 h-7 rounded-full transition-colors relative ${item.state ? "bg-primary" : "bg-secondary"}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${item.state ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Network status */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-4">Network Status</p>
          <div className="flex items-center justify-center">
            <svg width="200" height="120" viewBox="0 0 200 120" className="text-primary">
              <line x1="50"  y1="60" x2="100" y2="30" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="50"  y1="60" x2="100" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="100" y1="30" x2="150" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="100" y1="90" x2="150" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="100" y1="30" x2="100" y2="90" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <circle cx="50"  cy="60" r="12" fill="currentColor" className="animate-pulse" />
              <circle cx="100" cy="30" r="10" fill="currentColor" opacity="0.8" />
              <circle cx="100" cy="90" r="10" fill="currentColor" opacity="0.8" />
              <circle cx="150" cy="60" r="10" fill="currentColor" opacity="0.6" />
              <text x="50" y="85" textAnchor="middle" fill="currentColor" fontSize="10">You</text>
            </svg>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Mesh network healthy</span>
          </div>
        </div>

      </div>
    </div>
  )
}