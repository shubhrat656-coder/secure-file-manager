require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const fileRoutes = require('./routes/file.routes');
const approvalRoutes = require('./routes/approval.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// --- Global middleware ---
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// --- Health check ---
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', database: db.client, uptime: process.uptime() })
);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/users', userRoutes);

// --- 404 ---
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// --- Central error handler ---
app.use((err, req, res, next) => {
  // Some driver errors arrive with an empty message, so fall back to the code.
  const detail = err.message || err.code || 'Internal server error';
  console.error('[error]', err.code ? `${err.code}: ${detail}` : detail);
  res.status(err.status || 500).json({ message: detail, code: err.code || null });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`Secure File Manager API running on http://localhost:${PORT}`);

  try {
    // In file-database mode the tables and demo accounts are created
    // automatically, so the app works with no manual database step.
    if (db.client === 'sqlite') {
      const { bootstrap } = require('./db/bootstrap');
      await bootstrap({ quiet: true });
      console.log('Local file database ready (no MySQL needed).');
    }

    const conn = await db.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    console.log('Database connection OK');
  } catch (err) {
    console.error('');
    console.error('[WARNING] Could not connect to the database:', err.code || err.message);
    console.error('  Check the DB_* values in backend/.env.');
    console.error('  On a cloud host, DB_SSL must be true and your IP must be allow-listed.');
    console.error('  To avoid a database entirely, set DB_CLIENT=sqlite (the default).');
    console.error('');
  }
});

// A clear message beats a raw stack trace when the port is taken.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other process, or set a different PORT in backend/.env.`);
    process.exit(1);
  }
  throw err;
});
