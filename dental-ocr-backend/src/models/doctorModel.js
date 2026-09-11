const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../config/database');

function findAll() {
  return queryAll('SELECT * FROM doctors ORDER BY name');
}

function findById(id) {
  return queryOne('SELECT * FROM doctors WHERE id=?', [id]);
}

function create(data) {
  const id = data.id || 'DR-' + uuidv4().split('-')[0].toUpperCase();
  const now = new Date().toISOString();
  runSql(
    `INSERT INTO doctors (id, name, specialization, phone, clinic_name, clinic_address, clinic_registration_number, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, data.name, data.specialization || null, data.phone || null, data.clinicName || null, data.clinicAddress || null, data.clinicRegistrationNumber || null, now, now]
  );
  return findById(id);
}

function update(id, data) {
  const now = new Date().toISOString();
  runSql(
    `UPDATE doctors SET name=?, specialization=?, phone=?, clinic_name=?, clinic_address=?, clinic_registration_number=?, updated_at=? WHERE id=?`,
    [data.name, data.specialization || null, data.phone || null, data.clinicName || null, data.clinicAddress || null, data.clinicRegistrationNumber || null, now, id]
  );
  return findById(id);
}

function findOrCreate(data) {
  if (data.name) {
    const existing = queryOne('SELECT * FROM doctors WHERE name=?', [data.name]);
    if (existing) {
      const now = new Date().toISOString();
      const updates = [];
      const params = [];
      if (data.specialization && !existing.specialization) { updates.push('specialization=?'); params.push(data.specialization); }
      if (data.phone && !existing.phone) { updates.push('phone=?'); params.push(data.phone); }
      if (data.clinicName && !existing.clinic_name) { updates.push('clinic_name=?'); params.push(data.clinicName); }
      if (data.clinicAddress && !existing.clinic_address) { updates.push('clinic_address=?'); params.push(data.clinicAddress); }
      if (data.clinicRegistrationNumber && !existing.clinic_registration_number) { updates.push('clinic_registration_number=?'); params.push(data.clinicRegistrationNumber); }
      if (updates.length > 0) {
        updates.push('updated_at=?'); params.push(now);
        params.push(existing.id);
        runSql(`UPDATE doctors SET ${updates.join(', ')} WHERE id=?`, params);
      }
      return findById(existing.id);
    }
  }
  return create(data);
}

function remove(id) {
  runSql('DELETE FROM doctors WHERE id=?', [id]);
}

module.exports = { findAll, findById, create, update, remove, findOrCreate };
