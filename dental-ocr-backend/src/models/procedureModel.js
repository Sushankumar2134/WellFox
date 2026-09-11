const { queryAll, queryOne, runSql } = require('../config/database');

function findByRecordId(recordId) {
  return queryAll('SELECT * FROM procedures WHERE record_id=?', [recordId]);
}

function findById(id) {
  return queryOne('SELECT * FROM procedures WHERE id=?', [id]);
}

function remove(id) {
  runSql('DELETE FROM procedures WHERE id=?', [id]);
}

module.exports = { findByRecordId, findById, remove };
