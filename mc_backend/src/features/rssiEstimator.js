// src/features/rssiEstimator.js
// Converts BLE RSSI (signal strength) to approximate distance in metres.
// Not perfectly accurate — useful for "nearby / in range / far" UI labels.

import { RSSI_MEASURED_POWER } from '../constants';

// Rolling buffer per peer for smoothing noisy RSSI readings
const _rssiBuffers = new Map(); // peerId → number[]
const BUFFER_SIZE  = 5;

// Update RSSI reading for a peer — call every time you get a new RSSI from BLE scan
export function updateRssi(peerId, rssi) {
  if (!_rssiBuffers.has(peerId)) _rssiBuffers.set(peerId, []);
  const buf = _rssiBuffers.get(peerId);
  buf.push(rssi);
  if (buf.length > BUFFER_SIZE) buf.shift(); // keep last 5 readings
}

// Get smoothed distance estimate for a peer in metres
export function getDistance(peerId) {
  const buf = _rssiBuffers.get(peerId);
  if (!buf || buf.length === 0) return null;
  const smoothed = Math.round(buf.reduce((a, b) => a + b, 0) / buf.length);
  return rssiToMetres(smoothed);
}

// Human-readable label for UI — e.g. "Very close (~3m)"
export function getDistanceLabel(peerId) {
  const d = getDistance(peerId);
  if (d === null) return 'Unknown distance';
  if (d < 5)      return `Very close (~${d}m)`;
  if (d < 20)     return `Nearby (~${d}m)`;
  if (d < 50)     return `In range (~${d}m)`;
  return `Far away (~${d}m)`;
}

// Direct RSSI → metres conversion (no buffering)
export function rssiToMetres(rssi) {
  if (!rssi || rssi === 0) return null;
  const ratio = rssi / RSSI_MEASURED_POWER;
  let distance;
  if (ratio < 1.0) {
    distance = Math.pow(ratio, 10);
  } else {
    distance = 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
  }
  return Math.round(distance * 10) / 10; // 1 decimal place
}

export function clearPeer(peerId) {
  _rssiBuffers.delete(peerId);
}