const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ocrController');
const upload = require('../middleware/uploadMiddleware');

router.post('/process', upload.single('document'), ctrl.processDocument);

module.exports = router;
