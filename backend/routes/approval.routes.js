const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/roles');
const ctrl = require('../controllers/approval.controller');

const router = express.Router();
const APPROVERS = [ROLES.LEVEL1, ROLES.LEVEL2, ROLES.MANAGER, ROLES.ADMIN];

router.get('/pending', authenticate, authorize(...APPROVERS), ctrl.pendingForMe);
router.post('/:fileId/approve', authenticate, authorize(...APPROVERS), ctrl.approve);
router.post('/:fileId/reject', authenticate, authorize(...APPROVERS), ctrl.reject);
router.get('/:fileId/history', authenticate, ctrl.history);

module.exports = router;
