export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  lastVisit: string;
  recordCount: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
}

export interface Procedure {
  id: string;
  tooth: string;
  procedureName: string;
  notes: string;
}

export interface Payment {
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'Paid' | 'Pending' | 'Partial';
}

export interface DentalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  chiefComplaint?: string;
  medicalHistory?: string;
  dentalHistory?: string;
  allergies?: string;
  habits?: string;
  treatmentPlan?: string;
  procedures: Procedure[];
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  patientId: string;
  title: string;
  type: string;
  category: string;
  date: string;
  uri?: string;
}
