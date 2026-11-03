const pool = require('../config/db');
const { ROLES } = require('../utils/roles');

// GET /api/users  (admin only)
exports.listUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/users/:id/role  (admin only)
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });

    return res.json({ id: Number(req.params.id), role });
  } catch (err) {
    return next(err);
  }
};
