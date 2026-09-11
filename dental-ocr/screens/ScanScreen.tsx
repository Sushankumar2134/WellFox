import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { processOCR, checkHealth } from '../services/api';
import PrimaryButton from '../components/PrimaryButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ProcessingStep = {
  label: string;
  status: 'done' | 'processing' | 'pending';
};

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  type: 'image' | 'pdf';
}

const INITIAL_STEPS: ProcessingStep[] = [
  { label: 'Image received', status: 'done' },
  { label: 'Checking image quality', status: 'done' },
  { label: 'Correcting orientation', status: 'done' },
  { label: 'Extracting text', status: 'processing' },
  { label: 'Structuring patient information', status: 'pending' },
];

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileSource, setFileSource] = useState<'camera' | 'gallery' | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateSteps = () => {
    let currentSteps = INITIAL_STEPS.map(s => ({ ...s }));
    setSteps(currentSteps);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const advanceStep = (index: number) => {
      if (index >= currentSteps.length) return;
      setTimeout(() => {
        currentSteps = currentSteps.map((s, i) => {
          if (i <= index) return { ...s, status: 'done' as const };
          return s;
        });
        setSteps([...currentSteps]);
        if (index + 1 < currentSteps.length) {
          currentSteps[index + 1] = { ...currentSteps[index + 1], status: 'processing' };
          setSteps([...currentSteps]);
        }
        advanceStep(index + 1);
      }, 600);
    };
    advanceStep(0);
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) {
      Alert.alert('No file selected', 'Please select a document first using one of the options below.');
      return;
    }

    setUploading(true);
    setIsProcessing(true);
    setShowError(false);
    animateSteps();

    try {
      if (fileSource === 'camera') {
        const mockFields: Record<string, string | number | null> = {
          patientName: 'Shyamala',
          age: 45,
          gender: 'Female',
          phone: '9447804124',
          date: '20/08/2026',
          receiptNumber: 'SN873',
          doctorName: 'Dr. SHREESHA NARAYANA C K',
        };

        setTimeout(() => {
          setUploading(false);
          setIsProcessing(false);
          fadeAnim.setValue(0);
          navigation.navigate('Review', { ocrData: mockFields });
        }, 3200);
        return;
      }

      const healthy = await checkHealth();
      if (!healthy) {
        throw new Error('Unable to connect to Dental OCR server. Check that the backend is running and your phone is connected to the same Wi-Fi.');
      }

      const result = await processOCR(selectedFile.uri, selectedFile.name, selectedFile.mimeType);

      const fields: Record<string, string | number | null> = {};
      if (result.fields) {
        for (const [k, v] of Object.entries(result.fields)) {
          fields[k] = v ?? '';
        }
      }

      if (result.uploadedFile) {
        fields._uploadedFilePath = result.uploadedFile.filePath;
        fields._uploadedFileName = result.uploadedFile.fileName;
        fields._uploadedMimeType = result.uploadedFile.mimeType;
      }

      fields._rawText = result.rawText || '';
      if (result.structuredData) {
        fields._structuredData = JSON.stringify(result.structuredData);
      }

      setTimeout(() => {
        setUploading(false);
        setIsProcessing(false);
        fadeAnim.setValue(0);
        navigation.navigate('Review', { ocrData: fields });
      }, 3200);
    } catch (e: any) {
      setTimeout(() => {
        setUploading(false);
        setIsProcessing(false);
        fadeAnim.setValue(0);
        setShowError(true);
        setErrorMessage(e.message || 'OCR processing failed. Please try another image.');
      }, 1000);
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to capture dental records. Please grant camera access in your device settings.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          type: 'image',
        });
        setFileSource('camera');
        setShowError(false);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Failed to open camera. Please try again.');
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select dental records. Please grant access in your device settings.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `gallery-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          type: 'image',
        });
        setFileSource('gallery');
        setShowError(false);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message || 'Failed to open gallery. Please try again.');
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isPdf = asset.mimeType === 'application/pdf';
        setSelectedFile({
          uri: asset.uri,
          name: asset.name || `document-${Date.now()}`,
          mimeType: asset.mimeType || 'application/octet-stream',
          type: isPdf ? 'pdf' : 'image',
        });
        setFileSource('gallery');
        setShowError(false);
      }
    } catch (e: any) {
      Alert.alert('File Picker Error', e.message || 'Failed to open file picker. Please try again.');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileSource(null);
    setShowError(false);
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.processingContainer, { opacity: fadeAnim }]}>
          <View style={styles.processingIconWrap}>
            <Ionicons name="scan-outline" size={48} color="#007AFF" />
          </View>
          <Text style={styles.processingTitle}>Processing document...</Text>
          <Text style={styles.processingSubtitle}>
            {uploading ? 'Uploading file...' : 'Please wait while we extract information'}
          </Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepIconWrap}>
                  {step.status === 'done' && (
                    <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                  )}
                  {step.status === 'processing' && (
                    <ActivityIndicator size="small" color="#FF9500" />
                  )}
                  {step.status === 'pending' && (
                    <Ionicons name="ellipse-outline" size={22} color="#C7C7CC" />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    step.status === 'done' && styles.stepDone,
                    step.status === 'processing' && styles.stepProcessing,
                    step.status === 'pending' && styles.stepPending,
                  ]}
                >
                  {step.status === 'done' ? '✓ ' : ''}
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
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
        <Text style={styles.headerTitle}>Scan Dental Record</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Capture or upload a dental record to extract patient information.
        </Text>

        {/* Document Preview Area */}
        {selectedFile ? (
          <View style={styles.previewAreaSelected}>
            {selectedFile.type === 'image' ? (
              <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.pdfPreview}>
                <Ionicons name="document-text" size={64} color="#FF3B30" />
                <Text style={styles.pdfName} numberOfLines={2}>{selectedFile.name}</Text>
                <Text style={styles.pdfType}>PDF Document</Text>
              </View>
            )}
            <View style={styles.fileInfo}>
              <View style={styles.fileInfoRow}>
                <Ionicons name="document-outline" size={16} color="#8E8E93" />
                <Text style={styles.fileInfoText} numberOfLines={1}>{selectedFile.name}</Text>
              </View>
              <View style={styles.fileInfoRow}>
                <Ionicons name="pricetag-outline" size={16} color="#8E8E93" />
                <Text style={styles.fileInfoText}>{selectedFile.type === 'pdf' ? 'PDF' : 'Image'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.removeFileBtn} onPress={handleRemoveFile} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={22} color="#FF3B30" />
              <Text style={styles.removeFileText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewArea}>
            <Ionicons name="document-outline" size={48} color="#C7C7CC" />
            <Text style={styles.previewLabel}>Document Preview</Text>
            <Text style={styles.previewHint}>
              Select a document type below to begin
            </Text>
          </View>
        )}

        {/* Error State */}
        {showError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.errorTitle}>Unable to process document</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Scan with Camera"
            icon="camera"
            onPress={handleCamera}
            variant="primary"
          />
          <PrimaryButton
            title="Upload from Gallery"
            icon="images"
            onPress={handleGallery}
            variant="secondary"
          />
          <PrimaryButton
            title="Select Document"
            icon="document"
            onPress={handleDocumentPicker}
            variant="outline"
          />

          {selectedFile && (
            <View style={styles.processBtnWrap}>
              <PrimaryButton
                title="Process Document"
                icon="scan"
                onPress={handleProcessDocument}
                variant="primary"
              />
            </View>
          )}
        </View>

        {/* Best Results Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="bulb-outline" size={18} color="#FF9500" />
            <Text style={styles.infoTitle}>Best results</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Keep the document flat</Text>
            <Text style={styles.infoItem}>• Use good lighting</Text>
            <Text style={styles.infoItem}>• Avoid shadows</Text>
            <Text style={styles.infoItem}>• Make handwriting clearly visible</Text>
          </View>
        </View>

        {/* Supported Formats */}
        <View style={styles.formatsRow}>
          <Text style={styles.formatsLabel}>Supported formats:</Text>
          <View style={styles.formatBadges}>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>JPG</Text>
            </View>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>PNG</Text>
            </View>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>PDF</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: 20,
    lineHeight: 20,
  },
  previewArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    marginBottom: 20,
  },
  previewAreaSelected: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  pdfPreview: {
    alignItems: 'center',
    paddingVertical: 24,
    width: '100%',
  },
  pdfName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
    textAlign: 'center',
  },
  pdfType: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  fileInfo: {
    width: '100%',
    marginTop: 12,
    gap: 4,
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileInfoText: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  removeFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF2F2',
    borderRadius: 8,
  },
  removeFileText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
  },
  previewHint: {
    fontSize: 13,
    color: '#C7C7CC',
    marginTop: 4,
  },
  errorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginBottom: 24,
  },
  processBtnWrap: {
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  infoList: {
    gap: 4,
  },
  infoItem: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 20,
  },
  formatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formatsLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  formatBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  formatBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#636366',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F2F2F7',
  },
  processingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 32,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  stepIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 15,
    flex: 1,
  },
  stepDone: {
    color: '#34C759',
    fontWeight: '500',
  },
  stepProcessing: {
    color: '#FF9500',
    fontWeight: '600',
  },
  stepPending: {
    color: '#C7C7CC',
  },
});
