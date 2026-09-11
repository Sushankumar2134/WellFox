import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import { getAllDocuments, getPatientDocuments, BackendDocument, deleteDocument } from '../services/api';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Documents'>;
type DocsRoute = RouteProp<RootStackParamList, 'Documents'>;

const CATEGORIES = ['All', 'Dental Records', 'X-Rays', 'Treatment Plans', 'Receipts'] as const;

const categoryColors: Record<string, string> = {
  'Dental Records': '#007AFF',
  'X-Rays': '#FF9500',
  'Treatment Plans': '#34C759',
  Receipts: '#AF52DE',
  Other: '#8E8E93',
};

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Dental Records': 'document-text',
  'X-Rays': 'flash',
  'Treatment Plans': 'clipboard',
  Receipts: 'receipt',
  Other: 'folder',
};

export default function DocumentsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DocsRoute>();
  const { patientId, patientName } = route.params;

  const showAll = patientName === 'All Documents';
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [allDocs, setAllDocs] = useState<BackendDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);

      const fetchDocs = showAll ? getAllDocuments() : getPatientDocuments(patientId);
      fetchDocs
        .then((docs) => {
          if (active) setAllDocs(docs);
        })
        .catch((e) => {
          if (active) setError(e.message || 'Unable to load documents. Check your connection and try again.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, [patientId, showAll])
  );

  const searchLower = search.toLowerCase();
  const filteredDocs = allDocs.filter((d) => {
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesSearch = !search ||
      d.title.toLowerCase().includes(searchLower) ||
      (d.patient_name || '').toLowerCase().includes(searchLower) ||
      d.patient_id.toLowerCase().includes(searchLower) ||
      (d.category || '').toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: string) => {
    if (category === 'All') return allDocs.length;
    return allDocs.filter((d) => d.category === category).length;
  };

  const handleDelete = (docId: string, docTitle: string) => {
    Alert.alert('Delete Document', `Are you sure you want to delete "${docTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(docId);
            setAllDocs((prev) => prev.filter((d) => d.id !== docId));
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete document');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BackendDocument }) => {
    const color = categoryColors[item.category || 'Other'] || '#8E8E93';
    const icon = categoryIcons[item.category || 'Other'] || 'folder';
    const isPdf = item.type === 'PDF';

    return (
      <TouchableOpacity
        style={styles.docCard}
        onPress={() => navigation.navigate('DocumentPreview', { documentId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.docIconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={isPdf ? 'document-text' : icon} size={22} color={color} />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
          {item.patient_name && (
            <Text style={styles.docPatient} numberOfLines={1}>{item.patient_name} • {item.patient_id}</Text>
          )}
          <Text style={styles.docMeta} numberOfLines={1}>{item.type || 'Document'} • {item.category || 'Other'}</Text>
          <Text style={styles.docDate}>{item.date}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            handleDelete(item.id, item.title);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.subtitle}>
          {showAll ? 'All Documents' : patientName} • {filteredDocs.length} documents
        </Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            placeholderTextColor="#C7C7CC"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters - Horizontal ScrollView */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          style={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                {cat !== 'All' && (
                  <Ionicons
                    name={categoryIcons[cat] || 'folder'}
                    size={14}
                    color={isActive ? '#FFFFFF' : '#636366'}
                  />
                )}
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{cat}</Text>
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={48} color="#FF3B30" />
            <Text style={styles.errorTitle}>Unable to load documents</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setLoading(true);
                setError(null);
                const fetchDocs = showAll ? getAllDocuments() : getPatientDocuments(patientId);
                fetchDocs
                  .then((docs) => setAllDocs(docs))
                  .catch((e) => setError(e.message || 'Failed to load'))
                  .finally(() => setLoading(false));
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDocs.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="folder-open-outline" size={56} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No documents found</Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Try a different search term'
                : selectedCategory === 'All'
                  ? 'No documents uploaded yet'
                  : `No ${selectedCategory.toLowerCase()} documents`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDocs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, paddingHorizontal: 16 },
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
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  subtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1C1C1E' },
  clearBtn: { padding: 4 },
  filterScroll: { marginBottom: 4 },
  filterList: { paddingRight: 16, gap: 8, paddingVertical: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
    marginRight: 0,
  },
  filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterText: { fontSize: 13, color: '#636366', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  countBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  countText: { fontSize: 11, fontWeight: '700', color: '#636366' },
  countTextActive: { color: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  loadingText: { fontSize: 14, color: '#8E8E93', marginTop: 12 },
  errorTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E', marginTop: 12 },
  errorText: { fontSize: 14, color: '#8E8E93', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#8E8E93', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#C7C7CC', marginTop: 6, textAlign: 'center' },
  listContent: { paddingBottom: 100, paddingTop: 4 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  docIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docInfo: { flex: 1, minWidth: 0 },
  docTitle: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  docPatient: { fontSize: 12, color: '#007AFF', fontWeight: '500', marginBottom: 2 },
  docMeta: { fontSize: 12, color: '#8E8E93', marginBottom: 2 },
  docDate: { fontSize: 11, color: '#C7C7CC' },
  deleteBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFF2F2',
    marginLeft: 8,
  },
});
