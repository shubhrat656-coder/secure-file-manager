/**
 * Creates the tables and the demo accounts. Works for both database modes.
 * Safe to run repeatedly - it will not duplicate users.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const DEMO_USERS = [
  ['Admin User',     'admin@example.com',   'Admin@123',   'admin'],
  ['Maya Manager',   'manager@example.com', 'Manager@123', 'manager'],
  ['Leo Level Two',  'level2@example.com',  'Level2@123',  'level2'],
  ['Lara Level One', 'level1@example.com',  'Level1@123',  'level1'],
  ['Uma Uploader',   'user@example.com',    'User@123',    'user'],
];

async function ensureSchema() {
  if (db.client === 'sqlite') {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sqlite.sql'), 'utf8');
    await db.exec(schema);
    return;
  }

  // MySQL: connect without a database so we can create it if it is missing.
  const mysql = require('mysql2/promise');
  const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';
  const dbName = process.env.DB_NAME || 'secure_file_manager';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  try {
    await conn.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '`');
    console.log(`Database "${dbName}" ready.`);
  } catch (err) {
    console.log(`Skipping CREATE DATABASE (${err.code || 'not permitted'}); using existing "${dbName}".`);
  }

  await conn.query('USE `' + dbName + '`');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(schema);
  await conn.end();
}

async function seedUsers() {
  for (const [name, email, password, role] of DEMO_USERS) {
    const hash = await bcrypt.hash(password, 10);
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length) {
      await db.query('UPDATE users SET name = ?, password_hash = ?, role = ? WHERE email = ?', [
        name, hash, role, email,
      ]);
    } else {
      await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role]
      );
    }
  }
}

async function bootstrap({ quiet = false } = {}) {
  await ensureSchema();
  await seedUsers();

  if (!quiet) {
    console.log(`\nDatabase ready (${db.client}). Demo accounts (email / password / role):`);
    DEMO_USERS.forEach((u) => console.log(`  ${u[1].padEnd(22)} ${u[2].padEnd(13)} ${u[3]}`));
    console.log('\nUpload a file as "user", then approve in order: level1 -> level2 -> manager.\n');
  }

  return DEMO_USERS;
}

module.exports = { bootstrap, DEMO_USERS };
