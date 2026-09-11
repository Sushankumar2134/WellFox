const doctorModel = require('../models/doctorModel');
const { success, created, notFound } = require('../utils/response');

exports.getAll = (req, res, next) => {
  try {
    const doctors = doctorModel.findAll();
    success(res, { doctors, count: doctors.length });
  } catch (err) { next(err); }
};

exports.getById = (req, res, next) => {
  try {
    const doctor = doctorModel.findById(req.params.id);
    if (!doctor) return notFound(res, 'Doctor not found');
    success(res, doctor);
  } catch (err) { next(err); }
};

exports.create = (req, res, next) => {
  try {
    if (!req.body.name) return res.status(400).json({ success: false, message: 'Doctor name is required' });
    const doctor = doctorModel.findOrCreate(req.body);
    created(res, doctor);
  } catch (err) { next(err); }
};

exports.update = (req, res, next) => {
  try {
    const existing = doctorModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Doctor not found');
    const doctor = doctorModel.update(req.params.id, req.body);
    success(res, doctor);
  } catch (err) { next(err); }
};

exports.remove = (req, res, next) => {
  try {
    const existing = doctorModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Doctor not found');
    doctorModel.remove(req.params.id);
    success(res, { message: 'Doctor deleted' });
  } catch (err) { next(err); }
};
