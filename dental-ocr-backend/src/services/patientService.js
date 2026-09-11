const patientModel = require('../models/patientModel');
const { checkDuplicate } = require('../utils/duplicateDetection');
const { validateAge, validatePhone, validateEmail } = require('../utils/validators');

function getAll(search) {
  return patientModel.findAll(search);
}

function getById(id) {
  return patientModel.findById(id);
}

function create(data) {
  if (!data.name) throw Object.assign(new Error('Patient name is required'), { statusCode: 400 });
  if (data.age !== undefined && data.age !== null && data.age !== '' && !validateAge(data.age)) throw Object.assign(new Error('Invalid age'), { statusCode: 400 });
  if (data.phone && !validatePhone(data.phone)) throw Object.assign(new Error('Invalid phone format'), { statusCode: 400 });
  if (data.email && !validateEmail(data.email)) throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });

  const dup = checkDuplicate(data.name, data.phone, null);
  const patient = patientModel.create(data);
  if (dup.duplicate) return { patient, duplicateWarning: dup.matches };
  return { patient, duplicateWarning: null };
}

function update(id, data) {
  const existing = patientModel.findById(id);
  if (!existing) throw Object.assign(new Error('Patient not found'), { statusCode: 404 });
  if (data.age !== undefined && data.age !== null && data.age !== '' && !validateAge(data.age)) throw Object.assign(new Error('Invalid age'), { statusCode: 400 });
  if (data.phone && !validatePhone(data.phone)) throw Object.assign(new Error('Invalid phone format'), { statusCode: 400 });
  if (data.email && !validateEmail(data.email)) throw Object.assign(new Error('Invalid email format'), { statusCode: 400 });
  return patientModel.update(id, data);
}

function remove(id) {
  const existing = patientModel.findById(id);
  if (!existing) throw Object.assign(new Error('Patient not found'), { statusCode: 404 });
  patientModel.remove(id);
}

module.exports = { getAll, getById, create, update, remove };
