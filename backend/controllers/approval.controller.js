const pool = require('../config/db');
const { STATUS, STATUS_TO_ROLE, STATUS_TO_NEXT, STATUS_LEVEL } = require('../utils/roles');

// GET /api/approvals/pending
// Returns the files that are waiting for the *caller's* stage.
exports.pendingForMe = async (req, res, next) => {
  try {
    const expectedStatus = Object.keys(STATUS_TO_ROLE).find(
      (status) => STATUS_TO_ROLE[status] === req.user.role
    );

    if (!expectedStatus) {
      return res.status(400).json({ message: 'Your role is not part of the approval chain' });
    }

    const [rows] = await pool.query(
      `SELECT f.*, u.name AS uploaded_by_name
       FROM files f JOIN users u ON u.id = f.uploaded_by
       WHERE f.status = ?
       ORDER BY f.created_at ASC`,
      [expectedStatus]
    );

    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

// POST /api/approvals/:fileId/approve
exports.approve = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the row so two approvers cannot act on the same file at once.
    const [rows] = await conn.query('SELECT * FROM files WHERE id = ? FOR UPDATE', [req.params.fileId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'File not found' });
    }

    const file = rows[0];
    const requiredRole = STATUS_TO_ROLE[file.status];

    if (!requiredRole) {
      await conn.rollback();
      return res.status(400).json({ message: `File is not awaiting approval (status: ${file.status})` });
    }

    // ---- The gating rule ----
    // Only the role responsible for the current stage may approve. Because the
    // status itself encodes the stage, a Level 2 user simply cannot act while
    // the file is still pending_l1 - the request is rejected here.
    if (requiredRole !== req.user.role) {
      await conn.rollback();
      return res.status(403).json({
        message: `This file is awaiting approval from "${requiredRole}", not "${req.user.role}"`,
      });
    }

    const nextStatus = STATUS_TO_NEXT[file.status];

    await conn.query('UPDATE files SET status = ?, current_level = ? WHERE id = ?', [
      nextStatus,
      STATUS_LEVEL[nextStatus] || 4,
      file.id,
    ]);

    await conn.query(
      'INSERT INTO approval_logs (file_id, actor_id, action, level, comment) VALUES (?, ?, ?, ?, ?)',
      [file.id, req.user.id, 'approved', STATUS_LEVEL[file.status], req.body.comment || null]
    );

    await conn.commit();
    return res.json({ id: file.id, status: nextStatus });
  } catch (err) {
    await conn.rollback();
    return next(err);
  } finally {
    conn.release();
  }
};

// POST /api/approvals/:fileId/reject
exports.reject = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM files WHERE id = ? FOR UPDATE', [req.params.fileId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'File not found' });
    }

    const file = rows[0];
    const requiredRole = STATUS_TO_ROLE[file.status];

    if (!requiredRole) {
      await conn.rollback();
      return res.status(400).json({ message: `File is not awaiting approval (status: ${file.status})` });
    }

    if (requiredRole !== req.user.role) {
      await conn.rollback();
      return res.status(403).json({
        message: `This file is awaiting approval from "${requiredRole}", not "${req.user.role}"`,
      });
    }

    await conn.query('UPDATE files SET status = ? WHERE id = ?', [STATUS.REJECTED, file.id]);
    await conn.query(
      'INSERT INTO approval_logs (file_id, actor_id, action, level, comment) VALUES (?, ?, ?, ?, ?)',
      [file.id, req.user.id, 'rejected', STATUS_LEVEL[file.status], req.body.comment || null]
    );

    await conn.commit();
    return res.json({ id: file.id, status: STATUS.REJECTED });
  } catch (err) {
    await conn.rollback();
    return next(err);
  } finally {
    conn.release();
  }
};

// GET /api/approvals/:fileId/history
exports.history = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.action, a.level, a.comment, a.created_at, u.name AS actor_name
       FROM approval_logs a JOIN users u ON u.id = a.actor_id
       WHERE a.file_id = ?
       ORDER BY a.created_at ASC`,
      [req.params.fileId]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};
