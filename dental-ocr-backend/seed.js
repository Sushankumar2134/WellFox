require('dotenv').config();
const { initDatabase, runSql, queryAll, saveDatabase } = require('./src/config/database');

async function seed() {
  await initDatabase();

  const existingPatients = queryAll('SELECT COUNT(*) as count FROM patients');
  if (existingPatients[0].count > 0) {
    console.log(`Database already has ${existingPatients[0].count} patients. Clearing and re-seeding...`);
    runSql('DELETE FROM documents');
    runSql('DELETE FROM payments');
    runSql('DELETE FROM procedures');
    runSql('DELETE FROM dental_records');
    runSql('DELETE FROM doctors');
    runSql('DELETE FROM patients');
  }

  const now = new Date().toISOString();
  const daysAgo = (d) => { const t = new Date(); t.setDate(t.getDate() - d); return t.toISOString(); };

  const doctors = [
    { id: 'DR-001', name: 'Dr. Arun Kumar', specialization: 'General Dentistry', phone: '9876001234' },
    { id: 'DR-002', name: 'Dr. Priya Menon', specialization: 'Orthodontics', phone: '9876001235' },
    { id: 'DR-003', name: 'Dr. Rajesh Sharma', specialization: 'Endodontics', phone: '9876001236' },
    { id: 'DR-004', name: 'Dr. Lakshmi Nair', specialization: 'Periodontics', phone: '9876001237' },
    { id: 'DR-005', name: 'Dr. Mohammed Faisal', specialization: 'Oral Surgery', phone: '9876001238' },
    { id: 'DR-006', name: 'Dr. Anitha Krishnan', specialization: 'Pediatric Dentistry', phone: '9876001239' },
  ];

  for (const d of doctors) {
    runSql(
      'INSERT INTO doctors (id, name, specialization, phone, created_at, updated_at) VALUES (?,?,?,?,?,?)',
      [d.id, d.name, d.specialization, d.phone, now, now]
    );
  }
  console.log(`Inserted ${doctors.length} doctors`);

  const patients = [
    { id: 'PT-001', name: 'John Mathew', age: 32, gender: 'Male', phone: '9876543210', email: 'john.mathew@email.com', address: '123 Health Street, Kochi, Kerala 682001' },
    { id: 'PT-002', name: 'Asha Menon', age: 45, gender: 'Female', phone: '9876543211', email: 'asha.menon@email.com', address: '45 Park Road, Ernakulam, Kerala 682011' },
    { id: 'PT-003', name: 'Rahul Sharma', age: 28, gender: 'Male', phone: '9876543212', email: 'rahul.sharma@email.com', address: '78 Lake View, Trivandrum, Kerala 695001' },
    { id: 'PT-004', name: 'Deepa Nair', age: 35, gender: 'Female', phone: '9876543213', email: 'deepa.nair@email.com', address: '23 Temple Road, Kottayam, Kerala 686001' },
    { id: 'PT-005', name: 'Santhosh Kumar', age: 52, gender: 'Male', phone: '9876543214', email: 'santhosh.kumar@email.com', address: '56 MG Road, Calicut, Kerala 673001' },
    { id: 'PT-006', name: 'Meera Thomas', age: 29, gender: 'Female', phone: '9876543215', email: 'meera.thomas@email.com', address: '89 Church Street, Thrissur, Kerala 680001' },
    { id: 'PT-007', name: 'Vijay Patel', age: 41, gender: 'Male', phone: '9876543216', email: 'vijay.patel@email.com', address: '34 Gandhi Nagar, Palakkad, Kerala 678001' },
    { id: 'PT-008', name: 'Lakshmi Devi', age: 58, gender: 'Female', phone: '9876543217', email: 'lakshmi.devi@email.com', address: '67 Station Road, Kollam, Kerala 691001' },
    { id: 'PT-009', name: 'Arjun Reddy', age: 24, gender: 'Male', phone: '9876543218', email: 'arjun.reddy@email.com', address: '12 Bank Junction, Alappuzha, Kerala 688001' },
    { id: 'PT-010', name: 'Divya Krishnan', age: 38, gender: 'Female', phone: '9876543219', email: 'divya.krishnan@email.com', address: '90 Market Road, Kozhikode, Kerala 673001' },
    { id: 'PT-011', name: 'Ramesh Babu', age: 61, gender: 'Male', phone: '9876543220', email: 'ramesh.babu@email.com', address: '15 Gandhi Road, Kannur, Kerala 670001' },
    { id: 'PT-012', name: 'Sneha George', age: 26, gender: 'Female', phone: '9876543221', email: 'sneha.george@email.com', address: '42 Hill Top, Idukki, Kerala 685001' },
    { id: 'PT-013', name: 'Pradeep Menon', age: 47, gender: 'Male', phone: '9876543222', email: 'pradeep.menon@email.com', address: '71 Beach Road, Kasaragod, Kerala 673001' },
    { id: 'PT-014', name: 'Anju Sebastian', age: 33, gender: 'Female', phone: '9876543223', email: 'anju.sebastian@email.com', address: '28 Forest Lane, Wayanad, Kerala 673001' },
    { id: 'PT-015', name: 'Bijoy Thomas', age: 55, gender: 'Male', phone: '9876543224', email: 'bijoy.thomas@email.com', address: '53 Main Street, Pathanamthitta, Kerala 689001' },
    { id: 'PT-016', name: 'Kavitha Rajan', age: 30, gender: 'Female', phone: '9876543225', email: 'kavitha.rajan@email.com', address: '36 River Bank, Malappuram, Kerala 673001' },
    { id: 'PT-017', name: 'Gopi Krishna', age: 43, gender: 'Male', phone: '9876543226', email: 'gopi.krishna@email.com', address: '84 Temple Road, Thrissur, Kerala 680001' },
    { id: 'PT-018', name: 'Nisha Varghese', age: 27, gender: 'Female', phone: '9876543227', email: 'nisha.varghese@email.com', address: '19 College Road, Ernakulam, Kerala 682011' },
    { id: 'PT-019', name: 'Suresh Pillai', age: 50, gender: 'Male', phone: '9876543228', email: 'suresh.pillai@email.com', address: '62 Harbour View, Kollam, Kerala 691001' },
    { id: 'PT-020', name: 'Amritha S', age: 34, gender: 'Female', phone: '9876543229', email: 'amritha.s@email.com', address: '47 Sunrise Avenue, Trivandrum, Kerala 695001' },
  ];

  for (const p of patients) {
    const created = daysAgo(Math.floor(Math.random() * 60) + 10);
    runSql(
      'INSERT INTO patients (id, name, age, gender, phone, email, address, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [p.id, p.name, p.age, p.gender, p.phone, p.email, p.address, created, created]
    );
  }
  console.log(`Inserted ${patients.length} patients`);

  const records = [
    { patientId: 'PT-001', doctorId: 'DR-001', chiefComplaint: 'Pain in lower right tooth for 3 days', medicalHistory: 'Diabetes Type 2', dentalHistory: 'Previous root canal on tooth 36', allergies: 'Penicillin', habits: 'Smoking', treatmentPlan: 'Root Canal Treatment\nCrown placement on tooth 46', procedures: [{ tooth: '46', name: 'Root Canal Treatment', notes: 'Deep caries with pulp involvement' }], total: 15000, paid: 5000, daysBack: 30 },
    { patientId: 'PT-001', doctorId: 'DR-001', chiefComplaint: 'Follow-up for root canal', medicalHistory: 'Diabetes Type 2', dentalHistory: 'RCT completed on tooth 46', allergies: 'Penicillin', habits: 'Smoking', treatmentPlan: 'Crown placement', procedures: [{ tooth: '46', name: 'Crown Placement', notes: 'PFM crown cemented' }], total: 8000, paid: 8000, daysBack: 20 },
    { patientId: 'PT-001', doctorId: 'DR-003', chiefComplaint: 'Sensitivity in upper front teeth', medicalHistory: 'Diabetes Type 2', dentalHistory: 'RCT on 46, Crown on 46', allergies: 'Penicillin', habits: 'Smoking', treatmentPlan: 'Fluoride application\nDesensitizing paste', procedures: [{ tooth: '11', name: 'Fluoride Application', notes: 'Cervical sensitivity' }, { tooth: '21', name: 'Fluoride Application', notes: 'Cervical sensitivity' }], total: 2000, paid: 2000, daysBack: 5 },

    { patientId: 'PT-002', doctorId: 'DR-004', chiefComplaint: 'Bleeding gums while brushing', medicalHistory: 'Hypertension', dentalHistory: 'Scaling done 2 years ago', allergies: 'None', habits: 'None', treatmentPlan: 'Deep scaling and root planing\nAntibiotic therapy', procedures: [{ tooth: 'Full Mouth', name: 'Deep Scaling', notes: 'Generalized chronic periodontitis' }], total: 6000, paid: 6000, daysBack: 45 },
    { patientId: 'PT-002', doctorId: 'DR-004', chiefComplaint: 'Loose tooth in lower front', medicalHistory: 'Hypertension', dentalHistory: 'Deep scaling done', allergies: 'None', habits: 'None', treatmentPlan: 'Splinting of mobile teeth\nPeriodontal maintenance', procedures: [{ tooth: '31', name: 'Splinting', notes: 'Grade II mobility' }, { tooth: '41', name: 'Splinting', notes: 'Grade II mobility' }], total: 4500, paid: 2000, daysBack: 15 },

    { patientId: 'PT-003', doctorId: 'DR-002', chiefComplaint: 'Crooked teeth, wants alignment', medicalHistory: 'None', dentalHistory: 'No previous treatment', allergies: 'None', habits: 'None', treatmentPlan: 'Orthodontic braces\nEstimated 18 months', procedures: [{ tooth: 'Full Arch', name: 'Braces Installation', notes: 'Metal brackets, upper and lower arch' }], total: 45000, paid: 15000, daysBack: 60 },
    { patientId: 'PT-003', doctorId: 'DR-002', chiefComplaint: 'Orthodontic adjustment', medicalHistory: 'None', dentalHistory: 'Braces installed', allergies: 'None', habits: 'None', treatmentPlan: 'Monthly adjustments', procedures: [{ tooth: 'Full Arch', name: 'Braces Adjustment', notes: 'Wire change and tightening' }], total: 2000, paid: 2000, daysBack: 30 },
    { patientId: 'PT-003', doctorId: 'DR-002', chiefComplaint: 'Orthodontic check-up', medicalHistory: 'None', dentalHistory: 'Braces in progress', allergies: 'None', habits: 'None', treatmentPlan: 'Continue alignment', procedures: [{ tooth: 'Full Arch', name: 'Braces Adjustment', notes: 'Progress good, elastic change' }], total: 2000, paid: 2000, daysBack: 2 },

    { patientId: 'PT-004', doctorId: 'DR-003', chiefComplaint: 'Severe pain in lower left molar', medicalHistory: 'Thyroid disorder', dentalHistory: 'Filled teeth in upper jaw', allergies: 'Iodine', habits: 'None', treatmentPlan: 'Root Canal Treatment\nCrown on tooth 36', procedures: [{ tooth: '36', name: 'Root Canal Treatment', notes: 'Acute pulpitis, Irreversible' }], total: 12000, paid: 6000, daysBack: 25 },
    { patientId: 'PT-004', doctorId: 'DR-003', chiefComplaint: 'RCT follow-up, no pain', medicalHistory: 'Thyroid disorder', dentalHistory: 'RCT on 36 completed', allergies: 'Iodine', habits: 'None', treatmentPlan: 'Crown placement', procedures: [{ tooth: '36', name: 'Crown Placement', notes: 'Zirconia crown' }], total: 10000, paid: 10000, daysBack: 10 },

    { patientId: 'PT-005', doctorId: 'DR-001', chiefComplaint: 'Broken tooth while eating', medicalHistory: 'Heart disease (on blood thinners)', dentalHistory: 'Multiple fillings', allergies: 'Aspirin', habits: 'Betel nut chewing', treatmentPlan: 'Extraction of tooth 46\nImplant planning', procedures: [{ tooth: '46', name: 'Extraction', notes: 'Non-restorable fracture' }], total: 3000, paid: 3000, daysBack: 40 },
    { patientId: 'PT-005', doctorId: 'DR-005', chiefComplaint: 'Implant consultation', medicalHistory: 'Heart disease', dentalHistory: 'Extraction of 46 done', allergies: 'Aspirin', habits: 'Betel nut chewing', treatmentPlan: 'Implant placement after 3 months healing\nBone grafting may be needed', procedures: [{ tooth: '46', name: 'Implant Planning', notes: 'CBCT scan done, bone density adequate' }], total: 5000, paid: 5000, daysBack: 10 },

    { patientId: 'PT-006', doctorId: 'DR-006', chiefComplaint: 'Child has cavity in back teeth', medicalHistory: 'None', dentalHistory: 'First dental visit', allergies: 'None', habits: 'Frequent sugar intake', treatmentPlan: 'Fissure sealants\nFluoride application\nDiet counseling', procedures: [{ tooth: '74', name: 'Filling', notes: 'Composite restoration' }, { tooth: '75', name: 'Fissure Sealant', notes: 'Preventive sealant' }], total: 4000, paid: 4000, daysBack: 35 },

    { patientId: 'PT-007', doctorId: 'DR-001', chiefComplaint: 'Loose denture, difficulty chewing', medicalHistory: 'Diabetes Type 1', dentalHistory: 'Dentures for 5 years', allergies: 'None', habits: 'Smoking', treatmentPlan: 'New denture fabrication\nImpressions taken', procedures: [{ tooth: 'Upper Arch', name: 'Denture Impression', notes: 'Preliminary impressions' }, { tooth: 'Lower Arch', name: 'Denture Impression', notes: 'Preliminary impressions' }], total: 20000, paid: 10000, daysBack: 50 },
    { patientId: 'PT-007', doctorId: 'DR-001', chiefComplaint: 'Denture trial', medicalHistory: 'Diabetes Type 1', dentalHistory: 'Denture impressions done', allergies: 'None', habits: 'Smoking', treatmentPlan: 'Denture delivery', procedures: [{ tooth: 'Upper Arch', name: 'Complete Denture', notes: 'Acrylic denture delivered' }, { tooth: 'Lower Arch', name: 'Complete Denture', notes: 'Acrylic denture delivered' }], total: 25000, paid: 25000, daysBack: 20 },

    { patientId: 'PT-008', doctorId: 'DR-003', chiefComplaint: 'Swelling in upper jaw', medicalHistory: 'Osteoporosis', dentalHistory: 'Root canal treated tooth 26', allergies: 'None', habits: 'None', treatmentPlan: 'Extraction of tooth 26\nAntibiotic course\nLater implant', procedures: [{ tooth: '26', name: 'Extraction', notes: 'Periapical abscess, non-salvageable' }], total: 4000, paid: 4000, daysBack: 28 },

    { patientId: 'PT-009', doctorId: 'DR-002', chiefComplaint: 'Wisdom tooth pain', medicalHistory: 'None', dentalHistory: 'No previous treatment', allergies: 'None', habits: 'None', treatmentPlan: 'Surgical extraction of 38\nImpacted tooth', procedures: [{ tooth: '38', name: 'Surgical Extraction', notes: 'Mesioangular impaction, surgical removal' }], total: 8000, paid: 8000, daysBack: 22 },
    { patientId: 'PT-009', doctorId: 'DR-005', chiefComplaint: 'Other wisdom tooth removal', medicalHistory: 'None', dentalHistory: 'Extraction of 38 done', allergies: 'None', habits: 'None', treatmentPlan: 'Extraction of 48', procedures: [{ tooth: '48', name: 'Surgical Extraction', notes: 'Horizontal impaction' }], total: 8000, paid: 4000, daysBack: 8 },

    { patientId: 'PT-010', doctorId: 'DR-001', chiefComplaint: 'Discolored front teeth', medicalHistory: 'None', dentalHistory: 'No treatment', allergies: 'None', habits: 'Tea and coffee', treatmentPlan: 'Teeth whitening\nVeneers on upper front teeth', procedures: [{ tooth: '11-16', name: 'Teeth Whitening', notes: 'In-office bleaching' }, { tooth: '21-26', name: 'Teeth Whitening', notes: 'In-office bleaching' }], total: 18000, paid: 18000, daysBack: 18 },

    { patientId: 'PT-011', doctorId: 'DR-003', chiefComplaint: 'Constant headache and jaw pain', medicalHistory: 'Arthritis', dentalHistory: 'Old fillings loosening', allergies: 'NSAIDs', habits: 'Teeth grinding (bruxism)', treatmentPlan: 'Night guard fabrication\nTMJ evaluation', procedures: [{ tooth: 'Full Arch', name: 'Night Guard', notes: 'Custom occlusal splint' }], total: 6000, paid: 6000, daysBack: 12 },

    { patientId: 'PT-012', doctorId: 'DR-006', chiefComplaint: 'Child has toothache', medicalHistory: 'None', dentalHistory: 'Previous fillings on primary molars', allergies: 'None', habits: 'Frequent snacking', treatmentPlan: 'Pulpotomy on primary molar\nStainless steel crown', procedures: [{ tooth: '85', name: 'Pulpotomy', notes: 'Vital pulp therapy' }, { tooth: '85', name: 'SS Crown', notes: 'Stainless steel crown placement' }], total: 5000, paid: 5000, daysBack: 42 },

    { patientId: 'PT-013', doctorId: 'DR-004', chiefComplaint: 'Receding gums', medicalHistory: 'Diabetes Type 2', dentalHistory: 'Scaling done previously', allergies: 'Metformin', habits: 'Aggressive brushing', treatmentPlan: 'Gum grafting\nSoft tissue management', procedures: [{ tooth: '31-41', name: 'Gum Graft', notes: 'Connective tissue graft' }], total: 15000, paid: 7500, daysBack: 38 },

    { patientId: 'PT-014', doctorId: 'DR-001', chiefComplaint: 'Fallen filling', medicalHistory: 'None', dentalHistory: 'Amalgam filling on 36', allergies: 'None', habits: 'None', treatmentPlan: 'New composite filling\nCheck adjacent teeth', procedures: [{ tooth: '36', name: 'Composite Filling', notes: 'Replacing old amalgam with composite' }], total: 3000, paid: 3000, daysBack: 14 },

    { patientId: 'PT-015', doctorId: 'DR-005', chiefComplaint: 'Cyst in lower jaw', medicalHistory: 'Hypertension', dentalHistory: 'Multiple missing teeth', allergies: 'Amlodipine', habits: 'Tobacco chewing', treatmentPlan: 'CBCT scan\nCyst enucleation\nBone grafting', procedures: [{ tooth: '35-36 area', name: 'Cyst Enucleation', notes: 'Surgical removal of odontogenic cyst' }], total: 30000, paid: 15000, daysBack: 55 },
    { patientId: 'PT-015', doctorId: 'DR-005', chiefComplaint: 'Post-surgery follow-up', medicalHistory: 'Hypertension', dentalHistory: 'Cyst removal done', allergies: 'Amlodipine', habits: 'Tobacco chewing', treatmentPlan: 'Healing monitoring\nImplant planning', procedures: [{ tooth: '35-36 area', name: 'Follow-up Exam', notes: 'Healing progressing well' }], total: 1000, paid: 1000, daysBack: 25 },

    { patientId: 'PT-016', doctorId: 'DR-001', chiefComplaint: 'Pregnancy dental checkup', medicalHistory: 'Pregnant (28 weeks)', dentalHistory: 'Scaling done before pregnancy', allergies: 'None', habits: 'None', treatmentPlan: 'Preventive cleaning\nFluoride varnish\nOral hygiene instruction', procedures: [{ tooth: 'Full Mouth', name: 'Prophylaxis', notes: 'Gentle cleaning for pregnant patient' }], total: 3000, paid: 3000, daysBack: 8 },

    { patientId: 'PT-017', doctorId: 'DR-001', chiefComplaint: 'Multiple missing teeth', medicalHistory: 'Diabetes Type 2', dentalHistory: 'Several teeth extracted years ago', allergies: 'None', habits: 'Smoking', treatmentPlan: 'Full mouth rehabilitation\nImplants for missing teeth', procedures: [{ tooth: '16', name: 'Implant Placement', notes: 'Nobel Biocare implant' }, { tooth: '26', name: 'Implant Placement', notes: 'Nobel Biocare implant' }, { tooth: '36', name: 'Implant Placement', notes: 'Nobel Biocare implant' }], total: 90000, paid: 45000, daysBack: 50 },

    { patientId: 'PT-018', doctorId: 'DR-002', chiefComplaint: 'Want clear aligners', medicalHistory: 'None', dentalHistory: 'Mild crowding lower arch', allergies: 'None', habits: 'None', treatmentPlan: 'Invisalign clear aligners\nEstimated 12 months', procedures: [{ tooth: 'Lower Arch', name: 'Invisalign', notes: '30 aligners planned' }], total: 35000, paid: 17500, daysBack: 30 },

    { patientId: 'PT-019', doctorId: 'DR-003', chiefComplaint: 'Bridge came loose', medicalHistory: 'Liver disease', dentalHistory: 'Old bridge on upper right', allergies: 'None', habits: 'Alcohol', treatmentPlan: 'New bridge fabrication\nAbutment evaluation', procedures: [{ tooth: '14-16', name: 'Bridge Removal', notes: 'Old bridge removed' }, { tooth: '14-16', name: 'New Bridge', notes: 'PFM bridge preparation' }], total: 18000, paid: 9000, daysBack: 20 },

    { patientId: 'PT-020', doctorId: 'DR-004', chiefComplaint: 'Bad breath and bleeding', medicalHistory: 'None', dentalHistory: 'No scaling done in 4 years', allergies: 'None', habits: 'None', treatmentPlan: 'Full mouth scaling and root planing\nChlorhexidine rinse', procedures: [{ tooth: 'Full Mouth', name: 'Scaling and Root Planing', notes: 'Deep cleaning with ultrasonic and hand instruments' }], total: 5500, paid: 5500, daysBack: 3 },
    { patientId: 'PT-020', doctorId: 'DR-004', chiefComplaint: 'Follow-up after deep cleaning', medicalHistory: 'None', dentalHistory: 'SRP completed', allergies: 'None', habits: 'None', treatmentPlan: 'Re-evaluation in 4 weeks\nMaintenance schedule', procedures: [{ tooth: 'Full Mouth', name: 'Re-evaluation', notes: 'Gums healing well, pockets reduced' }], total: 1000, paid: 1000, daysBack: 1 },
  ];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const recId = `REC-${String(i + 1).padStart(3, '0')}`;
    const created = daysAgo(r.daysBack);

    runSql(
      'INSERT INTO dental_records (id, patient_id, doctor_id, chief_complaint, medical_history, dental_history, allergies, habits, treatment_plan, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [recId, r.patientId, r.doctorId, r.chiefComplaint, r.medicalHistory, r.dentalHistory, r.allergies, r.habits, r.treatmentPlan, created, created]
    );

    for (const proc of r.procedures) {
      const procId = `PRC-${recId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      runSql(
        'INSERT INTO procedures (id, record_id, tooth, procedure_name, notes) VALUES (?,?,?,?,?)',
        [procId, recId, proc.tooth, proc.name, proc.notes]
      );
    }

    const payId = `PAY-${recId}`;
    const balance = r.total - r.paid;
    const status = balance <= 0 ? 'Paid' : r.paid > 0 ? 'Partial' : 'Pending';
    runSql(
      'INSERT INTO payments (id, record_id, total_amount, paid_amount, balance, status) VALUES (?,?,?,?,?,?)',
      [payId, recId, r.total, r.paid, balance, status]
    );
  }
  console.log(`Inserted ${records.length} dental records with procedures and payments`);

  const documents = [
    { patientId: 'PT-001', recordId: 'REC-001', title: 'Dental X-Ray - Tooth 46', type: 'Image', category: 'X-Rays', date: daysAgo(30).split('T')[0] },
    { patientId: 'PT-001', recordId: 'REC-001', title: 'Root Canal Treatment Plan', type: 'PDF', category: 'Treatment Plans', date: daysAgo(30).split('T')[0] },
    { patientId: 'PT-001', recordId: 'REC-002', title: 'Crown Cementation Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(20).split('T')[0] },
    { patientId: 'PT-001', recordId: 'REC-003', title: 'Follow-up Clinical Notes', type: 'PDF', category: 'Dental Records', date: daysAgo(5).split('T')[0] },
    { patientId: 'PT-001', recordId: null, title: 'Patient Registration Form', type: 'PDF', category: 'Dental Records', date: daysAgo(30).split('T')[0] },

    { patientId: 'PT-002', recordId: 'REC-004', title: 'Periodontal Chart', type: 'PDF', category: 'Dental Records', date: daysAgo(45).split('T')[0] },
    { patientId: 'PT-002', recordId: 'REC-004', title: 'Dental X-Ray - Full Mouth', type: 'Image', category: 'X-Rays', date: daysAgo(45).split('T')[0] },
    { patientId: 'PT-002', recordId: 'REC-005', title: 'Splinting Treatment Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(15).split('T')[0] },

    { patientId: 'PT-003', recordId: 'REC-006', title: 'Orthodontic Assessment', type: 'PDF', category: 'Treatment Plans', date: daysAgo(60).split('T')[0] },
    { patientId: 'PT-003', recordId: 'REC-006', title: 'Pre-treatment X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(60).split('T')[0] },
    { patientId: 'PT-003', recordId: 'REC-006', title: 'Cephalometric X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(60).split('T')[0] },
    { patientId: 'PT-003', recordId: 'REC-007', title: 'Adjustment Progress Photo', type: 'Image', category: 'Dental Records', date: daysAgo(30).split('T')[0] },
    { patientId: 'PT-003', recordId: 'REC-008', title: 'Monthly Payment Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(2).split('T')[0] },

    { patientId: 'PT-004', recordId: 'REC-009', title: 'Panoramic X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(25).split('T')[0] },
    { patientId: 'PT-004', recordId: 'REC-010', title: 'Crown Fitting Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(10).split('T')[0] },

    { patientId: 'PT-005', recordId: 'REC-011', title: 'Extraction Consent Form', type: 'PDF', category: 'Dental Records', date: daysAgo(40).split('T')[0] },
    { patientId: 'PT-005', recordId: 'REC-012', title: 'CBCT Scan Report', type: 'PDF', category: 'X-Rays', date: daysAgo(10).split('T')[0] },
    { patientId: 'PT-005', recordId: 'REC-012', title: 'Implant Consultation Notes', type: 'PDF', category: 'Treatment Plans', date: daysAgo(10).split('T')[0] },

    { patientId: 'PT-006', recordId: 'REC-013', title: 'Pediatric Dental Assessment', type: 'PDF', category: 'Dental Records', date: daysAgo(35).split('T')[0] },
    { patientId: 'PT-006', recordId: 'REC-013', title: 'Treatment Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(35).split('T')[0] },

    { patientId: 'PT-007', recordId: 'REC-014', title: 'Denture Impression Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(50).split('T')[0] },
    { patientId: 'PT-007', recordId: 'REC-015', title: 'Denture Delivery Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(20).split('T')[0] },
    { patientId: 'PT-007', recordId: 'REC-015', title: 'Denture Care Instructions', type: 'PDF', category: 'Treatment Plans', date: daysAgo(20).split('T')[0] },

    { patientId: 'PT-008', recordId: 'REC-016', title: 'Abscess X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(28).split('T')[0] },
    { patientId: 'PT-008', recordId: 'REC-016', title: 'Extraction Record', type: 'PDF', category: 'Dental Records', date: daysAgo(28).split('T')[0] },

    { patientId: 'PT-009', recordId: 'REC-017', title: 'Impacted Tooth X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(22).split('T')[0] },
    { patientId: 'PT-009', recordId: 'REC-017', title: 'Surgical Consent Form', type: 'PDF', category: 'Dental Records', date: daysAgo(22).split('T')[0] },
    { patientId: 'PT-009', recordId: 'REC-018', title: 'Post-op Instructions', type: 'PDF', category: 'Treatment Plans', date: daysAgo(8).split('T')[0] },

    { patientId: 'PT-010', recordId: 'REC-019', title: 'Smile Design Photos', type: 'Image', category: 'Dental Records', date: daysAgo(18).split('T')[0] },
    { patientId: 'PT-010', recordId: 'REC-019', title: 'Whitening Treatment Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(18).split('T')[0] },

    { patientId: 'PT-011', recordId: 'REC-020', title: 'TMJ X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(12).split('T')[0] },
    { patientId: 'PT-011', recordId: 'REC-020', title: 'Night Guard Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(12).split('T')[0] },

    { patientId: 'PT-012', recordId: 'REC-021', title: 'Pediatric X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(42).split('T')[0] },
    { patientId: 'PT-012', recordId: 'REC-021', title: 'Treatment Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(42).split('T')[0] },

    { patientId: 'PT-013', recordId: 'REC-022', title: 'Gum Recession Photo', type: 'Image', category: 'Dental Records', date: daysAgo(38).split('T')[0] },
    { patientId: 'PT-013', recordId: 'REC-022', title: 'Grafting Treatment Plan', type: 'PDF', category: 'Treatment Plans', date: daysAgo(38).split('T')[0] },

    { patientId: 'PT-014', recordId: 'REC-023', title: 'Pre-filling Photo', type: 'Image', category: 'Dental Records', date: daysAgo(14).split('T')[0] },
    { patientId: 'PT-014', recordId: 'REC-023', title: 'Filling Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(14).split('T')[0] },

    { patientId: 'PT-015', recordId: 'REC-024', title: 'Jaw CBCT Scan', type: 'Image', category: 'X-Rays', date: daysAgo(55).split('T')[0] },
    { patientId: 'PT-015', recordId: 'REC-024', title: 'Surgical Treatment Plan', type: 'PDF', category: 'Treatment Plans', date: daysAgo(55).split('T')[0] },
    { patientId: 'PT-015', recordId: 'REC-025', title: 'Post-surgery X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(25).split('T')[0] },

    { patientId: 'PT-016', recordId: 'REC-026', title: 'Pregnancy Dental Clearance', type: 'PDF', category: 'Dental Records', date: daysAgo(8).split('T')[0] },

    { patientId: 'PT-017', recordId: 'REC-027', title: 'Full Mouth X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(50).split('T')[0] },
    { patientId: 'PT-017', recordId: 'REC-027', title: 'Implant Treatment Plan', type: 'PDF', category: 'Treatment Plans', date: daysAgo(50).split('T')[0] },
    { patientId: 'PT-017', recordId: 'REC-027', title: 'Implant Surgery Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(50).split('T')[0] },

    { patientId: 'PT-018', recordId: 'REC-028', title: 'Invisalign Scan Report', type: 'PDF', category: 'Treatment Plans', date: daysAgo(30).split('T')[0] },
    { patientId: 'PT-018', recordId: 'REC-028', title: 'Before Treatment Photo', type: 'Image', category: 'Dental Records', date: daysAgo(30).split('T')[0] },

    { patientId: 'PT-019', recordId: 'REC-029', title: 'Bridge X-Ray', type: 'Image', category: 'X-Rays', date: daysAgo(20).split('T')[0] },
    { patientId: 'PT-019', recordId: 'REC-030', title: 'New Bridge Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(15).split('T')[0] },

    { patientId: 'PT-020', recordId: 'REC-031', title: 'Periodontal Chart', type: 'PDF', category: 'Dental Records', date: daysAgo(3).split('T')[0] },
    { patientId: 'PT-020', recordId: 'REC-031', title: 'Scaling Receipt', type: 'PDF', category: 'Receipts', date: daysAgo(3).split('T')[0] },
    { patientId: 'PT-020', recordId: 'REC-032', title: 'Follow-up Notes', type: 'PDF', category: 'Dental Records', date: daysAgo(1).split('T')[0] },
  ];

  for (let i = 0; i < documents.length; i++) {
    const d = documents[i];
    const docId = `DOC-${String(i + 1).padStart(3, '0')}`;
    runSql(
      'INSERT INTO documents (id, patient_id, record_id, title, type, category, file_path, date, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [docId, d.patientId, d.recordId, d.title, d.type, d.category, null, d.date, d.date + 'T10:00:00.000Z']
    );
  }
  console.log(`Inserted ${documents.length} documents`);

  saveDatabase();
  console.log('\nDatabase seeded successfully!');
  console.log(`  - ${doctors.length} doctors`);
  console.log(`  - ${patients.length} patients`);
  console.log(`  - ${records.length} dental records (with procedures and payments)`);
  console.log(`  - ${documents.length} documents`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
