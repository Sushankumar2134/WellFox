const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../config/database');

function findAll(search) {
  if (search) {
    const q = `%${search}%`;
    return queryAll(
      `SELECT p.*, (SELECT COUNT(*) FROM dental_records WHERE patient_id = p.id) as record_count
       FROM patients p WHERE p.name LIKE ? OR p.phone LIKE ? OR p.id LIKE ? ORDER BY p.updated_at DESC`,
      [q, q, q]
    );
  }
  return queryAll(
    `SELECT p.*, (SELECT COUNT(*) FROM dental_records WHERE patient_id = p.id) as record_count
     FROM patients p ORDER BY p.updated_at DESC`
  );
}

function findById(id) {
  return queryOne(
    `SELECT p.*, (SELECT COUNT(*) FROM dental_records WHERE patient_id = p.id) as record_count
     FROM patients p WHERE p.id = ?`, [id]
  );
}

function create(data) {
  const id = data.id || 'PT-' + uuidv4().split('-')[0].toUpperCase();
  const now = new Date().toISOString();
  runSql(
    `INSERT INTO patients (id, name, age, gender, phone, email, address, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, data.name, data.age || null, data.gender || null, data.phone || null, data.email || null, data.address || null, now, now]
  );
  return findById(id);
}

function update(id, data) {
  const now = new Date().toISOString();
  runSql(
    `UPDATE patients SET name=?, age=?, gender=?, phone=?, email=?, address=?, updated_at=? WHERE id=?`,
    [data.name, data.age || null, data.gender || null, data.phone || null, data.email || null, data.address || null, now, id]
  );
  return findById(id);
}

function remove(id) {
  runSql('DELETE FROM patients WHERE id=?', [id]);
}

module.exports = { findAll, findById, create, update, remove };
