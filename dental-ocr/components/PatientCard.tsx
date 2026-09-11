import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PatientCardProps {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  lastVisit: string;
  recordCount: number;
  onPress: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    '#007AFF',
    '#34C759',
    '#FF9500',
    '#FF2D55',
    '#5856D6',
    '#AF52DE',
    '#00C7BE',
    '#FF6482',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function PatientCard({
  name,
  age,
  gender,
  phone,
  lastVisit,
  recordCount,
  onPress,
}: PatientCardProps) {
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(name);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>
          {age} • {gender}
        </Text>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={13} color="#8E8E93" />
          <Text style={styles.detailText}>{phone}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.lastVisit}>{lastVisit}</Text>
        <View style={styles.recordBadge}>
          <Text style={styles.recordText}>
            {recordCount} {recordCount === 1 ? 'record' : 'records'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  lastVisit: {
    fontSize: 12,
    color: '#8E8E93',
  },
  recordBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recordText: {
    fontSize: 11,
    color: '#636366',
    fontWeight: '500',
  },
});
