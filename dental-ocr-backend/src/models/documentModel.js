const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../config/database');

function findAll() {
  return queryAll(
    `SELECT d.*, p.name as patient_name
     FROM documents d
     LEFT JOIN patients p ON d.patient_id = p.id
     ORDER BY d.created_at DESC`
  );
}

function findByPatientId(patientId) {
  return queryAll(
    `SELECT d.*, p.name as patient_name
     FROM documents d
     LEFT JOIN patients p ON d.patient_id = p.id
     WHERE d.patient_id=?
     ORDER BY d.created_at DESC`,
    [patientId]
  );
}

function findById(id) {
  return queryOne('SELECT * FROM documents WHERE id=?', [id]);
}

function create(data) {
  const id = data.id || 'DOC-' + uuidv4().split('-')[0].toUpperCase();
  const now = new Date().toISOString();
  runSql(
    `INSERT INTO documents (id, patient_id, record_id, title, type, category, file_path, ocr_raw_text, date, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, data.patientId, data.recordId || null, data.title, data.type || null, data.category || null, data.filePath || null, data.ocrRawText || null, data.date || now.split('T')[0], now]
  );
  return findById(id);
}

function remove(id) {
  runSql('DELETE FROM documents WHERE id=?', [id]);
}

module.exports = { findAll, findByPatientId, findById, create, remove };
