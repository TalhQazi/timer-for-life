import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/src/utils/constants';

interface FABProps {
  onPress: () => void;
}

const FAB: React.FC<FABProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.fabText}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 55,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 10,
  },
  fabText: {
    fontSize: 32,
    color: COLORS.text,
    lineHeight: 32,
    fontWeight: '300',
  },
});

export default FAB;
