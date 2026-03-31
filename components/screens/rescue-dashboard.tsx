"use client"

import { useState, useEffect } from "react"
import {
  AlertTriangle, CheckCircle, Navigation, UserCheck,
  ArrowLeft, MapPin, Battery, Radio, Users,
  Clock, Shield, Activity, ChevronDown, ChevronUp
} from "lucide-react"
import {
  loadAlerts, acknowledgeAlert, markOnTheWay,
  markRescued, getStats, loadTeam,
  type SOSAlert,
} from "@/lib/rescue-store"
import type { Identity } from "@/lib/identity-store"

interface RescueDashboardProps {
  identity: Identity;
  onExit:   () => void;
}

const STATUS_CONFIG = {
  unresolved:   { label: "Unresolved",   color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30"   },
  acknowledged: { label: "Acknowledged", color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  on_the_way:   { label: "On the way",   color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/30"  },
  rescued:      { label: "Rescued",      color: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/30" },
}

// Demo alerts so dashboard looks populated on first open
const DEMO_ALERTS: SOSAlert[] = [
  {
    id: "demo-1",
    senderName: "Priya Sharma",
    senderId:   "abc123",
    location:   { lat: 28.6139, lng: 77.2090 },
    battery:    "12%",
    timestamp:  Date.now() - 5 * 60 * 1000,
    status:     "unresolved",
    responder:  null,
    rescuedAt:  null,
    distance:   "~120m",
    hopCount:   3,
  },
  {
    id: "demo-2",
    senderName: "Rahul Verma",
    senderId:   "def456",
    location:   { lat: 28.6200, lng: 77.2100 },
    battery:    "4%",
    timestamp:  Date.now() - 12 * 60 * 1000,
    status:     "on_the_way",
    responder:  "Team Alpha",
    rescuedAt:  null,
    distance:   "~340m",
    hopCount:   5,
  },
  {
    id: "demo-3",
    senderName: "Anita Desai",
    senderId:   "ghi789",
    location:   null,
    battery:    "2%",
    timestamp:  Date.now() - 28 * 60 * 1000,
    status:     "rescued",
    responder:  "Team Beta",
    rescuedAt:  Date.now() - 10 * 60 * 1000,
    distance:   "~80m",
    hopCount:   2,
  },
]

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function AlertCard({
  alert,
  identity,
  onAck,
  onWay,
  onRescued,
}: {
  alert:      SOSAlert;
  identity:   Identity;
  onAck:      (id: string) => void;
  onWay:      (id: string) => void;
  onRescued:  (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[alert.status];

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${cfg.border}`}>
      {/* Card header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
          alert.status === "unresolved" ? "bg-red-500 animate-pulse" :
          alert.status === "on_the_way" ? "bg-blue-500 animate-pulse" :
          alert.status === "acknowledged" ? "bg-amber-500" : "bg-green-500"
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {alert.senderName}
            </p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {alert.distance && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Radio className="w-3 h-3" />{alert.distance}
              </span>
            )}
            {alert.battery && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Battery className="w-3 h-3" />{alert.battery}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />{timeAgo(alert.timestamp)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="w-3 h-3" />{alert.hopCount} hops
            </span>
          </div>

          {alert.location?.lat && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {alert.location.lat.toFixed(4)}, {alert.location.lng?.toFixed(4)}
            </p>
          )}
          {!alert.location?.lat && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />Location unavailable
            </p>
          )}
        </div>

        {expanded
          ? <ChevronUp   className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        }
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {alert.responder && (
            <p className="text-xs text-muted-foreground">
              Responder: <span className="text-foreground font-medium">{alert.responder}</span>
            </p>
          )}
          {alert.rescuedAt && (
            <p className="text-xs text-green-500">
              Rescued {timeAgo(alert.rescuedAt)}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {alert.status === "unresolved" && (
              <button
                onClick={() => onAck(alert.id)}
                className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Acknowledge
              </button>
            )}
            {(alert.status === "unresolved" || alert.status === "acknowledged") && (
              <button
                onClick={() => onWay(alert.id)}
                className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/30 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <Navigation className="w-3.5 h-3.5" />
                On the way
              </button>
            )}
            {alert.status === "on_the_way" && (
              <button
                onClick={() => onRescued(alert.id)}
                className="flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded-xl px-3 py-2 text-xs font-medium"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Mark rescued
              </button>
            )}
            {alert.status === "rescued" && (
              <span className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                Successfully rescued
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RescueDashboard({ identity, onExit }: RescueDashboardProps) {
  const [alerts,     setAlerts]     = useState<SOSAlert[]>([])
  const [filter,     setFilter]     = useState<"all" | "unresolved" | "on_the_way" | "rescued">("all")
  const [tab,        setTab]        = useState<"alerts" | "team" | "stats">("alerts")
  const team = loadTeam();

  useEffect(() => {
    // Load saved + merge demo alerts if empty
    const saved = loadAlerts();
    if (saved.length === 0) {
      setAlerts(DEMO_ALERTS);
    } else {
      setAlerts(saved);
    }
  }, []);

  const stats = getStats(alerts);

  const filtered = alerts.filter(a => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  // Sort: unresolved first, then by time
  const sorted = [...filtered].sort((a, b) => {
    const order = { unresolved: 0, acknowledged: 1, on_the_way: 2, rescued: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.timestamp - a.timestamp;
  });

  function handleAck(id: string) {
    setAlerts(acknowledgeAlert(id, identity.displayName));
  }
  function handleWay(id: string) {
    setAlerts(markOnTheWay(id, identity.displayName));
  }
  function handleRescued(id: string) {
    setAlerts(markRescued(id));
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <button onClick={onExit} className="flex items-center gap-1.5 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-base font-semibold text-foreground">Rescue Dashboard</span>
        </div>
        <div className="flex items-center gap-1.5">
          {stats.unresolved > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              {stats.unresolved}
            </span>
          )}
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-4 gap-0 border-b border-border bg-card shrink-0">
        {[
          { label: "Total",      value: stats.total,        color: "text-foreground"  },
          { label: "Active",     value: stats.unresolved,   color: "text-red-500"     },
          { label: "En route",   value: stats.onTheWay,     color: "text-blue-500"    },
          { label: "Rescued",    value: stats.rescued,      color: "text-green-500"   },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center py-3 ${i < 3 ? "border-r border-border" : ""}`}
          >
            <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card shrink-0">
        {(["alerts", "team", "stats"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            {t === "alerts" ? `Alerts (${alerts.length})` :
             t === "team"   ? `Team (${team.length})` : "Stats"}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Alerts tab ── */}
        {tab === "alerts" && (
          <div className="p-4 space-y-3">
            {/* Filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(["all", "unresolved", "on_the_way", "rescued"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs rounded-full px-3 py-1.5 border shrink-0 transition-all ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {f === "all" ? "All" :
                   f === "unresolved" ? "Active" :
                   f === "on_the_way" ? "En route" : "Rescued"}
                </button>
              ))}
            </div>

            {/* Cluster banner */}
            {stats.unresolved >= 2 && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-500 font-medium">
                  {stats.unresolved} active distress signals in this area
                </p>
              </div>
            )}

            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <p className="text-sm text-muted-foreground">No alerts in this category</p>
              </div>
            ) : (
              sorted.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  identity={identity}
                  onAck={handleAck}
                  onWay={handleWay}
                  onRescued={handleRescued}
                />
              ))
            )}
          </div>
        )}

        {/* ── Team tab ── */}
        {tab === "team" && (
          <div className="p-4 space-y-3">
            {/* Demo team members */}
            {[
              { name: "Team Alpha", status: "deployed",  assigned: "Rahul Verma",  lat: 28.6200, lng: 77.2100 },
              { name: "Team Beta",  status: "standby",   assigned: null,           lat: 28.6139, lng: 77.2090 },
              { name: "Team Gamma", status: "returning", assigned: "Anita Desai",  lat: 28.6180, lng: 77.2050 },
            ].map(member => (
              <div key={member.name} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      {member.assigned
                        ? <p className="text-xs text-muted-foreground">→ {member.assigned}</p>
                        : <p className="text-xs text-muted-foreground">No assignment</p>
                      }
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    member.status === "deployed"  ? "bg-blue-500/10 text-blue-500" :
                    member.status === "standby"   ? "bg-green-500/10 text-green-500" :
                                                    "bg-amber-500/10 text-amber-500"
                  }`}>
                    {member.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {member.lat.toFixed(4)}, {member.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}

            <p className="text-xs text-muted-foreground text-center py-2">
              Team locations update via mesh GPS packets
            </p>
          </div>
        )}

        {/* ── Stats tab ── */}
        {tab === "stats" && (
          <div className="p-4 space-y-4">

            {/* Response rate */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Response rate</p>
              <div className="space-y-2">
                {[
                  { label: "Rescue rate",    value: stats.total ? Math.round((stats.rescued / stats.total) * 100) : 0,     color: "bg-green-500" },
                  { label: "Response rate",  value: stats.total ? Math.round(((stats.total - stats.unresolved) / stats.total) * 100) : 0, color: "bg-blue-500" },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{bar.label}</span>
                      <span className="text-xs font-medium text-foreground">{bar.value}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`${bar.color} h-2 rounded-full transition-all`}
                        style={{ width: `${bar.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total alerts",   value: stats.total,        icon: AlertTriangle, color: "text-foreground" },
                { label: "People rescued", value: stats.rescued,       icon: UserCheck,     color: "text-green-500"  },
                { label: "Teams deployed", value: 2,                   icon: Navigation,    color: "text-blue-500"   },
                { label: "Avg hops",       value: alerts.length ? (alerts.reduce((s,a) => s + a.hopCount, 0) / alerts.length).toFixed(1) : "—", icon: Activity, color: "text-primary" },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
                  <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent rescued */}
            {alerts.filter(a => a.status === "rescued").length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Recently rescued</p>
                {alerts.filter(a => a.status === "rescued").map(a => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-foreground">{a.senderName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {a.rescuedAt ? timeAgo(a.rescuedAt) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}