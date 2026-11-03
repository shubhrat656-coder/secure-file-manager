const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { STATUS, ROLES } = require('../utils/roles');
const { UPLOAD_DIR } = require('../middleware/upload');

// POST /api/files  (multipart/form-data, field name "file")
// A freshly uploaded file always enters the chain at Level 1.
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { originalname, filename, mimetype, size } = req.file;

    const [result] = await pool.query(
      `INSERT INTO files (original_name, stored_name, mime_type, size, uploaded_by, status, current_level)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [originalname, filename, mimetype, size, req.user.id, STATUS.PENDING_L1, 1]
    );

    await pool.query(
      'INSERT INTO approval_logs (file_id, actor_id, action, level, comment) VALUES (?, ?, ?, ?, ?)',
      [result.insertId, req.user.id, 'uploaded', 0, 'File uploaded']
    );

    return res.status(201).json({ id: result.insertId, status: STATUS.PENDING_L1 });
  } catch (err) {
    return next(err);
  }
};

// GET /api/files
// Regular users see only their own files; approvers, managers and admins see all.
exports.listFiles = async (req, res, next) => {
  try {
    const { role, id } = req.user;
    const base =
      'SELECT f.*, u.name AS uploaded_by_name FROM files f JOIN users u ON u.id = f.uploaded_by';

    let rows;
    if (role === ROLES.USER) {
      [rows] = await pool.query(`${base} WHERE f.uploaded_by = ? ORDER BY f.created_at DESC`, [id]);
    } else {
      [rows] = await pool.query(`${base} ORDER BY f.created_at DESC`);
    }

    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

// GET /api/files/:id/download
// Regular users may only download their own files, and only once approved.
exports.downloadFile = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM files WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'File not found' });

    const file = rows[0];
    const { role, id } = req.user;

    if (role === ROLES.USER) {
      if (file.uploaded_by !== id) {
        return res.status(403).json({ message: 'You can only access your own files' });
      }
      if (file.status !== STATUS.APPROVED) {
        return res.status(403).json({ message: 'This file has not been approved for download yet' });
      }
    }

    const filePath = path.join(UPLOAD_DIR, file.stored_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Stored file is missing on the server' });
    }

    return res.download(filePath, file.original_name);
  } catch (err) {
    return next(err);
  }
};
