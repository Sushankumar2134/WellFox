const svc = require('../services/patientService');
const { success, created, notFound, error } = require('../utils/response');

exports.getAll = (req, res, next) => {
  try {
    const search = req.query.search || req.query.q;
    const patients = svc.getAll(search);
    success(res, { patients, count: patients.length });
  } catch (err) { next(err); }
};

exports.getById = (req, res, next) => {
  try {
    const patient = svc.getById(req.params.id);
    if (!patient) return notFound(res, 'Patient not found');
    success(res, patient);
  } catch (err) { next(err); }
};

exports.create = (req, res, next) => {
  try {
    const result = svc.create(req.body);
    const resp = { patient: result.patient };
    if (result.duplicateWarning) {
      resp.warning = 'Possible duplicate patient detected';
      resp.duplicates = result.duplicateWarning;
    }
    created(res, resp);
  } catch (err) { next(err); }
};

exports.update = (req, res, next) => {
  try {
    const patient = svc.update(req.params.id, req.body);
    success(res, patient);
  } catch (err) { next(err); }
};

exports.remove = (req, res, next) => {
  try {
    svc.remove(req.params.id);
    success(res, { message: 'Patient deleted' });
  } catch (err) { next(err); }
};
