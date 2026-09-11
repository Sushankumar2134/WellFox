const documentModel = require('../models/documentModel');
const fs = require('fs');
const path = require('path');

function getAll() {
  return documentModel.findAll();
}

function getByPatientId(patientId) {
  return documentModel.findByPatientId(patientId);
}

function getById(id) {
  return documentModel.findById(id);
}

function create(data) {
  if (!data.patientId) throw Object.assign(new Error('Patient ID is required'), { statusCode: 400 });
  if (!data.title) throw Object.assign(new Error('Document title is required'), { statusCode: 400 });
  return documentModel.create({
    patientId: data.patientId,
    recordId: data.recordId,
    title: data.title,
    type: data.type,
    category: data.category,
    filePath: data.filePath,
    ocrRawText: data.ocrRawText,
    date: data.date,
  });
}

function remove(id) {
  const doc = documentModel.findById(id);
  if (!doc) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
  if (doc.file_path) {
    const fullPath = path.resolve(doc.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  documentModel.remove(id);
}

module.exports = { getAll, getByPatientId, getById, create, remove };
