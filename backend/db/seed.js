/**
 * Creates the tables and demo accounts. Run with:  npm run seed
 * In the default (file database) mode this is optional - the server does it
 * automatically on first start.
 */
require('dotenv').config();
const db = require('../config/db');
const { bootstrap } = require('./bootstrap');

bootstrap()
  .catch((err) => {
    console.error('\nSeed failed:', err.message || err.code || 'unknown error');
    if (err.code) console.error('Error code:', err.code);

    const hints = {
      ECONNREFUSED: 'MySQL is not running or the host/port is wrong.',
      ETIMEDOUT: 'Cannot reach the database. On a cloud host, check your IP allow-list.',
      ER_ACCESS_DENIED_ERROR: 'Wrong DB_USER or DB_PASSWORD in backend/.env.',
      ENOTFOUND: 'DB_HOST is wrong - copy it exactly from your provider console.',
      HANDSHAKE_SSL_ERROR: 'The provider requires TLS - set DB_SSL=true in backend/.env.',
    };
    if (hints[err.code]) console.error('Hint:', hints[err.code]);
    console.error(`\nTip: to run with no database at all, set DB_CLIENT=sqlite (the default).`);

    process.exit(1);
  })
  .then(() => process.exit(0));
