import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from './screens/DashboardScreen';
import ScanScreen from './screens/ScanScreen';
import ReviewScreen from './screens/ReviewScreen';
import PatientsScreen from './screens/PatientsScreen';
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import DocumentPreviewScreen from './screens/DocumentPreviewScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Scan: undefined;
  Review: { ocrData?: Record<string, string | number | null> };
  Patients: undefined;
  PatientDetails: { patientId: string };
  Documents: { patientId: string; patientName: string };
  DocumentPreview: { documentId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F2F2F7' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="Patients" component={PatientsScreen} />
          <Stack.Screen
            name="PatientDetails"
            component={PatientDetailsScreen}
          />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="DocumentPreview" component={DocumentPreviewScreen} />
        </Stack.Navigator>
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
