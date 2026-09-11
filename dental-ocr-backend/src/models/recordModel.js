const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../config/database');

function findById(id) {
  const record = queryOne('SELECT * FROM dental_records WHERE id=?', [id]);
  if (record) {
    record.procedures = queryAll('SELECT * FROM procedures WHERE record_id=?', [id]);
    record.payment = queryOne('SELECT * FROM payments WHERE record_id=?', [id]);
  }
  return record;
}

function findByPatientId(patientId) {
  const records = queryAll('SELECT * FROM dental_records WHERE patient_id=? ORDER BY created_at DESC', [patientId]);
  for (const r of records) {
    r.procedures = queryAll('SELECT * FROM procedures WHERE record_id=?', [r.id]);
    r.payment = queryOne('SELECT * FROM payments WHERE record_id=?', [r.id]);
  }
  return records;
}

function findAll() {
  const records = queryAll('SELECT * FROM dental_records ORDER BY created_at DESC');
  for (const r of records) {
    r.procedures = queryAll('SELECT * FROM procedures WHERE record_id=?', [r.id]);
    r.payment = queryOne('SELECT * FROM payments WHERE record_id=?', [r.id]);
  }
  return records;
}

function create(data) {
  const id = data.id || 'REC-' + uuidv4().split('-')[0].toUpperCase();
  const now = new Date().toISOString();

  runSql(
    `INSERT INTO dental_records (id, patient_id, doctor_id, record_date, receipt_number, chief_complaint, medical_history, dental_history, allergies, habits, treatment_plan, notes, next_follow_up, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, data.patientId, data.doctorId || null, data.recordDate || null, data.receiptNumber || null, data.chiefComplaint || null, data.medicalHistory || null, data.dentalHistory || null, data.allergies || null, data.habits || null, data.treatmentPlan || null, data.notes || null, data.nextFollowUp || null, now, now]
  );

  if (data.procedures && Array.isArray(data.procedures)) {
    for (const proc of data.procedures) {
      const pid = proc.id || 'PRC-' + uuidv4().split('-')[0].toUpperCase();
      runSql(
        'INSERT INTO procedures (id, record_id, tooth, procedure_name, notes) VALUES (?,?,?,?,?)',
        [pid, id, proc.tooth, proc.procedureName, proc.notes || null]
      );
    }
  }

  if (data.payment || data.totalAmount !== undefined) {
    const p = data.payment || {};
    const total = data.totalAmount || p.totalAmount || 0;
    const paid = data.paidAmount || p.paidAmount || 0;
    const balance = total - paid;
    const status = balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
    const payId = 'PAY-' + uuidv4().split('-')[0].toUpperCase();
    runSql(
      'INSERT INTO payments (id, record_id, total_amount, paid_amount, balance, status) VALUES (?,?,?,?,?,?)',
      [payId, id, total, paid, balance, status]
    );
  }

  return findById(id);
}

function update(id, data) {
  const now = new Date().toISOString();

  runSql(
    `UPDATE dental_records SET doctor_id=?, record_date=?, receipt_number=?, chief_complaint=?, medical_history=?, dental_history=?, allergies=?, habits=?, treatment_plan=?, notes=?, next_follow_up=?, updated_at=? WHERE id=?`,
    [data.doctorId || null, data.recordDate || null, data.receiptNumber || null, data.chiefComplaint || null, data.medicalHistory || null, data.dentalHistory || null, data.allergies || null, data.habits || null, data.treatmentPlan || null, data.notes || null, data.nextFollowUp || null, now, id]
  );

  if (data.procedures && Array.isArray(data.procedures)) {
    runSql('DELETE FROM procedures WHERE record_id=?', [id]);
    for (const proc of data.procedures) {
      const pid = proc.id || 'PRC-' + uuidv4().split('-')[0].toUpperCase();
      runSql(
        'INSERT INTO procedures (id, record_id, tooth, procedure_name, notes) VALUES (?,?,?,?,?)',
        [pid, id, proc.tooth, proc.procedureName, proc.notes || null]
      );
    }
  }

  if (data.totalAmount !== undefined || data.paidAmount !== undefined) {
    const existing = queryOne('SELECT * FROM payments WHERE record_id=?', [id]);
    const total = data.totalAmount !== undefined ? data.totalAmount : (existing ? existing.total_amount : 0);
    const paid = data.paidAmount !== undefined ? data.paidAmount : (existing ? existing.paid_amount : 0);
    const balance = total - paid;
    const status = balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Pending';
    if (existing) {
      runSql('UPDATE payments SET total_amount=?, paid_amount=?, balance=?, status=? WHERE record_id=?', [total, paid, balance, status, id]);
    } else {
      const payId = 'PAY-' + uuidv4().split('-')[0].toUpperCase();
      runSql('INSERT INTO payments (id, record_id, total_amount, paid_amount, balance, status) VALUES (?,?,?,?,?,?)', [payId, id, total, paid, balance, status]);
    }
  }

  return findById(id);
}

function remove(id) {
  runSql('DELETE FROM dental_records WHERE id=?', [id]);
}

module.exports = { findById, findByPatientId, findAll, create, update, remove };
