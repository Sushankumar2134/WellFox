/**
 * Extraction Service - Context-Aware Medical/Dental Record Parser
 *
 * Core principle: NEVER fill a field with garbage. If we can't confidently
 * identify a field value, leave it empty/null.
 */

const LABEL_MAP = {
  'name': { field: 'patientName', section: 'patient' },
  'patient name': { field: 'patientName', section: 'patient' },
  'patient id': { field: 'patientId', section: 'patient' },
  'id': { field: 'patientId', section: 'patient' },
  'patient reference': { field: 'receiptNumber', section: 'record' },
  'reference no': { field: 'receiptNumber', section: 'record' },
  'reference no.': { field: 'receiptNumber', section: 'record' },
  'ref no': { field: 'receiptNumber', section: 'record' },
  'ref. no': { field: 'receiptNumber', section: 'record' },
  'ref. no.': { field: 'receiptNumber', section: 'record' },
  'reference': { field: 'receiptNumber', section: 'record' },
  'serial no': { field: 'receiptNumber', section: 'record' },
  'sl no': { field: 'receiptNumber', section: 'record' },
  'bill no': { field: 'receiptNumber', section: 'record' },
  'bill number': { field: 'receiptNumber', section: 'record' },
  'invoice no': { field: 'receiptNumber', section: 'record' },
  'age': { field: 'age', section: 'patient' },
  'gender': { field: 'gender', section: 'patient' },
  'sex': { field: 'gender', section: 'patient' },
  'phone': { field: 'phone', section: 'patient' },
  'mobile': { field: 'phone', section: 'patient' },
  'phone no': { field: 'phone', section: 'patient' },
  'phone no.': { field: 'phone', section: 'patient' },
  'mobile no': { field: 'phone', section: 'patient' },
  'contact': { field: 'phone', section: 'patient' },
  'email': { field: 'email', section: 'patient' },
  'e-mail': { field: 'email', section: 'patient' },
  'address': { field: 'address', section: 'patient' },
  'addr': { field: 'address', section: 'patient' },

  'doctor name': { field: 'doctorName', section: 'doctor' },
  'doctor': { field: 'doctorName', section: 'doctor' },
  'physician': { field: 'doctorName', section: 'doctor' },
  'consultant': { field: 'doctorName', section: 'doctor' },
  'specialization': { field: 'specialization', section: 'doctor' },
  'speciality': { field: 'specialization', section: 'doctor' },
  'qualification': { field: 'specialization', section: 'doctor' },
  'reg. no': { field: 'clinicRegistrationNumber', section: 'doctor' },
  'reg no': { field: 'clinicRegistrationNumber', section: 'doctor' },
  'registration no': { field: 'clinicRegistrationNumber', section: 'doctor' },
  'reg. no.': { field: 'clinicRegistrationNumber', section: 'doctor' },
  'reg no.': { field: 'clinicRegistrationNumber', section: 'doctor' },
  'clinic reg. no': { field: 'clinicRegistrationNumber', section: 'doctor' },
  'clinic reg no': { field: 'clinicRegistrationNumber', section: 'doctor' },
  'clinic name': { field: 'clinicName', section: 'doctor' },
  'clinic': { field: 'clinicName', section: 'doctor' },
  'hospital': { field: 'clinicName', section: 'doctor' },
  'clinic address': { field: 'clinicAddress', section: 'doctor' },

  'date': { field: 'date', section: 'record' },
  'receipt no': { field: 'receiptNumber', section: 'record' },
  'receipt no.': { field: 'receiptNumber', section: 'record' },
  'receipt number': { field: 'receiptNumber', section: 'record' },
  'chief complaint': { field: 'chiefComplaint', section: 'record' },
  'complaint': { field: 'chiefComplaint', section: 'record' },
  'presenting complaint': { field: 'chiefComplaint', section: 'record' },
  'medical history': { field: 'medicalHistory', section: 'record' },
  'dental history': { field: 'dentalHistory', section: 'record' },
  'allergies': { field: 'allergies', section: 'record' },
  'allergy': { field: 'allergies', section: 'record' },
  'habits': { field: 'habits', section: 'record' },
  'habit': { field: 'habits', section: 'record' },
  'treatment plan': { field: 'treatmentPlan', section: 'record' },
  'treatment': { field: 'treatmentPlan', section: 'record' },
  'total amount': { field: 'totalAmount', section: 'record' },
  'total': { field: 'totalAmount', section: 'record' },
  'paid amount': { field: 'paidAmount', section: 'record' },
  'paid': { field: 'paidAmount', section: 'record' },
  'balance amount': { field: 'balanceAmount', section: 'record' },
  'balance': { field: 'balanceAmount', section: 'record' },
  'payment status': { field: 'paymentStatus', section: 'record' },
  'status': { field: 'paymentStatus', section: 'record' },
  'next follow-up': { field: 'nextFollowUp', section: 'record' },
  'next follow up': { field: 'nextFollowUp', section: 'record' },
  'follow-up': { field: 'nextFollowUp', section: 'record' },
  'follow up': { field: 'nextFollowUp', section: 'record' },
  'prescription': { field: 'prescription', section: 'record' },
  'rx': { field: 'prescription', section: 'record' },
  'notes': { field: 'notes', section: 'record' },
  'remark': { field: 'notes', section: 'record' },
  'remarks': { field: 'notes', section: 'record' },
  'duration': { field: 'notes', section: 'record' },
};

