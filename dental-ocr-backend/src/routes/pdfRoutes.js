const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pdfController');

router.post('/patient/:id', ctrl.generatePatientPDF);
router.get('/download/:filename', ctrl.downloadPDF);

module.exports = router;
