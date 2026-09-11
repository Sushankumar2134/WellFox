const { queryOne } = require('../config/database');

function findByRecordId(recordId) {
  return queryOne('SELECT * FROM payments WHERE record_id=?', [recordId]);
}

module.exports = { findByRecordId };
