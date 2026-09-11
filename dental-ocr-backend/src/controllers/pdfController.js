const pdfService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');
const { success, error } = require('../utils/response');

exports.generatePatientPDF = async (req, res, next) => {
  try {
    const filePath = await pdfService.generatePatientPDF(req.params.id);
    const filename = path.basename(filePath);
    success(res, { message: 'PDF generated', filePath: `/generated/${filename}`, filename });
  } catch (err) { next(err); }
};

exports.downloadPDF = (req, res, next) => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'generated', req.params.filename);
    if (!fs.existsSync(filePath)) return error(res, 'PDF not found', 404);
    res.download(filePath);
  } catch (err) { next(err); }
};
