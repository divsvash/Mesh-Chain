// lib/rescue-store.ts
// Rescue mode state — PIN validation, SOS alerts, deployments, rescued stats.

export const RESCUE_PIN = "1234"; // change this to whatever PIN you want

export type SOSStatus = "unresolved" | "acknowledged" | "on_the_way" | "rescued";

export interface SOSAlert {
  id:           string;
  senderName:   string;
  senderId:     string;
  location:     { lat: number | null; lng: number | null } | null;
  battery:      string | null;
  timestamp:    number;
  status:       SOSStatus;
  responder:    string | null;  // rescue team member name
  rescuedAt:    number | null;
  distance:     string | null;  // estimated from RSSI
  hopCount:     number;
}

export interface RescueTeamMember {
  id:       string;
  name:     string;
  location: { lat: number; lng: number } | null;
  status:   "standby" | "deployed" | "returning";
  assignedSosId: string | null;
}

const KEYS = {
  unlocked:    "mc_rescue_unlocked",
  alerts:      "mc_rescue_alerts",
  team:        "mc_rescue_team",
};

// ─── PIN ──────────────────────────────────────────────────────────────────────

export function validatePin(pin: string): boolean {
  return pin === RESCUE_PIN;
}

export function setRescueUnlocked(val: boolean): void {
  if (typeof window === "undefined") return;
  if (val) sessionStorage.setItem(KEYS.unlocked, "1");
  else     sessionStorage.removeItem(KEYS.unlocked);
}

export function isRescueUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEYS.unlocked) === "1";
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function loadAlerts(): SOSAlert[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.alerts) || "[]");
  } catch { return []; }
}

export function saveAlerts(alerts: SOSAlert[]): void {
  localStorage.setItem(KEYS.alerts, JSON.stringify(alerts));
}

export function addOrUpdateAlert(alert: SOSAlert): SOSAlert[] {
  const alerts = loadAlerts();
  const idx    = alerts.findIndex(a => a.id === alert.id);
  if (idx >= 0) alerts[idx] = alert;
  else          alerts.unshift(alert);
  saveAlerts(alerts);
  return alerts;
}

export function acknowledgeAlert(id: string, responderName: string): SOSAlert[] {
  const alerts = loadAlerts().map(a =>
    a.id === id
      ? { ...a, status: "acknowledged" as SOSStatus, responder: responderName }
      : a
  );
  saveAlerts(alerts);
  return alerts;
}

export function markOnTheWay(id: string, responderName: string): SOSAlert[] {
  const alerts = loadAlerts().map(a =>
    a.id === id
      ? { ...a, status: "on_the_way" as SOSStatus, responder: responderName }
      : a
  );
  saveAlerts(alerts);
  return alerts;
}

export function markRescued(id: string): SOSAlert[] {
  const alerts = loadAlerts().map(a =>
    a.id === id
      ? { ...a, status: "rescued" as SOSStatus, rescuedAt: Date.now() }
      : a
  );
  saveAlerts(alerts);
  return alerts;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export function loadTeam(): RescueTeamMember[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.team) || "[]");
  } catch { return []; }
}

export function saveTeam(team: RescueTeamMember[]): void {
  localStorage.setItem(KEYS.team, JSON.stringify(team));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getStats(alerts: SOSAlert[]) {
  return {
    total:       alerts.length,
    unresolved:  alerts.filter(a => a.status === "unresolved").length,
    acknowledged:alerts.filter(a => a.status === "acknowledged").length,
    onTheWay:    alerts.filter(a => a.status === "on_the_way").length,
    rescued:     alerts.filter(a => a.status === "rescued").length,
  };
}