import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import PatientCard from '../components/PatientCard';
import { getPatients, getAllRecords, BackendPatient } from '../services/api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [patients, setPatients] = useState<BackendPatient[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);

      Promise.all([getPatients(), getAllRecords()])
        .then(([p, recs]) => {
          if (active) {
            setPatients(p);
            setTotalRecords(recs.length);
          }
        })
        .catch((e) => {
          if (active) setError(e.message || 'Unable to load data. Check that the backend is running.');
        })
        .finally(() => { if (active) setLoading(false); });

      return () => { active = false; };
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setError(null); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.headerTitle}>DentalCare Records</Text>
            <Text style={styles.headerSubtitle}>Dental record management</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>
          Manage your dental records securely and efficiently.
        </Text>

        {/* Scan New Record Card */}
        <TouchableOpacity
          style={styles.scanCard}
          onPress={() => navigation.navigate('Scan')}
          activeOpacity={0.7}
        >
          <View style={styles.scanIconWrap}>
            <Ionicons name="scan-outline" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.scanInfo}>
            <Text style={styles.scanTitle}>Scan New Record</Text>
            <Text style={styles.scanSubtitle}>
              Capture a dental record and extract patient information.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Upload Document */}
        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => navigation.navigate('Scan')}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={22} color="#007AFF" />
          <Text style={styles.uploadText}>Upload Document</Text>
        </TouchableOpacity>

        {/* Statistics */}
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsRow}>
          {[
            { label: 'Total Patients', value: String(patients.length), icon: 'people' as const, color: '#007AFF' },
            { label: 'Total Records', value: String(totalRecords), icon: 'document-text' as const, color: '#34C759' },
            { label: 'Patients Listed', value: String(patients.length), icon: 'folder' as const, color: '#FF9500' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Scan')} activeOpacity={0.7}>
            <View style={[styles.quickIcon, { backgroundColor: '#007AFF15' }]}>
              <Ionicons name="camera" size={22} color="#007AFF" />
            </View>
            <Text style={styles.quickLabel}>Scan Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Patients')} activeOpacity={0.7}>
            <View style={[styles.quickIcon, { backgroundColor: '#34C75915' }]}>
              <Ionicons name="people" size={22} color="#34C759" />
            </View>
            <Text style={styles.quickLabel}>Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              if (patients.length > 0) {
                navigation.navigate('Documents', { patientId: patients[0].id, patientName: 'All Documents' });
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#FF950015' }]}>
              <Ionicons name="folder-open" size={22} color="#FF9500" />
            </View>
            <Text style={styles.quickLabel}>Documents</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Patients */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Patients</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Patients')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {patients.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No patients yet</Text>
          </View>
        ) : (
          patients.slice(0, 10).map((patient) => (
            <PatientCard
              key={patient.id}
              id={patient.id}
              name={patient.name}
              age={patient.age ?? 0}
              gender={patient.gender ?? ''}
              phone={patient.phone ?? ''}
              lastVisit={patient.updated_at ? new Date(patient.updated_at).toLocaleDateString() : ''}
              recordCount={patient.record_count ?? 0}
              onPress={() => navigation.navigate('PatientDetails', { patientId: patient.id })}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color="#007AFF" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Patients')} activeOpacity={0.7}>
          <Ionicons name="people-outline" size={24} color="#8E8E93" />
          <Text style={styles.navLabel}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Scan')} activeOpacity={0.7}>
          <Ionicons name="scan-outline" size={24} color="#8E8E93" />
          <Text style={styles.navLabel}>Scan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 14, color: '#8E8E93', marginTop: 12 },
  errorText: { fontSize: 14, color: '#FF3B30', marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  greeting: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  profileIcon: { padding: 4 },
  sectionLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 16, lineHeight: 20 },
  scanCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  scanIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scanInfo: { flex: 1 },
  scanTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  scanSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  uploadCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5EA', gap: 8 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#8E8E93', textAlign: 'center' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickAction: { flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E5EA' },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#8E8E93', marginTop: 8 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingVertical: 8, paddingBottom: 20 },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 11, color: '#8E8E93' },
  navLabelActive: { color: '#007AFF', fontWeight: '600' },
});
