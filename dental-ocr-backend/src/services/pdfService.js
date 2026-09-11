const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const patientModel = require('../models/patientModel');
const recordModel = require('../models/recordModel');
const documentModel = require('../models/documentModel');
const doctorModel = require('../models/doctorModel');

const generatedDir = path.join(__dirname, '..', '..', 'generated');
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

function generatePatientPDF(patientId) {
  const patient = patientModel.findById(patientId);
  if (!patient) throw Object.assign(new Error('Patient not found'), { statusCode: 404 });

  const records = recordModel.findByPatientId(patientId);
  const documents = documentModel.findByPatientId(patientId);

  const filePath = path.join(generatedDir, `patient-${patientId}-${Date.now()}.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(22).font('Helvetica-Bold').text('DentalCare Records', { align: 'center' });
  doc.fontSize(11).font('Helvetica').text('Patient Dental Record Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Name: ${patient.name}`);
  doc.text(`Age: ${patient.age || 'N/A'}  |  Gender: ${patient.gender || 'N/A'}`);
  doc.text(`Phone: ${patient.phone || 'N/A'}  |  Email: ${patient.email || 'N/A'}`);
  doc.text(`Address: ${patient.address || 'N/A'}`);
  doc.text(`Patient ID: ${patient.id}`);
  doc.moveDown();

  for (const record of records) {
    if (doc.y > 680) doc.addPage();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    const recordDate = record.record_date || (record.created_at || '').split('T')[0];
    doc.fontSize(12).font('Helvetica-Bold').text(`Visit Record - ${recordDate}`);
    doc.moveDown(0.3);

    if (record.receipt_number) {
      doc.fontSize(10).font('Helvetica-Bold').text(`Receipt No: ${record.receipt_number}`);
    }

    if (record.doctor_id) {
      const doctor = doctorModel.findById(record.doctor_id);
      if (doctor) {
        doc.fontSize(10);
        doc.font('Helvetica-Bold').text('Doctor Details:');
        doc.font('Helvetica').text(`  Name: Dr. ${doctor.name}`);
        if (doctor.specialization) doc.text(`  Specialization: ${doctor.specialization}`);
        if (doctor.phone) doc.text(`  Phone: ${doctor.phone}`);
        if (doctor.clinic_name) doc.text(`  Clinic: ${doctor.clinic_name}`);
        if (doctor.clinic_address) doc.text(`  Clinic Address: ${doctor.clinic_address}`);
        if (doctor.clinic_registration_number) doc.text(`  Reg No: ${doctor.clinic_registration_number}`);
      }
    }

    doc.fontSize(10);
    const fields = [
      ['Chief Complaint', record.chief_complaint],
      ['Medical History', record.medical_history],
      ['Dental History', record.dental_history],
      ['Allergies', record.allergies],
      ['Habits', record.habits],
      ['Treatment Plan', record.treatment_plan],
      ['Notes', record.notes],
      ['Next Follow-up', record.next_follow_up],
    ];

    for (const [label, value] of fields) {
      if (value) {
        doc.font('Helvetica-Bold').text(`${label}:`);
        doc.font('Helvetica').text(value);
      }
    }

    if (record.procedures && record.procedures.length > 0) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text('Procedures:');
      for (const proc of record.procedures) {
        doc.font('Helvetica').text(`  Tooth ${proc.tooth}: ${proc.procedure_name}${proc.notes ? ' - ' + proc.notes : ''}`);
      }
    }

    if (record.payment) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').text('Payment Details:');
      doc.font('Helvetica').text(`  Total: Rs.${record.payment.total_amount || 0}`);
      doc.font('Helvetica').text(`  Paid: Rs.${record.payment.paid_amount || 0}`);
      doc.font('Helvetica').text(`  Balance: Rs.${record.payment.balance || 0}`);
      doc.font('Helvetica').text(`  Status: ${record.payment.status || 'N/A'}`);
    }
    doc.moveDown();
  }

  if (documents.length > 0) {
    if (doc.y > 680) doc.addPage();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Associated Documents');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    for (const d of documents) {
      doc.text(`  ${d.title} (${d.category || d.type || 'N/A'}) - ${d.date || 'N/A'}`);
    }
  }

  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica')
    .text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' })
    .text('DentalCare Records - Confidential Patient Information', { align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generatePatientPDF };
