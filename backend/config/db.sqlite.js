/**
 * Zero-setup database: SQLite compiled to WebAssembly (sql.js).
 *
 * No native build, no server process. The whole database lives in a single
 * file (backend/data/app.db by default) that is written after every change.
 */
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'app.db');

let db = null;
let initPromise = null;
let inTransaction = false;

function persist() {
  if (!db || inTransaction) return;
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await initSqlJs();
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    db = fs.existsSync(DB_FILE)
      ? new SQL.Database(fs.readFileSync(DB_FILE))
      : new SQL.Database();
    db.run('PRAGMA foreign_keys = ON');
    return db;
  })();
  return initPromise;
}

// SQLite has no row-level locking, so strip MySQL's FOR UPDATE clause.
const FOR_UPDATE = /\s+FOR\s+UPDATE\s*$/i;

/**
 * Mirrors mysql2's return shape so the controllers are database-agnostic:
 *   SELECT -> [rows]
 *   write  -> [{ insertId, affectedRows }]
 */
async function query(sql, params = []) {
  await init();
  const clean = sql.replace(FOR_UPDATE, '');
  const isRead = /^\s*(select|pragma|with)\b/i.test(clean);
  const stmt = db.prepare(clean);

  try {
    if (params && params.length) stmt.bind(params);

    if (isRead) {
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      return [rows];
    }

    while (stmt.step()) { /* execute the statement */ }

    const affectedRows = db.getRowsModified();
    const idResult = db.exec('SELECT last_insert_rowid() AS id');
    const insertId = idResult.length ? idResult[0].values[0][0] : 0;
    persist();
    return [{ insertId, affectedRows }];
  } finally {
    stmt.free();
  }
}

// Runs a multi-statement SQL script (used for schema creation).
async function exec(script) {
  await init();
  db.run(script);
  persist();
}

// A minimal stand-in for a pooled connection, so transactional code works unchanged.
async function getConnection() {
  await init();
  return {
    query,
    beginTransaction: async () => {
      inTransaction = true;
      db.run('BEGIN');
    },
    commit: async () => {
      db.run('COMMIT');
      inTransaction = false;
      persist();
    },
    rollback: async () => {
      try { db.run('ROLLBACK'); } catch (e) { /* already rolled back */ }
      inTransaction = false;
    },
    release: () => {},
  };
}

module.exports = { client: 'sqlite', init, query, exec, getConnection, DB_FILE };