const SECTION_HEADERS = new Set([
  'patient details', 'patient information', 'patient info',
  'doctor details', 'doctor information', 'doctor info',
  'chief complaint', 'medical history', 'dental history',
  'allergies / habits', 'allergies/habits',
  'treatment plan', 'procedures', 'procedures / tooth details',
  'payment / financial details', 'financial details',
  'dental treatment record & receipt',
]);

const DOCTOR_OVERRIDES = {
  'phone': 'doctorPhone', 'phone no': 'doctorPhone', 'phone no.': 'doctorPhone',
  'mobile': 'doctorPhone', 'contact': 'doctorPhone',
  'address': 'clinicAddress', 'clinic address': 'clinicAddress',
};

function extractFields(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const warnings = [];

  const patient = { patientName: null, patientId: null, age: null, gender: null, phone: null, email: null, address: null };
  const doctor = { doctorName: null, specialization: null, doctorPhone: null, clinicRegistrationNumber: null, clinicName: null, clinicAddress: null };
  const record = {
    date: null, chiefComplaint: null, medicalHistory: null, dentalHistory: null,
    allergies: null, habits: null, treatmentPlan: null, procedures: [],
    prescription: null, notes: null, nextFollowUp: null,
    receiptNumber: null, totalAmount: null, paidAmount: null,
    balanceAmount: null, paymentStatus: null,
  };

  const filledPatient = new Set();
  const filledDoctor = new Set();
  const filledRecord = new Set();
  let currentSection = null;
  let lastNonEmptySection = null;
  let phoneLabelSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase().trim();

    if (isSectionHeader(lineLower)) {
      currentSection = detectSection(lineLower);
      if (currentSection) lastNonEmptySection = currentSection;
      continue;
    }
    if (line.match(/^(S\.No|S\/No|#|No\.)/i)) continue;
    if (line.match(/^\d+\s+\d+/)) continue;

    if (!currentSection && !parseLabelValue(line) && lastNonEmptySection) {
      const labelOnly = lineLower.replace(/[:=]+$/, '').trim();
      if (['phone', 'mobile', 'contact', 'phone no', 'mobile no'].includes(labelOnly)) {
        currentSection = lastNonEmptySection;
        phoneLabelSeen = true;
      }
    }

    const parsed = parseLabelValue(line);

    if (parsed) {
      const { label, value } = parsed;
      const labelLower = label.toLowerCase().trim();

      let resolved = null;

      if (currentSection === 'doctor' && DOCTOR_OVERRIDES[labelLower]) {
        resolved = { field: DOCTOR_OVERRIDES[labelLower], section: 'doctor' };
      }

      if (!resolved) {
        resolved = LABEL_MAP[labelLower];
      }

      if (resolved) {
        const { field, section } = resolved;
        const targetSection = section || currentSection;

        if (targetSection === 'patient') {
          const v = validatePatientField(field, value);
          if (v !== null && !filledPatient.has(field)) {
            patient[field] = v;
            filledPatient.add(field);
          }
        } else if (targetSection === 'doctor') {
          const v = validateDoctorField(field, value);
          if (v !== null && !filledDoctor.has(field)) {
            doctor[field] = v;
            filledDoctor.add(field);
          }
        } else if (targetSection === 'record') {
          const v = validateRecordField(field, value);
          if (v !== null && !filledRecord.has(field)) {
            record[field] = v;
            filledRecord.add(field);
          }
        }
        continue;
      }
    }

    if (currentSection === 'record' && !parsed) {
      const sectionFieldMap = {
        'chief complaint': 'chiefComplaint',
        'medical history': 'medicalHistory',
        'dental history': 'dentalHistory',
        'allergies / habits': 'allergies',
        'allergies/habits': 'allergies',
        'allergies': 'allergies',
        'treatment plan': 'treatmentPlan',
        'prescription': 'prescription',
        'follow-up': 'nextFollowUp',
        'follow up': 'nextFollowUp',
      };
      if (i > 0) {
        const prevLine = lines[i - 1].toLowerCase().trim();
        for (const [header, field] of Object.entries(sectionFieldMap)) {
          if (prevLine.includes(header) && !filledRecord.has(field)) {
            const v = validateRecordField(field, line);
            if (v !== null) {
              record[field] = v;
              filledRecord.add(field);
              break;
            }
          }
        }
      }
    }

    if (currentSection === 'doctor' && !filledDoctor.has('doctorPhone')) {
      const m = line.match(/\b([6-9]\d{9})\b/);
      if (m) { doctor.doctorPhone = m[1]; filledDoctor.add('doctorPhone'); continue; }
    }

    if (!filledPatient.has('phone')) {
      const m = line.match(/\b([6-9]\d{9})\b/);
      if (m) {
        if (phoneLabelSeen && lastNonEmptySection === 'doctor' && !filledDoctor.has('doctorPhone')) {
          doctor.doctorPhone = m[1];
          filledDoctor.add('doctorPhone');
        } else {
          patient.phone = m[1];
          filledPatient.add('phone');
        }
        phoneLabelSeen = false;
        continue;
      }
    }

    if (!filledPatient.has('age') || !filledPatient.has('gender')) {
      const m = line.match(/\b(\d{1,3})\s*\/\s*(M|F|Male|Female|Man|Woman)\b/i);
      if (m) {
        const age = parseInt(m[1]);
        if (age > 0 && age < 130 && !filledPatient.has('age')) { patient.age = age; filledPatient.add('age'); }
        if (!filledPatient.has('gender')) { patient.gender = normalizeGender(m[2]); filledPatient.add('gender'); }
        continue;
      }
    }

    if (!filledPatient.has('age') || !filledPatient.has('gender')) {
      const m = line.match(/\b(\d{1,3})\s+(Male|Female|Man|Woman|M|F)\b/i);
      if (m) {
        const age = parseInt(m[1]);
        if (age > 0 && age < 130 && !filledPatient.has('age')) { patient.age = age; filledPatient.add('age'); }
        if (!filledPatient.has('gender')) { patient.gender = normalizeGender(m[2]); filledPatient.add('gender'); }
        continue;
      }
    }

    if (!filledDoctor.has('doctorName')) {
      const m = line.match(/\b(Dr\.?\s+[A-Z][A-Za-z\s.]+?)$/);
      if (m) {
        const n = m[1].trim();
        if (n.length > 4 && n.length < 60) { doctor.doctorName = n; filledDoctor.add('doctorName'); lastNonEmptySection = 'doctor'; continue; }
      }
    }

    if (!filledPatient.has('patientName')) {
      const m = line.match(/\b(Mr\.|Mrs\.|Ms\.|Mx\.)\s+(.+)/i);
      if (m) {
        const n = (m[1] + ' ' + m[2]).trim();
        if (n.length > 3 && n.length < 50 && !n.match(/Dr\./i)) { patient.patientName = n; filledPatient.add('patientName'); continue; }
      }
    }

    if (!filledPatient.has('patientName')) {
      const m = line.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})$/);
      if (m) {
        const n = m[1].trim();
        if (n.length > 3 && n.length < 40 &&
            !n.match(/\b(Dr|Doctor|Patient|Phone|Email|Date|Receipt|Reference|Total|Paid|Balance|Payment|Chief|Medical|Dental|Treatment|Procedures|Prescription|Notes|Follow|Consulting|Physician|Homoeopathic|Homeopathic|Hospital|Clinic|Complex|Centre|Center|Academy|Institute|College|General|Specialist|Specialization|Swastya|Homoeopathy|Homeopathy|Pediatric|Orthopedic|Cardiology|Neurology|Oncology|Radiology|Pathology|Dermatology|Ophthalmology|Gynecology|Urology|Nephrology|Pulmonology|Gastroenterology|Endocrinology|Hematology|Rheumatology|Psychiatry|Pediatrics|Chamber|Lounge|Tower|Plaza|Mall|Park|Gardens|Heights|Nagar|Colony|Extension|Block|Building|Floor|Room|Ward)\b/i)) {
          patient.patientName = n;
          filledPatient.add('patientName');
          continue;
        }
      }
    }

    if (!filledPatient.has('receiptNumber')) {
      const m = line.match(/\b([A-Z]{2,5}\d{3,6})\b/);
      if (m && !m[1].match(/^(DCI|REC|DOC)-/) && !filledPatient.has('patientId')) {
        record.receiptNumber = m[1];
        filledRecord.add('receiptNumber');
        continue;
      }
    }

    if (!filledPatient.has('patientId')) {
      const m = line.match(/\b(PT-\d{3,6}|[A-Z]{2,4}-\d{3,6})\b/);
      if (m && !m[1].match(/^(DCI|REC|DOC)-/)) { patient.patientId = m[1]; filledPatient.add('patientId'); continue; }
    }

    if (!filledRecord.has('chiefComplaint')) {
      const m = line.match(/\bc\/o\s+(.+)/i);
      if (m) { record.chiefComplaint = m[1].trim(); filledRecord.add('chiefComplaint'); continue; }
    }

    if (!filledRecord.has('notes')) {
      const m = line.match(/\bsince\s+(\d+\s+\w+)/i);
      if (m) { record.notes = 'Duration: ' + m[1]; filledRecord.add('notes'); continue; }
    }

    if (!filledRecord.has('date')) {
      const m = line.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
      if (m) {
        let dateStr = m[1];
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length === 3 && parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year < 100) ? '20' + parts[2] : parts[2];
          dateStr = parts.join('/');
        }
        record.date = dateStr;
        filledRecord.add('date');
        continue;
      }
    }

    if (!filledPatient.has('email')) {
      const m = line.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      if (m) { patient.email = m[0]; filledPatient.add('email'); continue; }
    }

    if (!filledDoctor.has('clinicRegistrationNumber')) {
      const m = line.match(/\bReg\.?\s*No\.?\s*:?\s*([A-Z0-9\-]{3,20})/i);
      if (m) { doctor.clinicRegistrationNumber = m[1]; filledDoctor.add('clinicRegistrationNumber'); lastNonEmptySection = 'doctor'; continue; }
    }

    if (!filledDoctor.has('specialization')) {
      const m = line.match(/\b(BHMS|BDS|MDS|MBBS|MD|MS|BAMS|BUMS|DDS)\b/);
      if (m) {
        if (i + 1 < lines.length) {
          const next = lines[i + 1].trim();
          doctor.specialization = (next.length > 3 && next.length < 60 && !next.match(/^\d/) && !isSectionHeader(next.toLowerCase())) ? next : m[1];
        } else {
          doctor.specialization = m[1];
        }
        filledDoctor.add('specialization');
        lastNonEmptySection = 'doctor';
        continue;
      }
    }

    if (!filledDoctor.has('clinicName')) {
      if (line.match(/\b(clinic|hospital|center|centre|institute)\b/i) && !line.match(/^(Dr|Doctor|Patient|Name|Phone|Email)/i) && line.length > 3 && line.length < 80) {
        doctor.clinicName = line.trim();
        filledDoctor.add('clinicName');
        lastNonEmptySection = 'doctor';
        continue;
      }
    }

    const procMatch = line.match(/tooth\s*(\d+)\s*[:=]?\s*(.+)/i);
    if (procMatch) {
      record.procedures.push({
        tooth: procMatch[1],
        procedureName: procMatch[2].trim().split(/[-\u2013\u2014]/)[0].trim(),
        notes: procMatch[2].includes('-') ? procMatch[2].split(/[-\u2013\u2014]/).slice(1).join('-').trim() : '',
      });
      continue;
    }

    if (!filledRecord.has('totalAmount')) {
      const m = line.match(/(?:total|amount|bill)\s*(?:amount)?\s*[:=]?\s*(?:rs\.?|inr|\u20B9)?\s*(\d[\d,]*)/i);
      if (m) { record.totalAmount = parseInt(m[1].replace(/,/g, '')); filledRecord.add('totalAmount'); continue; }
    }

    if (!filledRecord.has('paidAmount')) {
      const m = line.match(/(?:paid|advance)\s*(?:amount)?\s*[:=]?\s*(?:rs\.?|inr|\u20B9)?\s*(\d[\d,]*)/i);
      if (m) { record.paidAmount = parseInt(m[1].replace(/,/g, '')); filledRecord.add('paidAmount'); continue; }
    }

    if (!filledRecord.has('balanceAmount')) {
      const m = line.match(/(?:balance|due|outstanding)\s*(?:amount)?\s*[:=]?\s*(?:rs\.?|inr|\u20B9)?\s*(\d[\d,]*)/i);
      if (m) { record.balanceAmount = parseInt(m[1].replace(/,/g, '')); filledRecord.add('balanceAmount'); continue; }
    }
  }

  const fullText = lines.join(' ').toLowerCase();
  record.documentType = classifyDocument(fullText);

  cleanupFields(patient, doctor, record);

  const fields = {
    patientName: patient.patientName,
    patientId: patient.patientId,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    doctorName: doctor.doctorName,
    specialization: doctor.specialization,
    doctorPhone: doctor.doctorPhone,
    clinicRegistrationNumber: doctor.clinicRegistrationNumber,
    clinicName: doctor.clinicName,
    clinicAddress: doctor.clinicAddress,
    date: record.date,
    chiefComplaint: record.chiefComplaint,
    medicalHistory: record.medicalHistory,
    dentalHistory: record.dentalHistory,
    allergies: record.allergies,
    habits: record.habits,
    treatmentPlan: record.treatmentPlan,
    procedures: record.procedures,
    prescription: record.prescription,
    notes: record.notes,
    nextFollowUp: record.nextFollowUp,
    receiptNumber: record.receiptNumber,
    totalAmount: record.totalAmount,
    paidAmount: record.paidAmount,
    balanceAmount: record.balanceAmount,
    paymentStatus: record.paymentStatus,
    documentType: record.documentType,
  };

  const structuredData = { patient, doctor, record };

  const confidence = {};
  for (const [key, val] of Object.entries(fields)) {
    if (key === 'procedures') continue;
    if (val !== null && val !== '' && val !== undefined) {
      confidence[key] = { value: val, confidence: 0.8, status: 'detected' };
    } else {
      confidence[key] = { value: null, confidence: 0, status: 'not_detected' };
      warnings.push(`${key}: not detected`);
    }
  }

  console.log('[Extraction] Fields extracted:', JSON.stringify({
    patientName: patient.patientName,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    patientId: patient.patientId,
    receiptNumber: record.receiptNumber,
    doctorName: doctor.doctorName,
    date: record.date,
    chiefComplaint: record.chiefComplaint,
    clinicName: doctor.clinicName,
  }));

  return { fields, structuredData, confidence, warnings };
}

