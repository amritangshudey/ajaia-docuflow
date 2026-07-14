import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use /tmp on Vercel (serverless), otherwise use local path
const dbPath = 
  process.env.NODE_ENV === 'test' 
    ? ':memory:' 
    : process.env.VERCEL 
    ? '/tmp/docuflow.db'
    : join(__dirname, 'docuflow.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Helper to run queries as promises
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Helper to get a single row
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to get all rows
export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize schema and seed data
export const initDb = async () => {
  // Create tables
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_color TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS shares (
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
      PRIMARY KEY (document_id, user_id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Seed default users if they don't exist (using INSERT OR IGNORE for concurrency safety)
  const seededUsers = [
    { id: 'user-alice', name: 'Alice Smith', email: 'alice@ajaia.com', avatar_color: '#EC4899' }, // Premium pink
    { id: 'user-bob', name: 'Bob Jones', email: 'bob@ajaia.com', avatar_color: '#3B82F6' }, // Premium blue
    { id: 'user-charlie', name: 'Charlie Brown', email: 'charlie@ajaia.com', avatar_color: '#10B981' } // Premium green
  ];

  for (const u of seededUsers) {
    await run(
      'INSERT OR IGNORE INTO users (id, name, email, avatar_color) VALUES (?, ?, ?, ?)',
      [u.id, u.name, u.email, u.avatar_color]
    );
  }
  console.log('Seeded database with default users.');
};

export default db;
