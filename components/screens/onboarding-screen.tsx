"use client"

import { useState, useRef } from "react"
import { Shield, Loader2, Wifi } from "lucide-react"
import { createIdentity } from "@/lib/identity-store"
import type { Identity } from "@/lib/identity-store"

interface OnboardingScreenProps {
  onComplete: (identity: Identity) => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [name,    setName]    = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed)           { setError("Please enter your name"); return; }
    if (trimmed.length < 2) { setError("Name must be at least 2 characters"); return; }
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 900));
    onComplete(createIdentity(trimmed));
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">MeshChain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Offline ready</span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">

        {/* Logo + title */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center w-24 h-24">
            <div
              className="absolute w-24 h-24 rounded-full bg-primary/10 animate-ping"
              style={{ animationDuration: "2.5s" }}
            />
            <div
              className="absolute w-16 h-16 rounded-full bg-primary/15 animate-ping"
              style={{ animationDuration: "2s", animationDelay: "0.4s" }}
            />
            <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center z-10">
              <Wifi className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Welcome to MeshChain</h1>
            <p className="text-sm text-muted-foreground mt-1">Communicate without internet</p>
          </div>
        </div>

        {/* Create account card */}
        <div className="w-full bg-card border border-border rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Create your account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Just your name — no email or password
            </p>
          </div>

          <div
            className={`flex items-center gap-3 bg-background border rounded-xl px-3 py-2.5 transition-all ${
              error
                ? "border-destructive"
                : "border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            }`}
            onClick={() => inputRef.current?.focus()}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {name.trim()
                  ? name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  : "?"}
              </span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Enter your name..."
              maxLength={30}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
            />
            {name.trim().length >= 2 && (
              <span className="text-xs font-semibold text-primary">✓</span>
            )}
          </div>

          {error && <p className="text-xs text-destructive px-1">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {["Keypair generated", "Messages signed", "Mesh identity"].map((tag, i) => (
              <span key={i} className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || name.trim().length < 2}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating your keys...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Your private key never leaves this device
          </p>
        </div>
      </div>
    </div>
  );
}