function parseLabelValue(line) {
  const match = line.match(/^([A-Za-z][A-Za-z .&'()-]+?)\s*[:=]\s*(.+)$/);
  if (!match) return null;
  let label = match[1].replace(/[.,;:]+$/, '').trim();
  const value = match[2].trim();
  if (label.length < 2 || label.length > 40 || label.match(/^\d+$/) || !value) return null;
  return { label, value };
}

function isSectionHeader(lineLower) {
  if (SECTION_HEADERS.has(lineLower)) return true;
  if (lineLower.length < 40 && lineLower === lineLower.toUpperCase() && lineLower.length > 5 && /[a-zA-Z]/.test(lineLower)) return true;
  return false;
}

function detectSection(lineLower) {
  if (lineLower.includes('patient')) return 'patient';
  if (lineLower.includes('doctor')) return 'doctor';
  if (lineLower.includes('chief') || lineLower.includes('complaint')) return 'record';
  if (lineLower.includes('medical') || lineLower.includes('dental')) return 'record';
  if (lineLower.includes('allerg') || lineLower.includes('habit')) return 'record';
  if (lineLower.includes('treatment')) return 'record';
  if (lineLower.includes('procedure')) return 'record';
  if (lineLower.includes('payment') || lineLower.includes('financial')) return 'record';
  if (lineLower.includes('follow')) return 'record';
  if (lineLower.includes('prescription') || lineLower.includes('rx')) return 'record';
  return null;
}

function validatePatientField(field, value) {
  switch (field) {
    case 'patientName': {
      const c = value.replace(/[^\w\s.\-]/g, '').trim();
      if (c.length < 2 || c.length > 50 || c.match(/^\d+$/) || c.match(/^(Dr|Doctor|Clinic|Hospital|Phone|Email|Address|Age|Gender)/i)) return null;
      return c;
    }
    case 'patientId': { const c = value.replace(/[^\w\-]/g, '').trim(); return (c.length >= 2 && c.length <= 20) ? c : null; }
    case 'age': { const n = parseInt(value.replace(/\D/g, '')); return (!isNaN(n) && n > 0 && n < 130) ? n : null; }
    case 'gender': return normalizeGender(value);
    case 'phone': { const c = value.replace(/\D/g, ''); return (c.length >= 7 && c.length <= 15) ? c : null; }
    case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
    case 'address': return (value.length >= 3 && value.length <= 200) ? value : null;
    default: return value;
  }
}

function validateDoctorField(field, value) {
  switch (field) {
    case 'doctorName': return (value.length > 3 && value.length < 60) ? value : null;
    case 'specialization': return (value.length > 2 && value.length < 80) ? value : null;
    case 'doctorPhone': { const c = value.replace(/\D/g, ''); return (c.length >= 7 && c.length <= 15) ? c : null; }
    case 'clinicRegistrationNumber': { const c = value.replace(/[^\w\-]/g, '').trim(); return (c.length >= 3 && c.length <= 20) ? c : null; }
    case 'clinicName': return (value.length > 2 && value.length < 80) ? value : null;
    case 'clinicAddress': return (value.length > 2 && value.length < 200) ? value : null;
    default: return value;
  }
}

function validateRecordField(field, value) {
  switch (field) {
    case 'date': {
      if (value.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/)) {
        const parts = value.split(/[\/\-\.]/);
        if (parts.length === 3 && parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year < 100) ? '20' + parts[2] : parts[2];
          return parts.join('/');
        }
        return value;
      }
      if (value.match(/\d{1,2}\s+\w+\s+\d{2,4}/)) return value;
      return null;
    }
    case 'chiefComplaint': return (value.length >= 2 && value.length <= 500) ? value : null;
    case 'medicalHistory': case 'dentalHistory': case 'allergies': case 'habits':
    case 'treatmentPlan': case 'prescription': case 'notes':
      return (value.length >= 1 && value.length <= 1000) ? value : null;
    case 'nextFollowUp': return (value.length < 20) ? value : null;
    case 'totalAmount': case 'paidAmount': case 'balanceAmount': {
      const cleaned = value.replace(/[^\d]/g, '');
      const num = parseInt(cleaned, 10);
      return (!isNaN(num) && num >= 0) ? num : null;
    }
    case 'paymentStatus': {
      const lower = value.toLowerCase();
      return lower.match(/paid|partial|pending|due|unpaid/) ? value : null;
    }
    case 'receiptNumber': return (value.length >= 2 && value.length <= 30) ? value : null;
    default: return value;
  }
}

function normalizeGender(val) {
  const v = val.toLowerCase().trim();
  if (v === 'm' || v === 'male' || v === 'man') return 'Male';
  if (v === 'f' || v === 'female' || v === 'woman') return 'Female';
  return null;
}

function cleanupFields(patient, doctor, record) {
  if (doctor.doctorName) {
    doctor.doctorName = doctor.doctorName
      .replace(/\b(Dr\.?\s*){2,}/gi, 'Dr. ')
      .replace(/^Dr\.\s*Dr\.\s*/i, 'Dr. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (doctor.clinicName) {
    const unwanted = [
      'sunday is holiday', 'sunday holiday', 'holiday', 'closed on sunday',
      'timings', 'open hours', 'working hours', 'consulting hours',
    ];
    let cleaned = doctor.clinicName;
    for (const u of unwanted) {
      const re = new RegExp('\\b' + u + '\\b\\s*', 'i');
      cleaned = cleaned.replace(re, '');
    }
    cleaned = cleaned.replace(/^[\s,;-]+|[\s,;-]+$/g, '').trim();
    if (cleaned.length >= 3) {
      doctor.clinicName = cleaned;
    }
  }

  if (patient.patientName) {
    const name = patient.patientName;
    if (name.match(/[^a-zA-Z\s.'-]/) && !name.match(/^(Mr|Mrs|Ms|Mx)\./i)) {
      patient.patientName = null;
    }
    if (name.match(/^(Dr|Doctor|Clinic|Hospital|Phone|Email|Address|Age|Gender|Date|Receipt|Total|Paid|Balance|Payment|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i)) {
      patient.patientName = null;
    }
    if (name.length < 3 || name.length > 50) {
      patient.patientName = null;
    }
  }
}

function classifyDocument(lowerText) {
  const cats = [
    { type: 'Prescription', keywords: ['prescription', 'rx', 'medication', 'medicine', 'dosage', 'tab ', 'cap ', 'syrup'] },
    { type: 'Receipt', keywords: ['receipt', 'payment', 'bill', 'invoice', 'amount paid'] },
    { type: 'X-Ray', keywords: ['x-ray', 'xray', 'radiograph', 'cbct', 'opg'] },
    { type: 'Treatment Plan', keywords: ['treatment plan', 'proposed treatment'] },
    { type: 'Clinical Notes', keywords: ['clinical notes', 'examination', 'findings'] },
    { type: 'Follow-up Notes', keywords: ['follow up', 'follow-up', 'review'] },
    { type: 'Dental Record', keywords: ['dental', 'tooth', 'teeth', 'oral'] },
  ];
  for (const cat of cats) {
    if (cat.keywords.some(kw => lowerText.includes(kw))) return cat.type;
  }
  return 'Medical Record';
}

module.exports = { extractFields, parseLabelValue, classifyDocument };
