import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import SectionCard from '../components/SectionCard';
import PrimaryButton from '../components/PrimaryButton';
import { getPatient, getPatientRecords, getPatientDocuments, BackendPatient, BackendRecord, BackendDocument, generatePDF, getDoctor } from '../services/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PatientDetails'>;
type DetailsRoute = RouteProp<RootStackParamList, 'PatientDetails'>;

export default function PatientDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailsRoute>();
  const { patientId } = route.params;

  const [patient, setPatient] = useState<BackendPatient | null>(null);
  const [records, setRecords] = useState<BackendRecord[]>([]);
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        getPatient(patientId),
        getPatientRecords(patientId),
        getPatientDocuments(patientId),
      ])
        .then(async ([p, recs, docs]) => {
          if (active) {
            setPatient(p);
            setDocuments(docs);
            const enrichedRecs = await Promise.all(
              recs.map(async (rec) => {
                if (rec.doctor_id) {
                  try {
                    const doc = await getDoctor(rec.doctor_id);
                    return { ...rec, _doctor: doc };
                  } catch {}
                }
                return rec;
              })
            );
            setRecords(enrichedRecs);
          }
        })
        .catch(() => Alert.alert('Error', 'Failed to load patient details'))
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [patientId])
  );

  const handleExportPDF = async () => {
    try {
      const result = await generatePDF(patientId);
      const pdfUrl = result.url;
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('PDF Generated', `File: ${result.filename}\n\nURL: ${pdfUrl}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate PDF');
    }
  };

  if (loading || !patient) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Header Card */}
        <View style={styles.patientHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {patient.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </View>
          <View style={styles.patientHeaderInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientId}>Patient ID: {patient.id}</Text>
          </View>
        </View>

        {/* Patient Details */}
        <SectionCard title="Patient Details" icon="person">
          <InfoRow label="Age" value={`${patient.age ?? ''}`} />
          <InfoRow label="Gender" value={patient.gender ?? ''} />
          <InfoRow label="Phone" value={patient.phone ?? ''} />
          <InfoRow label="Email" value={patient.email || 'Not provided'} />
          <InfoRow label="Address" value={patient.address || 'Not provided'} />
        </SectionCard>

        {/* Dental Records */}
        <Text style={styles.sectionTitleLarge}>Dental Records ({records.length})</Text>

        {records.length === 0 ? (
          <View style={styles.emptyRecords}>
            <Ionicons name="document-text-outline" size={40} color="#C7C7CC" />
            <Text style={styles.emptyRecordsText}>No records yet</Text>
          </View>
        ) : (
          records.map((rec, recIndex) => (
            <View key={rec.id} style={styles.recordBlock}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle}>Record #{recIndex + 1}</Text>
                <Text style={styles.recordDate}>
                  {(rec as any).record_date || new Date(rec.created_at).toLocaleDateString()}
                </Text>
              </View>

              {/* Receipt Number */}
              {(rec as any).receipt_number && (
                <InfoRow label="Receipt No" value={(rec as any).receipt_number} />
              )}

              {/* Doctor Details */}
              {(rec as any)._doctor ? (
                <SectionCard title="Doctor" icon="medical">
                  <InfoRow label="Doctor" value={`Dr. ${(rec as any)._doctor.name}`} />
                  {(rec as any)._doctor.specialization && (
                    <InfoRow label="Specialization" value={(rec as any)._doctor.specialization} />
                  )}
                  {(rec as any)._doctor.phone && (
                    <InfoRow label="Phone" value={(rec as any)._doctor.phone} />
                  )}
                  {(rec as any)._doctor.clinic_name && (
                    <InfoRow label="Clinic" value={(rec as any)._doctor.clinic_name} />
                  )}
                  {(rec as any)._doctor.clinic_registration_number && (
                    <InfoRow label="Reg No" value={(rec as any)._doctor.clinic_registration_number} />
                  )}
                </SectionCard>
              ) : rec.doctor_id ? (
                <SectionCard title="Doctor" icon="medical">
                  <InfoRow label="Doctor ID" value={rec.doctor_id} />
                </SectionCard>
              ) : null}

              {/* Chief Complaint */}
              {rec.chief_complaint && (
                <SectionCard title="Chief Complaint" icon="chatbubble-ellipses">
                  <Text style={styles.complaintText}>{rec.chief_complaint}</Text>
                </SectionCard>
              )}

              {/* Medical History */}
              {rec.medical_history && (
                <SectionCard title="Medical History" icon="heart">
                  <Text style={styles.historyText}>{rec.medical_history}</Text>
                </SectionCard>
              )}

              {/* Dental History */}
              {rec.dental_history && (
                <SectionCard title="Dental History" icon="fitness">
                  <Text style={styles.historyText}>{rec.dental_history}</Text>
                </SectionCard>
              )}

              {/* Allergies / Habits */}
              {(rec.allergies || rec.habits) && (
                <SectionCard title="Allergies / Habits" icon="warning">
                  <InfoRow label="Allergies" value={rec.allergies || 'None'} />
                  <InfoRow label="Habits" value={rec.habits || 'None'} />
                </SectionCard>
              )}

              {/* Treatment Plan */}
              {rec.treatment_plan && (
                <SectionCard title="Treatment Plan" icon="clipboard">
                  {rec.treatment_plan.split('\n').map((line, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.bulletText}>{line}</Text>
                    </View>
                  ))}
                </SectionCard>
              )}

              {/* Procedures */}
              {rec.procedures && rec.procedures.length > 0 && (
                <SectionCard title="Procedures" icon="bandage">
                  {rec.procedures.map((proc, index) => (
                    <View key={index} style={styles.procedureRow}>
                      <View style={styles.procedureDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.procedureTooth}>Tooth {proc.tooth}</Text>
                        <Text style={styles.procedureName}>{proc.procedure_name}</Text>
                        {proc.notes && <Text style={styles.procedureNotes}>{proc.notes}</Text>}
                      </View>
                    </View>
                  ))}
                </SectionCard>
              )}

              {/* Financial Details */}
              {rec.payment && (
                <SectionCard title="Payment" icon="cash">
                  <InfoRow label="Total" value={`Rs.${rec.payment.total_amount.toLocaleString()}`} valueStyle={{ fontWeight: '700' }} />
                  <InfoRow label="Paid" value={`Rs.${rec.payment.paid_amount.toLocaleString()}`} valueStyle={{ color: '#34C759', fontWeight: '600' }} />
                  <InfoRow label="Balance" value={`Rs.${rec.payment.balance.toLocaleString()}`} valueStyle={{ color: '#FF9500', fontWeight: '600' }} />
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Status</Text>
                    <View style={[styles.statusBadge, rec.payment.status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
                      <Text style={[styles.statusText, rec.payment.status === 'Paid' ? styles.statusTextPaid : styles.statusTextPending]}>
                        {rec.payment.status}
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              )}

              {/* Next Follow-up */}
              {(rec as any).next_follow_up && (
                <SectionCard title="Next Follow-up" icon="calendar">
                  <InfoRow label="Follow-up Date" value={(rec as any).next_follow_up} />
                </SectionCard>
              )}

              {/* Notes */}
              {(rec as any).notes && (
                <SectionCard title="Notes" icon="document-text">
                  <Text style={styles.historyText}>{(rec as any).notes}</Text>
                </SectionCard>
              )}
            </View>
          ))
        )}

        {/* Documents */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Documents', { patientId: patient.id, patientName: patient.name })}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {documents.slice(0, 3).map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={styles.docCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Documents', { patientId: patient.id, patientName: patient.name })}
          >
            <View style={styles.docIconWrap}>
              <Ionicons
                name={doc.category === 'X-Rays' ? 'flash' : doc.category === 'Treatment Plans' ? 'clipboard' : doc.category === 'Receipts' ? 'receipt' : 'document-text'}
                size={20}
                color="#007AFF"
              />
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>{doc.title}</Text>
              <Text style={styles.docSubtitle}>{doc.type} • {doc.date}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addDocBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Documents', { patientId: patient.id, patientName: patient.name })}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.addDocText}>View All Documents</Text>
        </TouchableOpacity>

        {/* Export Button */}
        <PrimaryButton
          title="Export Complete PDF"
          icon="document-text"
          onPress={handleExportPDF}
          variant="outline"
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1.5,
    textAlign: 'right',
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
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  patientHeaderInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 13,
    color: '#8E8E93',
  },
  complaintText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  historyText: {
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  bulletText: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  procedureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  procedureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  procedureTooth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  procedureName: {
    fontSize: 14,
    color: '#636366',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636366',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  docSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  addDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F7FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#B3D7FF',
    gap: 8,
  },
  addDocText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  sectionTitleLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    marginTop: 8,
  },
  recordBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  recordDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyRecords: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  emptyRecordsText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  procedureNotes: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
