import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../App';
import { getDocument, BackendDocument } from '../services/api';
import { API_HOST } from '../services/config';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DocumentPreview'>;
type DocPreviewRoute = RouteProp<RootStackParamList, 'DocumentPreview'>;

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

export default function DocumentPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DocPreviewRoute>();
  const { documentId } = route.params;

  const [doc, setDoc] = useState<BackendDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      setLoading(true);
      setError(null);

      getDocument(documentId)
        .then((d) => { if (active) setDoc(d); })
        .catch((e) => { if (active) setError(e.message || 'Failed to load document'); })
        .finally(() => { if (active) setLoading(false); });

      return () => { active = false; };
    }, [documentId])
  );

  const handleShare = async () => {
    if (!doc) return;
    try {
      await Share.share({
        message: `${doc.title} - ${doc.patient_name || doc.patient_id} (${doc.type || 'Document'}, ${doc.category || 'Other'})`,
        title: doc.title,
      });
    } catch {}
  };

  const handleOpenFile = () => {
    if (!doc) return;
    if (doc.file_path) {
      const fileUrl = `${API_HOST}/uploads/${doc.file_path.split('/').pop()}`;
      Alert.alert('Open Document', `File URL:\n${fileUrl}\n\nOpen this URL in a browser to view the file.`);
    } else {
      Alert.alert(
        'No File Available',
        `This document ("${doc.title}") is a record entry without an attached file.\n\nTo add a file, use the Scan screen to upload a document.`
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !doc) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={56} color="#FF3B30" />
          <Text style={styles.errorTitle}>Unable to load document</Text>
          <Text style={styles.errorText}>{error || 'Document not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const color = categoryColors[doc.category || 'Other'] || '#8E8E93';
  const icon = categoryIcons[doc.category || 'Other'] || 'folder';
  const isPdf = doc.type === 'PDF';
  const isImage = doc.type === 'Image';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Preview</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Icon */}
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={40} color={color} />
          </View>
          <Text style={styles.docTitle}>{doc.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{doc.type || 'Document'}</Text>
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoSectionTitle}>Document Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="person-outline" size={18} color="#007AFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Patient</Text>
              <Text style={styles.infoValue}>{doc.patient_name || 'Unknown Patient'}</Text>
              <Text style={styles.infoSub}>{doc.patient_id}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{doc.category || 'Other'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="document-outline" size={18} color="#8E8E93" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>File Type</Text>
              <Text style={styles.infoValue}>{doc.type || 'Unknown'}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar-outline" size={18} color="#34C759" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{doc.date}</Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="finger-print-outline" size={18} color="#AF52DE" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Document ID</Text>
              <Text style={styles.infoValue}>{doc.id}</Text>
            </View>
          </View>

          {doc.record_id && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="link-outline" size={18} color="#FF9500" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Linked Record</Text>
                  <Text style={styles.infoValue}>{doc.record_id}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Preview Area */}
        <View style={styles.previewCard}>
          <Text style={styles.infoSectionTitle}>Preview</Text>
          <View style={styles.previewArea}>
            {isPdf ? (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="document-text-outline" size={64} color={color} />
                <Text style={styles.previewLabel}>PDF Document</Text>
                <Text style={styles.previewSubLabel}>{doc.title}</Text>
                <TouchableOpacity style={styles.openFileBtn} onPress={handleOpenFile} activeOpacity={0.7}>
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.openFileText}>Open Document</Text>
                </TouchableOpacity>
              </View>
            ) : isImage ? (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="image-outline" size={64} color={color} />
                <Text style={styles.previewLabel}>Image Document</Text>
                <Text style={styles.previewSubLabel}>{doc.title}</Text>
                <TouchableOpacity style={styles.openFileBtn} onPress={handleOpenFile} activeOpacity={0.7}>
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.openFileText}>View Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="folder-open-outline" size={64} color="#C7C7CC" />
                <Text style={styles.previewLabel}>Document</Text>
                <Text style={styles.previewSubLabel}>{doc.title}</Text>
                <TouchableOpacity style={styles.openFileBtn} onPress={handleOpenFile} activeOpacity={0.7}>
                  <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.openFileText}>Open Document</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleOpenFile} activeOpacity={0.7}>
            <Ionicons name="open-outline" size={20} color="#007AFF" />
            <Text style={[styles.actionText, { color: '#007AFF' }]}>Open Document</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={20} color="#34C759" />
            <Text style={[styles.actionText, { color: '#34C759' }]}>Share</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              Alert.alert(
                'Delete Document',
                `Are you sure you want to delete "${doc.title}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const { deleteDocument } = await import('../services/api');
                        await deleteDocument(doc.id);
                        navigation.goBack();
                      } catch (e: any) {
                        Alert.alert('Error', e.message || 'Failed to delete');
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F2F2F7' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  shareBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 14, color: '#8E8E93', marginTop: 12 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 12 },
  errorText: { fontSize: 14, color: '#8E8E93', marginTop: 6, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  iconSection: { alignItems: 'center', paddingVertical: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  docTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', textAlign: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText: { fontSize: 13, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  infoSectionTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 1 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  infoSub: { fontSize: 13, color: '#8E8E93' },
  infoDivider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 4 },
  previewCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  previewArea: { borderRadius: 12, overflow: 'hidden' },
  previewPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#F8F9FA' },
  previewLabel: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginTop: 12 },
  previewSubLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4, marginBottom: 16 },
  openFileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, gap: 6 },
  openFileText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  actionsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  actionText: { fontSize: 15, fontWeight: '600' },
  actionDivider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 48 },
});
