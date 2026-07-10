// __mocks__/expo-sqlite.js
// In-memory SQLite mock. Stores rows in plain JS objects per table.
// Enough for unit tests — integration tests need a real device.

class MockDB {
  constructor() { this._tables = {}; }

  async execAsync(sql) {
    // Extract CREATE TABLE statements and initialise empty arrays
    const matches = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)];
    for (const [, name] of matches) {
      if (!this._tables[name]) this._tables[name] = [];
    }
  }

  async runAsync(sql, params = []) {
    // INSERT OR REPLACE INTO <table> ... VALUES (...)
    const insertMatch = sql.match(/INSERT OR (?:REPLACE|IGNORE) INTO (\w+)/i);
    if (insertMatch) {
      const table = insertMatch[1];
      if (!this._tables[table]) this._tables[table] = [];
      // We store params as a raw row keyed by position — good enough for unit tests
      const row = { _params: params, id: params[0] };
      const idx  = this._tables[table].findIndex(r => r.id === row.id);
      if (idx >= 0) this._tables[table][idx] = row;
      else          this._tables[table].push(row);
      return { lastInsertRowId: params[0], changes: 1 };
    }

    const deleteMatch = sql.match(/DELETE FROM (\w+) WHERE id = \?/i);
    if (deleteMatch) {
      const table = deleteMatch[1];
      if (this._tables[table]) {
        this._tables[table] = this._tables[table].filter(r => r.id !== params[0]);
      }
      return { changes: 1 };
    }

    return { changes: 0 };
  }

  async getAllAsync(sql, params = []) {
    const match = sql.match(/FROM (\w+)/i);
    if (!match) return [];
    const table = match[1];
    return (this._tables[table] || []).slice(0, params[params.length - 2] || 50);
  }

  async getFirstAsync(sql, params = []) {
    const rows = await this.getAllAsync(sql, params);
    if (sql.includes('COUNT(*)')) return { n: rows.length, count: rows.length };
    return rows[0] ?? null;
  }
}

const _db = new MockDB();

module.exports = {
  openDatabaseAsync: jest.fn(async () => _db),
  _db,
};
