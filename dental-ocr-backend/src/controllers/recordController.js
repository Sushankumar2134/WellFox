const recordModel = require('../models/recordModel');
const { success, created, notFound } = require('../utils/response');

exports.getAll = (req, res, next) => {
  try {
    const records = recordModel.findAll();
    success(res, { records, count: records.length });
  } catch (err) { next(err); }
};

exports.getById = (req, res, next) => {
  try {
    const record = recordModel.findById(req.params.id);
    if (!record) return notFound(res, 'Record not found');
    success(res, record);
  } catch (err) { next(err); }
};

exports.getByPatientId = (req, res, next) => {
  try {
    const records = recordModel.findByPatientId(req.params.patientId);
    success(res, { records, count: records.length });
  } catch (err) { next(err); }
};

exports.create = (req, res, next) => {
  try {
    if (!req.body.patientId) return res.status(400).json({ success: false, message: 'Patient ID is required' });
    const record = recordModel.create(req.body);
    created(res, record);
  } catch (err) { next(err); }
};

exports.update = (req, res, next) => {
  try {
    const existing = recordModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Record not found');
    const record = recordModel.update(req.params.id, req.body);
    success(res, record);
  } catch (err) { next(err); }
};

exports.remove = (req, res, next) => {
  try {
    const existing = recordModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Record not found');
    recordModel.remove(req.params.id);
    success(res, { message: 'Record deleted' });
  } catch (err) { next(err); }
};
