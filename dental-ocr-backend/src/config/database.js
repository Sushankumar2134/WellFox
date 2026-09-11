const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

async function initDatabase() {
  const SQL = await initSqlJs();
  const dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'dental_ocr.sqlite');

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialization TEXT,
      phone TEXT,
      clinic_name TEXT,
      clinic_address TEXT,
      clinic_registration_number TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dental_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT,
      record_date TEXT,
      receipt_number TEXT,
      chief_complaint TEXT,
      medical_history TEXT,
      dental_history TEXT,
      allergies TEXT,
      habits TEXT,
      treatment_plan TEXT,
      notes TEXT,
      next_follow_up TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS procedures (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL,
      tooth TEXT,
      procedure_name TEXT,
      notes TEXT,
      FOREIGN KEY (record_id) REFERENCES dental_records(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL UNIQUE,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      FOREIGN KEY (record_id) REFERENCES dental_records(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      record_id TEXT,
      title TEXT NOT NULL,
      type TEXT,
      category TEXT,
      file_path TEXT,
      ocr_raw_text TEXT,
      date TEXT,
      created_at TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (record_id) REFERENCES dental_records(id) ON DELETE SET NULL
    )
  `);

  // Migration: add ocr_raw_text column if it doesn't exist
  try {
    const cols = db.exec("PRAGMA table_info(documents)");
    if (cols.length > 0 && !cols[0].values.some(r => r[1] === 'ocr_raw_text')) {
      db.run('ALTER TABLE documents ADD COLUMN ocr_raw_text TEXT');
      console.log('Migration: added ocr_raw_text column to documents');
    }
  } catch (e) {
    // Column already exists or table doesn't exist yet (CREATE TABLE will handle it)
  }

  // Migration: add missing columns to dental_records
  const drCols = db.exec("PRAGMA table_info(dental_records)");
  if (drCols.length > 0) {
    const existingCols = drCols[0].values.map(r => r[1]);
    const migrations = [
      ['record_date', 'ALTER TABLE dental_records ADD COLUMN record_date TEXT'],
      ['receipt_number', 'ALTER TABLE dental_records ADD COLUMN receipt_number TEXT'],
      ['notes', 'ALTER TABLE dental_records ADD COLUMN notes TEXT'],
      ['next_follow_up', 'ALTER TABLE dental_records ADD COLUMN next_follow_up TEXT'],
    ];
    for (const [col, sql] of migrations) {
      if (!existingCols.includes(col)) {
        try { db.run(sql); console.log(`Migration: added ${col} to dental_records`); } catch {}
      }
    }
  }

  // Migration: add missing columns to doctors
  const docCols = db.exec("PRAGMA table_info(doctors)");
  if (docCols.length > 0) {
    const existingCols = docCols[0].values.map(r => r[1]);
    const migrations = [
      ['clinic_name', 'ALTER TABLE doctors ADD COLUMN clinic_name TEXT'],
      ['clinic_address', 'ALTER TABLE doctors ADD COLUMN clinic_address TEXT'],
      ['clinic_registration_number', 'ALTER TABLE doctors ADD COLUMN clinic_registration_number TEXT'],
    ];
    for (const [col, sql] of migrations) {
      if (!existingCols.includes(col)) {
        try { db.run(sql); console.log(`Migration: added ${col} to doctors`); } catch {}
      }
    }
  }

  saveDatabase();
  console.log('Database initialized at', dbPath);
}

function saveDatabase() {
  if (!db) return;
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'dental_ocr.sqlite');
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

module.exports = { getDb, initDatabase, queryAll, queryOne, runSql, saveDatabase };
