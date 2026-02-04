import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Modal } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, URGENCY_THRESHOLDS } from '@/src/utils/constants';
import { useAuth } from '@/src/contexts/AuthContext';
import timerService from '@/src/services/timerService';
import notificationService from '@/src/services/notificationService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32) / 2;

function calculateDaysRemaining(lastResetTimestamp: number, intervalDays: number) {
  if (!lastResetTimestamp || !intervalDays) return 0;
  const now = Date.now();
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const nextExpirationTimestamp = lastResetTimestamp + intervalMs;
  const differenceMs = nextExpirationTimestamp - now;
  const daysRemaining = Math.ceil(differenceMs / (24 * 60 * 60 * 1000));
  return Math.max(0, daysRemaining);
}

const ProgressRing = ({ progress, color, radius, strokeWidth }: { progress: number; color: string; radius: number; strokeWidth: number; }) => {
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;
  const CENTER = radius + strokeWidth / 2;
  const RING_SIZE = 2 * CENTER;
  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle stroke={color} fill="none" cx={CENTER} cy={CENTER} r={radius} strokeWidth={strokeWidth} opacity={0.15} />
        <Circle stroke={color} fill="none" cx={CENTER} cy={CENTER} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${CENTER} ${CENTER})`} />
      </Svg>
    </View>
  );
};

export default function TimerCard({ timer, onTimerUpdate }: { timer: any; onTimerUpdate: () => void }) {
  const { isAuthenticated } = useAuth();
  const { name, icon, daysRemaining, intervalDays, lastResetTimestamp, id, category } = timer;
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const checkAndAutoReset = async () => {
      const now = Date.now();
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      const nextResetTime = lastResetTimestamp + intervalMs;
      if (now >= nextResetTime) {
        await handleAutoReset();
      }
    };
    checkAndAutoReset();
  }, [lastResetTimestamp, intervalDays]);

  // Tick every minute to smoothly update the ring progress
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const { ringColor, progress, timeDisplay, isExpired } = useMemo(() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const dueAt = lastResetTimestamp + intervalDays * DAY_MS;
    const remainingMs = Math.max(0, dueAt - nowTs);
    const days = Math.ceil(remainingMs / DAY_MS);
    const elapsedRatio = Math.min(1, Math.max(0, 1 - remainingMs / (intervalDays * DAY_MS)));

    let color = COLORS.safe;
    let expired = nowTs >= dueAt;
    if (expired || days === 0) { color = COLORS.danger; }
    else if (days <= URGENCY_THRESHOLDS.RED_THRESHOLD) { color = COLORS.danger; }
    else if (days <= URGENCY_THRESHOLDS.YELLOW_THRESHOLD) { color = COLORS.warning; }

    let display = `${Math.max(0, days)} day${days !== 1 ? 's' : ''}`;
    if (intervalDays >= 60 && days > 30) display = `${Math.round(days / 30)} mo.`;
    if (expired) display = 'Time to reset!';

    return { ringColor: color, progress: elapsedRatio, timeDisplay: display, isExpired: expired };
  }, [nowTs, intervalDays, lastResetTimestamp]);

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert('Delete Timer', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const result = await timerService.deleteTimer(id);
            if (result.success) {
              await notificationService.cancelTimerNotifications(id, isAuthenticated);
              onTimerUpdate && onTimerUpdate();
            } else {
              Alert.alert('Error', result.message);
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to delete timer');
          }
        }
      }
    ]);
  };

  const handleManualReset = async () => {
    setMenuVisible(false);
    try {
      const result = await timerService.resetTimer(id, Date.now());
      if (result.success) {
        await notificationService.cancelTimerNotifications(id, isAuthenticated);
        const resetTimer = { ...timer, lastResetTimestamp: Date.now(), daysRemaining: intervalDays };
        await notificationService.scheduleTimerNotification(resetTimer, isAuthenticated);
        await notificationService.notifyTimerReset(resetTimer, isAuthenticated);
        onTimerUpdate && onTimerUpdate();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reset timer');
    }
  };

  const handleAutoReset = async () => {
    try {
      const now = Date.now();
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      const timePassed = now - lastResetTimestamp;
      const intervalsPassed = Math.floor(timePassed / intervalMs);
      const newLastResetTimestamp = lastResetTimestamp + intervalsPassed * intervalMs;
      const result = await timerService.resetTimer(id, newLastResetTimestamp);
      if (result.success) {
        await notificationService.cancelTimerNotifications(id, isAuthenticated);
        const autoResetTimer = { ...timer, lastResetTimestamp: newLastResetTimestamp, daysRemaining: calculateDaysRemaining(newLastResetTimestamp, intervalDays) };
        await notificationService.scheduleTimerNotification(autoResetTimer, isAuthenticated);
        onTimerUpdate && onTimerUpdate();
      }
    } catch {}
  };

  const STROKE_WIDTH = 8;
  const RING_RADIUS = CARD_WIDTH / 2 - STROKE_WIDTH;
  const ICON_FIX: Record<string, string> = {
    running: 'run',
    skincare: 'face-woman',
    towel: 'paper-roll-outline',
    pillow: 'sleep',
    yoga: 'meditation',
  };
  const iconName = ICON_FIX[icon] || icon || 'timer-sand';

  return (
    <>
      <View style={styles.cardWrapper}>
        <View style={styles.cardContent}>
          <ProgressRing progress={progress} color={ringColor} radius={RING_RADIUS} strokeWidth={STROKE_WIDTH} />

          <TouchableOpacity style={styles.optionsButton} onPress={() => setMenuVisible(true)}>
            <MaterialCommunityIcons name="dots-vertical" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.innerContent}>
            <MaterialCommunityIcons name={iconName as any} size={48} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.taskName} numberOfLines={2}>{name}</Text>
            <Text style={[styles.daysRemaining, { color: ringColor }]}>{timeDisplay}</Text>

            {(isExpired || daysRemaining <= URGENCY_THRESHOLDS.RED_THRESHOLD) && (
              <TouchableOpacity style={[styles.resetButton, isExpired && styles.expiredResetButton]} onPress={handleManualReset}>
                <MaterialCommunityIcons name="refresh" size={14} color="#FFFFFF" style={styles.resetIcon} />
                <Text style={styles.resetButtonText}>{isExpired ? 'Reset Now' : 'Reset Early'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setViewModalVisible(true)}>
              <MaterialCommunityIcons name="eye" size={20} color={COLORS.primary} />
              <Text style={styles.menuText}>View Details</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleManualReset}>
              <MaterialCommunityIcons name="refresh" size={20} color={COLORS.warning} />
              <Text style={styles.menuText}>Reset Timer</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
              <MaterialCommunityIcons name="delete" size={20} color={COLORS.danger} />
              <Text style={styles.menuText}>Delete Timer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={viewModalVisible} animationType="slide" transparent onRequestClose={() => setViewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timer Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.detailRow}><MaterialCommunityIcons name="label" size={20} color={COLORS.textSecondary} /><Text style={styles.detailValue}>{name}</Text></View>
              <View style={styles.detailRow}><MaterialCommunityIcons name="folder" size={20} color={COLORS.textSecondary} /><Text style={styles.detailValue}>{category}</Text></View>
              <View style={styles.detailRow}><MaterialCommunityIcons name="timer" size={20} color={COLORS.textSecondary} /><Text style={[styles.detailValue, { color: ringColor }]}>{timeDisplay}</Text></View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { width: CARD_WIDTH, height: CARD_WIDTH, marginHorizontal: 4, marginVertical: 6, borderRadius: 16, backgroundColor: COLORS.card, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 5 },
  cardContent: { flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden' },
  optionsButton: { position: 'absolute', top: 8, right: 8, zIndex: 10, padding: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  innerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 16 },
  icon: { marginBottom: 8 },
  taskName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  daysRemaining: { fontSize: 16, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, marginTop: 4 },
  resetButton: { backgroundColor: COLORS.warning, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 6 },
  expiredResetButton: { backgroundColor: COLORS.danger },
  resetIcon: { marginRight: 4 },
  resetButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: { position: 'absolute', backgroundColor: COLORS.card, borderRadius: 12, padding: 8, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, width: 200, right: 16, top: 48 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  menuText: { color: COLORS.text, fontSize: 15, marginLeft: 12, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 20, width: '100%', maxHeight: '80%', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalBody: { padding: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailValue: { marginLeft: 12, color: COLORS.text, fontSize: 16, fontWeight: '600' },
});
