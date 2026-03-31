// src/storage/StorageManager.js
// SQLite persistence layer.
// Stores all messages (with verification status) and a store-and-forward queue.

import * as SQLite from 'expo-sqlite';
import { DB_NAME, MESSAGE_PAGE_SIZE } from '../constants';

export class StorageManager {
  constructor() {
    this.db = null;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async init() {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync('PRAGMA journal_mode = WAL;');
    await this._migrate();
    console.log('[Storage] Ready');
  }

  async _migrate() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id           TEXT PRIMARY KEY,
        type         TEXT NOT NULL,
        channel      TEXT,
        sender_id    TEXT NOT NULL,
        sender_name  TEXT,
        content      TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        timestamp    INTEGER NOT NULL,
        hop_count    INTEGER DEFAULT 0,
        ttl          INTEGER DEFAULT 0,
        verified     INTEGER DEFAULT 0,
        block_hash   TEXT,
        signature    TEXT,
        created_at   INTEGER DEFAULT (strftime('%s','now') * 1000)
      );

      CREATE TABLE IF NOT EXISTS forward_queue (
        id           TEXT PRIMARY KEY,
        message_json TEXT NOT NULL,
        queued_at    INTEGER DEFAULT (strftime('%s','now') * 1000),
        attempts     INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS peers (
        id           TEXT PRIMARY KEY,
        display_name TEXT,
        public_key   TEXT,
        last_seen    INTEGER,
        connection_type TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_msg_ts      ON messages(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_msg_type    ON messages(type);
      CREATE INDEX IF NOT EXISTS idx_msg_channel ON messages(channel);
      CREATE INDEX IF NOT EXISTS idx_msg_sender  ON messages(sender_id);
    `);
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  async saveMessage(msg) {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO messages
         (id, type, channel, sender_id, sender_name, content,
          location_lat, location_lng, timestamp, hop_count, ttl,
          verified, block_hash, signature)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        msg.id,
        msg.type,
        msg.channel ?? null,
        msg.senderId,
        msg.senderName ?? null,
        msg.content,
        msg.location?.lat ?? null,
        msg.location?.lng ?? null,
        msg.timestamp,
        msg.hopCount ?? 0,
        msg.ttl ?? 0,
        msg.verified ? 1 : 0,
        msg.blockHash ?? null,
        msg.signature ?? null,
      ]
    );
  }

  async getMessages({ limit = MESSAGE_PAGE_SIZE, offset = 0, channel = null, type = null, senderId = null } = {}) {
    const where  = [];
    const params = [];

    if (channel)  { where.push('channel = ?');   params.push(channel); }
    if (type)     { where.push('type = ?');       params.push(type); }
    if (senderId) { where.push('sender_id = ?');  params.push(senderId); }

    const sql = [
      'SELECT * FROM messages',
      where.length ? 'WHERE ' + where.join(' AND ') : '',
      'ORDER BY timestamp DESC LIMIT ? OFFSET ?',
    ].filter(Boolean).join(' ');

    params.push(limit, offset);
    const rows = await this.db.getAllAsync(sql, params);
    return rows.map(this._rowToMessage);
  }

  async getMessage(id) {
    const row = await this.db.getFirstAsync('SELECT * FROM messages WHERE id = ?', [id]);
    return row ? this._rowToMessage(row) : null;
  }

  async getSOSMessages() {
    return this.getMessages({ type: 'sos' });
  }

  async getMessageCount() {
    const r = await this.db.getFirstAsync('SELECT COUNT(*) as n FROM messages');
    return r?.n ?? 0;
  }

  async clearMessages() {
    await this.db.runAsync('DELETE FROM messages');
  }

  _rowToMessage(row) {
    return {
      id:         row.id,
      type:       row.type,
      channel:    row.channel,
      senderId:   row.sender_id,
      senderName: row.sender_name,
      content:    row.content,
      location:   row.location_lat != null ? { lat: row.location_lat, lng: row.location_lng } : null,
      timestamp:  row.timestamp,
      hopCount:   row.hop_count,
      ttl:        row.ttl,
      verified:   row.verified === 1,
      blockHash:  row.block_hash,
      signature:  row.signature,
    };
  }

  // ─── Store-and-forward queue ─────────────────────────────────────────────────

  async enqueue(message) {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO forward_queue (id, message_json) VALUES (?,?)',
      [message.id, JSON.stringify(message)]
    );
  }

  async dequeue() {
    const rows = await this.db.getAllAsync(
      'SELECT * FROM forward_queue ORDER BY queued_at ASC LIMIT 50'
    );
    return rows.map(r => JSON.parse(r.message_json));
  }

  async removeFromQueue(messageId) {
    await this.db.runAsync('DELETE FROM forward_queue WHERE id = ?', [messageId]);
  }

  async incrementAttempts(messageId) {
    await this.db.runAsync(
      'UPDATE forward_queue SET attempts = attempts + 1 WHERE id = ?',
      [messageId]
    );
  }

  // Discard messages that have been attempted too many times (stale)
  async pruneQueue(maxAttempts = 20) {
    await this.db.runAsync(
      'DELETE FROM forward_queue WHERE attempts >= ?',
      [maxAttempts]
    );
  }

  async getQueueSize() {
    const r = await this.db.getFirstAsync('SELECT COUNT(*) as n FROM forward_queue');
    return r?.n ?? 0;
  }

  // ─── Peer registry ────────────────────────────────────────────────────────────

  async upsertPeer({ id, displayName, publicKey, connectionType }) {
    await this.db.runAsync(
      `INSERT INTO peers (id, display_name, public_key, last_seen, connection_type)
       VALUES (?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         display_name    = excluded.display_name,
         public_key      = excluded.public_key,
         last_seen       = excluded.last_seen,
         connection_type = excluded.connection_type`,
      [id, displayName ?? null, publicKey ?? null, Date.now(), connectionType ?? null]
    );
  }

  async getKnownPeers() {
    return this.db.getAllAsync('SELECT * FROM peers ORDER BY last_seen DESC');
  }
}
