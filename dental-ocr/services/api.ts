import { API_BASE_URL, API_HOST } from './config';

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
  return json.data;
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API error');
}

export interface BackendPatient {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  record_count: number;
}

export interface BackendRecord {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  record_date: string | null;
  receipt_number: string | null;
  chief_complaint: string | null;
  medical_history: string | null;
  dental_history: string | null;
  allergies: string | null;
  habits: string | null;
  treatment_plan: string | null;
  notes: string | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
  procedures: Array<{ id: string; record_id: string; tooth: string; procedure_name: string; notes: string }>;
  payment: { id: string; record_id: string; total_amount: number; paid_amount: number; balance: number; status: string } | null;
}

export interface OCRResult {
  rawText: string;
  fields: Record<string, string | null>;
  structuredData?: {
    patient: Record<string, string | null>;
    doctor: Record<string, string | null>;
    record: Record<string, any>;
  };
  confidence: Record<string, { value: string | null; confidence: number; status: string }>;
  warnings: string[];
  quality: unknown;
  provider: string;
  uploadedFile: {
    filePath: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export interface BackendDocument {
  id: string;
  patient_id: string;
  patient_name?: string;
  record_id: string | null;
  title: string;
  type: string | null;
  category: string | null;
  file_path: string | null;
  date: string;
  created_at: string;
}

export function mapPatient(b: BackendPatient) {
  return {
    id: b.id,
    name: b.name,
    age: b.age ?? 0,
    gender: b.gender ?? '',
    phone: b.phone ?? '',
    email: b.email ?? undefined,
    address: b.address ?? undefined,
    lastVisit: b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '',
    recordCount: b.record_count ?? 0,
  };
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_HOST}/api/health`);
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}

export async function getPatients(search?: string): Promise<BackendPatient[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  const data = await apiGet<{ patients: BackendPatient[] }>(`/patients${q}`);
  return data.patients;
}

export async function getPatient(id: string): Promise<BackendPatient> {
  return apiGet<BackendPatient>(`/patients/${id}`);
}

export async function createPatient(body: Record<string, unknown>): Promise<{ patient: BackendPatient; warning?: string; duplicates?: unknown[] }> {
  return apiPost('/patients', body);
}

export async function updatePatient(id: string, body: Record<string, unknown>): Promise<BackendPatient> {
  return apiPut(`/patients/${id}`, body);
}

export async function deletePatient(id: string): Promise<void> {
  return apiDelete(`/patients/${id}`);
}

export async function getAllRecords(): Promise<BackendRecord[]> {
  const data = await apiGet<{ records: BackendRecord[] }>('/records');
  return data.records;
}

export async function getPatientRecords(patientId: string): Promise<BackendRecord[]> {
  const data = await apiGet<{ records: BackendRecord[] }>(`/records/patient/${patientId}`);
  return data.records;
}

export async function getRecord(id: string): Promise<BackendRecord> {
  return apiGet<BackendRecord>(`/records/${id}`);
}

export async function createRecord(body: Record<string, unknown>): Promise<BackendRecord> {
  return apiPost('/records', body);
}

export async function updateRecord(id: string, body: Record<string, unknown>): Promise<BackendRecord> {
  return apiPut(`/records/${id}`, body);
}

export async function deleteRecord(id: string): Promise<void> {
  return apiDelete(`/records/${id}`);
}

export async function getAllDocuments(): Promise<BackendDocument[]> {
  const data = await apiGet<{ documents: BackendDocument[] }>('/documents');
  return data.documents;
}

export async function processOCR(fileUri: string, fileName: string, mimeType: string): Promise<OCRResult> {
  const formData = new FormData();
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const type = mimeType || (ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg');

  formData.append('document', {
    uri: fileUri,
    name: fileName,
    type,
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}/ocr/process`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'OCR processing failed. Please try another image.');
  return json.data;
}

export async function uploadDocument(
  patientId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
  title: string,
  category?: string,
  recordId?: string,
  ocrRawText?: string,
): Promise<BackendDocument> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  formData.append('patientId', patientId);
  formData.append('title', title);
  if (category) formData.append('category', category);
  if (recordId) formData.append('recordId', recordId);
  if (ocrRawText) formData.append('ocrRawText', ocrRawText);

  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Document upload failed');
  return json.data;
}

export async function deleteDocument(id: string): Promise<void> {
  return apiDelete(`/documents/${id}`);
}

export async function generatePDF(patientId: string): Promise<{ filePath: string; filename: string; url: string }> {
  const data = await apiPost<{ message: string; filePath: string; filename: string }>(`/pdf/patient/${patientId}`);
  return { ...data, url: `${API_HOST}${data.filePath}` };
}

export async function getPatientDocuments(patientId: string): Promise<BackendDocument[]> {
  const data = await apiGet<{ documents: BackendDocument[] }>(`/documents/patient/${patientId}`);
  return data.documents;
}

export async function getDocument(id: string): Promise<BackendDocument> {
  return apiGet<BackendDocument>(`/documents/${id}`);
}

export interface BackendDoctor {
  id: string;
  name: string;
  specialization: string | null;
  phone: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_registration_number: string | null;
}

export async function getDoctors(): Promise<BackendDoctor[]> {
  const data = await apiGet<{ doctors: BackendDoctor[] }>('/doctors');
  return data.doctors;
}

export async function createDoctor(body: Record<string, unknown>): Promise<BackendDoctor> {
  return apiPost('/doctors', body);
}

export async function getDoctor(id: string): Promise<BackendDoctor> {
  return apiGet<BackendDoctor>(`/doctors/${id}`);
}
