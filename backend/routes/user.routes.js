const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');
const ctrl = require('../controllers/user.controller');

const router = express.Router();

router.get('/', authenticate, authorize(ROLES.ADMIN), ctrl.listUsers);
router.patch('/:id/role', authenticate, authorize(ROLES.ADMIN), ctrl.updateRole);

module.exports = router;
