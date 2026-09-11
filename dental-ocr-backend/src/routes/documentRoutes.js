const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', ctrl.getAll);
router.get('/patient/:patientId', ctrl.getByPatientId);
router.get('/:id/download', ctrl.downloadFile);
router.get('/:id', ctrl.getById);
router.post('/', upload.single('file'), ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
