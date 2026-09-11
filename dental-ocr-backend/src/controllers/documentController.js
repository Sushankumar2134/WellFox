const documentService = require('../services/documentService');
const { success, created, notFound, error } = require('../utils/response');
const path = require('path');
const fs = require('fs');

exports.getAll = (req, res, next) => {
  try {
    const documents = documentService.getAll();
    success(res, { documents, count: documents.length });
  } catch (err) { next(err); }
};

exports.getByPatientId = (req, res, next) => {
  try {
    const documents = documentService.getByPatientId(req.params.patientId);
    success(res, { documents, count: documents.length });
  } catch (err) { next(err); }
};

exports.getById = (req, res, next) => {
  try {
    const doc = documentService.getById(req.params.id);
    if (!doc) return notFound(res, 'Document not found');
    success(res, doc);
  } catch (err) { next(err); }
};

exports.downloadFile = (req, res, next) => {
  try {
    const doc = documentService.getById(req.params.id);
    if (!doc) return notFound(res, 'Document not found');
    if (!doc.file_path) return error(res, 'No file attached to this document', 404);

    const filePath = doc.file_path;
    if (!fs.existsSync(filePath)) return error(res, 'File not found on disk', 404);

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.pdf': 'application/pdf', '.gif': 'image/gif',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.title}${ext}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) { next(err); }
};

exports.create = (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.filePath = req.file.path;
      data.type = req.file.mimetype.includes('pdf') ? 'PDF' : 'Image';
    }
    const doc = documentService.create(data);
    created(res, doc);
  } catch (err) { next(err); }
};

exports.remove = (req, res, next) => {
  try {
    documentService.remove(req.params.id);
    success(res, { message: 'Document deleted' });
  } catch (err) { next(err); }
};
