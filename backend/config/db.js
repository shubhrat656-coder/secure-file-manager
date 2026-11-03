/**
 * Database entry point.
 *
 * By default the app uses a local file database (SQLite via sql.js), so it runs
 * with zero setup - no MySQL server, no cloud account, no .env file.
 *
 * To use MySQL instead (recommended for production / portfolio), set:
 *   DB_CLIENT=mysql
 * in backend/.env along with the DB_* connection details.
 */
const client = String(process.env.DB_CLIENT || 'sqlite').toLowerCase();

module.exports = client === 'mysql'
  ? require('./db.mysql')
  : require('./db.sqlite');
