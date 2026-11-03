/**
 * Single source of truth for the roles and the approval workflow.
 *
 * The approval chain is sequential and gated:
 *   Level 1  ->  Level 2  ->  Manager  ->  Approved
 *
 * A file only moves to the next stage once the current stage approves it.
 * That means a Level 2 approver cannot act until Level 1 has approved,
 * and a Manager cannot act until Level 2 has approved.
 */
const ROLES = {
  USER: 'user',
  LEVEL1: 'level1',
  LEVEL2: 'level2',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

const STATUS = {
  PENDING_L1: 'pending_l1',
  PENDING_L2: 'pending_l2',
  PENDING_MANAGER: 'pending_manager',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Which role is allowed to act at each pending status
const STATUS_TO_ROLE = {
  [STATUS.PENDING_L1]: ROLES.LEVEL1,
  [STATUS.PENDING_L2]: ROLES.LEVEL2,
  [STATUS.PENDING_MANAGER]: ROLES.MANAGER,
};

// The status a file moves to after an approval at the current stage
const STATUS_TO_NEXT = {
  [STATUS.PENDING_L1]: STATUS.PENDING_L2,
  [STATUS.PENDING_L2]: STATUS.PENDING_MANAGER,
  [STATUS.PENDING_MANAGER]: STATUS.APPROVED,
};

// Human-friendly level number for each pending status
const STATUS_LEVEL = {
  [STATUS.PENDING_L1]: 1,
  [STATUS.PENDING_L2]: 2,
  [STATUS.PENDING_MANAGER]: 3,
};

module.exports = { ROLES, STATUS, STATUS_TO_ROLE, STATUS_TO_NEXT, STATUS_LEVEL };
