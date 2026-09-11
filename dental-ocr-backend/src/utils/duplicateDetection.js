const { queryAll } = require('../config/database');
const { normalizePhone, normalizeName } = require('./validators');

function checkDuplicate(name, phone, excludeId) {
  let conditions = [];
  let params = [];

  if (phone) {
    const norm = normalizePhone(phone);
    conditions.push("REPLACE(REPLACE(REPLACE(phone,'-',''),' ',''),'+','') = ?");
    params.push(norm);
  }
  if (name) {
    conditions.push("LOWER(TRIM(name)) = ?");
    params.push(normalizeName(name));
  }

  if (conditions.length === 0) return { duplicate: false, matches: [] };

  let sql = `SELECT id, name, age, gender, phone, email FROM patients WHERE ${conditions.join(' OR ')}`;
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }

  const matches = queryAll(sql, params);
  return { duplicate: matches.length > 0, matches };
}

module.exports = { checkDuplicate };
