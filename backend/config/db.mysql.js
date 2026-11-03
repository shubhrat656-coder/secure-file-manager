const mysql = require('mysql2/promise');

// Cloud/managed MySQL requires TLS; set DB_SSL=true for Aiven, Railway, TiDB, etc.
const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'secure_file_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

module.exports = {
  client: 'mysql',
  init: async () => {},
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection(),
  exec: (script) => pool.query(script),
  pool,
};
