import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import SectionCard from '../components/SectionCard';
import PrimaryButton from '../components/PrimaryButton';
import { createPatient, createRecord, uploadDocument, getPatients, createDoctor } from '../services/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Review'>;
type ReviewRoute = RouteProp<RootStackParamList, 'Review'>;

interface ProcedureEntry {
  tooth: string;
  procedureName: string;
  notes: string;
}

export default function ReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ReviewRoute>();
  const ocrData = route.params?.ocrData || {};

  const getInitial = (key: string) => {
    const val = (ocrData as Record<string, any>)?.[key];
    if (val === null || val === undefined) return '';
    return String(val);
  };

  const [form, setForm] = useState({
    patientName: getInitial('patientName'),
    patientId: getInitial('patientId'),
    age: getInitial('age'),
    gender: getInitial('gender'),
    phone: getInitial('phone'),
    email: getInitial('email'),
    address: getInitial('address'),
    doctorName: getInitial('doctorName'),
    specialization: getInitial('specialization'),
    doctorPhone: getInitial('doctorPhone'),
    clinicName: getInitial('clinicName'),
    clinicAddress: getInitial('clinicAddress'),
    clinicRegistrationNumber: getInitial('clinicRegistrationNumber'),
    date: getInitial('date'),
    receiptNumber: getInitial('receiptNumber'),
    chiefComplaint: getInitial('chiefComplaint'),
    medicalHistory: getInitial('medicalHistory'),
    dentalHistory: getInitial('dentalHistory'),
    allergies: getInitial('allergies'),
    habits: getInitial('habits'),
    treatmentPlan: getInitial('treatmentPlan'),
    totalAmount: getInitial('totalAmount'),
    paidAmount: getInitial('paidAmount'),
    balanceAmount: getInitial('balanceAmount'),
    nextFollowUp: getInitial('nextFollowUp'),
    notes: getInitial('notes'),
  });

  const ocrProcedures = (() => {
    const direct = (ocrData as Record<string, any>)?.procedures;
    if (Array.isArray(direct) && direct.length > 0) return direct;
    const sdStr = (ocrData as Record<string, any>)?._structuredData;
    if (sdStr) {
      try {
        const sd = JSON.parse(sdStr);
        if (sd?.record?.procedures) return sd.record.procedures;
      } catch {}
    }
    return null;
  })();
  const initialProcedures: ProcedureEntry[] = Array.isArray(ocrProcedures) && ocrProcedures.length > 0
    ? ocrProcedures.map((p: any) => ({
        tooth: p.tooth || '',
        procedureName: p.procedureName || p.procedure_name || '',
        notes: p.notes || '',
      }))
    : [];

  const [procedures, setProcedures] = useState<ProcedureEntry[]>(initialProcedures);

  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [newProcedure, setNewProcedure] = useState<ProcedureEntry>({ tooth: '', procedureName: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addProcedure = () => {
    if (newProcedure.tooth && newProcedure.procedureName) {
      setProcedures([...procedures, { ...newProcedure }]);
      setNewProcedure({ tooth: '', procedureName: '', notes: '' });
      setShowProcedureForm(false);
    }
  };

  const removeProcedure = (index: number) => {
    setProcedures(procedures.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.patientName.trim()) {
      Alert.alert('Required', 'Patient name is required.');
      return;
    }

    setSaving(true);
    try {
      const uploadedFilePath = (ocrData as Record<string, string>)?._uploadedFilePath;
      const uploadedFileName = (ocrData as Record<string, string>)?._uploadedFileName;
      const uploadedMimeType = (ocrData as Record<string, string>)?._uploadedMimeType;

      let patientId: string;

      const existingPatients = await getPatients(form.phone || form.patientName);
      const existing = form.phone
        ? existingPatients.find(p => p.phone === form.phone)
        : existingPatients.find(p => p.name.toLowerCase() === form.patientName.toLowerCase());

      if (existing) {
        patientId = existing.id;
      } else {
        const patientResult = await createPatient({
          name: form.patientName,
          age: parseInt(form.age) || 0,
          gender: form.gender,
          phone: form.phone,
          email: form.email,
          address: form.address,
        });
        patientId = patientResult.patient.id;
      }

      let doctorId: string | undefined;
      if (form.doctorName.trim()) {
        try {
          const doctorResult = await createDoctor({
            name: form.doctorName,
            specialization: form.specialization || undefined,
            phone: form.doctorPhone || undefined,
            clinicName: form.clinicName || undefined,
            clinicAddress: form.clinicAddress || undefined,
            clinicRegistrationNumber: form.clinicRegistrationNumber || undefined,
          });
          doctorId = doctorResult.id;
        } catch (docErr) {
          console.warn('Doctor creation failed:', docErr);
        }
      }

      const record = await createRecord({
        patientId,
        doctorId: doctorId || undefined,
        recordDate: form.date || undefined,
        receiptNumber: form.receiptNumber || undefined,
        chiefComplaint: form.chiefComplaint || undefined,
        medicalHistory: form.medicalHistory || undefined,
        dentalHistory: form.dentalHistory || undefined,
        allergies: form.allergies || undefined,
        habits: form.habits || undefined,
        treatmentPlan: form.treatmentPlan || undefined,
        notes: form.notes || undefined,
        nextFollowUp: form.nextFollowUp || undefined,
        procedures: procedures.map((p) => ({ tooth: p.tooth, procedureName: p.procedureName, notes: p.notes })),
        totalAmount: parseInt(form.totalAmount) || 0,
        paidAmount: parseInt(form.paidAmount) || 0,
      });

      if (uploadedFilePath && uploadedFileName) {
        try {
          const rawText = (ocrData as Record<string, string>)?._rawText || '';
          await uploadDocument(
            patientId,
            uploadedFilePath,
            uploadedFileName,
            uploadedMimeType || 'image/jpeg',
            `Dental Record - ${new Date().toLocaleDateString()}`,
            'Dental Records',
            record.id,
            rawText,
          );
        } catch (docErr) {
          console.warn('Document upload failed, but record was saved:', docErr);
        }
      }

      setSaving(false);
      Alert.alert('Record Saved', 'Patient record has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('PatientDetails', { patientId }) },
      ]);
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to save record');
    }
  };

  const total = parseInt(form.totalAmount) || 0;
  const paid = parseInt(form.paidAmount) || 0;
  const balance = total - paid;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Record</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Verify the extracted information before saving.
          </Text>

          {/* Receipt / Record Info */}
          <SectionCard title="Record Info" icon="document-text">
            <FormField
              label="Date"
              value={form.date}
              onChange={(v) => updateField('date', v)}
            />
            <FormField
              label="Receipt Number"
              value={form.receiptNumber}
              onChange={(v) => updateField('receiptNumber', v)}
            />
            <FormField
              label="Patient Reference"
              value={form.patientId}
              onChange={(v) => updateField('patientId', v)}
            />
          </SectionCard>

          {/* Patient Details */}
          <SectionCard title="Patient Details" icon="person">
            <FormField
              label="Patient Name"
              value={form.patientName}
              onChange={(v) => updateField('patientName', v)}
            />
            <FormField
              label="Age"
              value={form.age}
              onChange={(v) => updateField('age', v)}
              keyboardType="number-pad"
            />
            <FormField
              label="Gender"
              value={form.gender}
              onChange={(v) => updateField('gender', v)}
            />
            <FormField
              label="Phone"
              value={form.phone}
              onChange={(v) => updateField('phone', v)}
              keyboardType="phone-pad"
            />
            <FormField
              label="Email"
              value={form.email}
              onChange={(v) => updateField('email', v)}
              keyboardType="email-address"
            />
            <FormField
              label="Address"
              value={form.address}
              onChange={(v) => updateField('address', v)}
              multiline
            />
          </SectionCard>

          {/* Doctor Details */}
          <SectionCard title="Doctor Details" icon="medical">
            <FormField
              label="Doctor Name"
              value={form.doctorName}
              onChange={(v) => updateField('doctorName', v)}
            />
            <FormField
              label="Specialization"
              value={form.specialization}
              onChange={(v) => updateField('specialization', v)}
            />
            <FormField
              label="Doctor Phone"
              value={form.doctorPhone}
              onChange={(v) => updateField('doctorPhone', v)}
              keyboardType="phone-pad"
            />
            <FormField
              label="Clinic Name"
              value={form.clinicName}
              onChange={(v) => updateField('clinicName', v)}
            />
            <FormField
              label="Clinic Address"
              value={form.clinicAddress}
              onChange={(v) => updateField('clinicAddress', v)}
              multiline
            />
            <FormField
              label="Clinic Reg. No"
              value={form.clinicRegistrationNumber}
              onChange={(v) => updateField('clinicRegistrationNumber', v)}
            />
          </SectionCard>

          {/* Chief Complaint */}
          <SectionCard title="Chief Complaint" icon="chatbubble-ellipses">
            <FormField
              label="Chief Complaint"
              value={form.chiefComplaint}
              onChange={(v) => updateField('chiefComplaint', v)}
              multiline
            />
            <FormField
              label="Notes / Duration"
              value={form.notes}
              onChange={(v) => updateField('notes', v)}
            />
          </SectionCard>

          {/* Medical History */}
          <SectionCard title="Medical History" icon="heart">
            <FormField
              label="Medical History"
              value={form.medicalHistory}
              onChange={(v) => updateField('medicalHistory', v)}
              multiline
            />
          </SectionCard>

          {/* Dental History */}
          <SectionCard title="Dental History" icon="fitness">
            <FormField
              label="Dental History"
              value={form.dentalHistory}
              onChange={(v) => updateField('dentalHistory', v)}
              multiline
            />
          </SectionCard>

          {/* Allergies & Habits */}
          <SectionCard title="Allergies & Habits" icon="warning">
            <FormField
              label="Allergies"
              value={form.allergies}
              onChange={(v) => updateField('allergies', v)}
              multiline
            />
            <View style={{ height: 4 }} />
            <FormField
              label="Habits"
              value={form.habits}
              onChange={(v) => updateField('habits', v)}
              multiline
            />
          </SectionCard>

          {/* Treatment Plan */}
          <SectionCard title="Treatment Plan" icon="clipboard">
            <FormField
              label="Treatment Plan"
              value={form.treatmentPlan}
              onChange={(v) => updateField('treatmentPlan', v)}
              multiline
            />
          </SectionCard>

          {/* Procedures */}
          <SectionCard title="Procedures / Tooth Details" icon="bandage">
            {procedures.map((proc, index) => (
              <View key={index} style={styles.procedureCard}>
                <View style={styles.procedureHeader}>
                  <Text style={styles.procedureTooth}>Tooth {proc.tooth}</Text>
                  {procedures.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeProcedure(index)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="#FF3B30"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.procedureLabel}>Procedure:</Text>
                <Text style={styles.procedureValue}>
                  {proc.procedureName}
                </Text>
                <Text style={styles.procedureLabel}>Notes:</Text>
                <Text style={styles.procedureValue}>{proc.notes}</Text>
              </View>
            ))}

            {showProcedureForm ? (
              <View style={styles.newProcedureForm}>
                <FormField
                  label="Tooth Number"
                  value={newProcedure.tooth}
                  onChange={(v) =>
                    setNewProcedure({ ...newProcedure, tooth: v })
                  }
                  keyboardType="number-pad"
                />
                <FormField
                  label="Procedure Name"
                  value={newProcedure.procedureName}
                  onChange={(v) =>
                    setNewProcedure({ ...newProcedure, procedureName: v })
                  }
                />
                <FormField
                  label="Notes"
                  value={newProcedure.notes}
                  onChange={(v) =>
                    setNewProcedure({ ...newProcedure, notes: v })
                  }
                  multiline
                />
                <View style={styles.procedureActions}>
                  <PrimaryButton
                    title="Add"
                    onPress={addProcedure}
                    variant="primary"
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    title="Cancel"
                    onPress={() => {
                      setShowProcedureForm(false);
                      setNewProcedure({ tooth: '', procedureName: '', notes: '' });
                    }}
                    variant="secondary"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <PrimaryButton
                title="Add Procedure"
                icon="add-circle"
                onPress={() => setShowProcedureForm(true)}
                variant="outline"
              />
            )}
          </SectionCard>

          {/* Payment */}
          <SectionCard title="Payment / Financial Details" icon="cash">
            <FormField
              label="Total Amount"
              value={form.totalAmount}
              onChange={(v) => updateField('totalAmount', v)}
              keyboardType="number-pad"
            />
            <FormField
              label="Paid Amount"
              value={form.paidAmount}
              onChange={(v) => updateField('paidAmount', v)}
              keyboardType="number-pad"
            />
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Balance</Text>
              <Text style={styles.readOnlyValue}>{balance.toLocaleString()}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>Payment Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  balance > 0
                    ? styles.statusPending
                    : styles.statusPaid,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    balance > 0
                      ? styles.statusTextPending
                      : styles.statusTextPaid,
                  ]}
                >
                  {balance > 0 ? (paid > 0 ? 'Partial' : 'Pending') : 'Paid'}
                </Text>
              </View>
            </View>
            <FormField
              label="Next Follow-up"
              value={form.nextFollowUp}
              onChange={(v) => updateField('nextFollowUp', v)}
            />
          </SectionCard>

          {/* Save Button */}
          <PrimaryButton
            title={saving ? 'Saving...' : 'Save Patient Record'}
            icon="checkmark-circle"
            onPress={handleSave}
            variant="primary"
            disabled={saving}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChange,
  multiline = false,
  keyboardType = 'default',
  hasWarning = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  hasWarning?: boolean;
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      {hasWarning && !value ? (
        <View style={fieldStyles.warningContainer}>
          <Ionicons name="warning" size={14} color="#FF9500" />
          <Text style={fieldStyles.warningText}>
            Information not detected
          </Text>
        </View>
      ) : null}
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          hasWarning && !value && fieldStyles.warningInput,
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#C7C7CC"
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636366',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1C1E',
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  warningInput: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFEF7',
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  procedureCard: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  procedureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  procedureTooth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  procedureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  procedureValue: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  newProcedureForm: {
    backgroundColor: '#F2F7FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#B3D7FF',
  },
  procedureActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 6,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636366',
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusPaid: {
    backgroundColor: '#D4EDDA',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#856404',
  },
  statusTextPaid: {
    color: '#155724',
  },
});
