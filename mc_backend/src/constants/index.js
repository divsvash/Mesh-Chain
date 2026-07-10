// src/constants/index.js
// Single source of truth for all configuration values.

// ─── BLE ──────────────────────────────────────────────────────────────────────
export const BLE_SERVICE_UUID        = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
export const BLE_MESSAGE_CHAR_UUID   = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
export const BLE_IDENTITY_CHAR_UUID  = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
export const BLE_MAX_CHUNK_BYTES     = 400;
export const BLE_SCAN_RESTART_DELAY  = 4000;   // ms before restarting a failed scan

// ─── WiFi Direct ──────────────────────────────────────────────────────────────
export const WIFI_SOCKET_PORT        = 8765;
export const WIFI_RECONNECT_DELAY    = 5000;

// ─── Mesh ─────────────────────────────────────────────────────────────────────
export const MESSAGE_MAX_TTL         = 7;       // max hops
export const SEEN_MESSAGE_CACHE_SIZE = 500;     // max IDs kept in memory
export const MIN_BATTERY_TO_RELAY    = 0.15;    // stop relaying below 15%
export const STORE_FORWARD_FLUSH_MS  = 30_000;  // flush stored msgs every 30s
export const SOS_REPEAT_INTERVAL_MS  = 60_000;  // re-broadcast SOS every 60s

// ─── Blockchain ───────────────────────────────────────────────────────────────
export const GENESIS_PREV_HASH = '0'.repeat(64);

// ─── Storage ──────────────────────────────────────────────────────────────────
export const DB_NAME                 = 'meshchain.db';
export const MESSAGE_PAGE_SIZE       = 50;

// ─── Identity ─────────────────────────────────────────────────────────────────
export const SECURE_STORE_PRIVATE_KEY  = 'mc_private_key';
export const SECURE_STORE_PUBLIC_KEY   = 'mc_public_key';
export const SECURE_STORE_DISPLAY_NAME = 'mc_display_name';

// ─── Message types & channels ────────────────────────────────────────────────
export const MESSAGE_TYPES = Object.freeze({
  CHAT:      'chat',
  BROADCAST: 'broadcast',
  SOS:       'sos',
  SYSTEM:    'system',
  ACK:       'ack',
});
// ─── SOS features ─────────────────────────────────────────────────────────────
export const SOS_ACK_TIMEOUT_MS      = 5 * 60 * 1000;  // 5 min — escalate if no ACK
export const SOS_ACK_REBROADCAST_MS  = 30_000;          // repeat SOS every 30s until ACK
export const BATTERY_SOS_THRESHOLD   = 0.02;            // auto-SOS below 2%
export const BATTERY_CHECK_INTERVAL  = 60_000;          // check battery every 60s
export const RSSI_MEASURED_POWER     = -59;             // calibrate per device
export const SOS_TTL                 = 10;              // SOS gets higher TTL than normal msgs

export const CHANNELS = Object.freeze({
  GENERAL:   'general',
  EMERGENCY: 'emergency',
  VILLAGE:   'village_updates',
  RELIEF:    'relief_info',
});
