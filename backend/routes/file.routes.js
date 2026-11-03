const express = require('express');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/file.controller');

const router = express.Router();

router.post('/', authenticate, upload.single('file'), ctrl.uploadFile);
router.get('/', authenticate, ctrl.listFiles);
router.get('/:id/download', authenticate, ctrl.downloadFile);

module.exports = router;
