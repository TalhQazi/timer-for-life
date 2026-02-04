import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/utils/constants';
import { useAuth } from '@/src/contexts/AuthContext';
import timerService from '@/src/services/timerService';
import notificationService from '@/src/services/notificationService';
import { router, useLocalSearchParams } from 'expo-router';

const categories = [
  { label: 'Bathroom', value: 'Bathroom', icon: 'shower-head' },
  { label: 'Bedroom', value: 'Bedroom', icon: 'bed-empty' },
  { label: 'Kitchen', value: 'Kitchen', icon: 'silverware-fork-knife' },
  { label: 'Car', value: 'Car', icon: 'car-side' },
  { label: 'Office', value: 'Office', icon: 'office-building' },
  { label: 'Finance', value: 'Finance', icon: 'cash-multiple' },
  { label: 'Health', value: 'Health', icon: 'heart-pulse' },
  { label: 'Garden', value: 'Garden', icon: 'flower' },
  { label: 'Pet Care', value: 'Pet Care', icon: 'dog-side' },
  { label: 'Fitness', value: 'Fitness', icon: 'dumbbell' },
  { label: 'Home Maintenance', value: 'Home Maintenance', icon: 'tools' },
  { label: 'Personal Care', value: 'Personal Care', icon: 'account' },
];

const allIcons = [
  { label: 'Towel', value: 'towel', icon: 'paper-roll-outline' },
  { label: 'Toothbrush', value: 'toothbrush', icon: 'toothbrush-electric' },
  { label: 'Soap', value: 'soap', icon: 'spray-bottle' },
  { label: 'Razor', value: 'razor', icon: 'razor-single-edge' },
  { label: 'Shower', value: 'shower', icon: 'shower-head' },
  { label: 'Sheets', value: 'sheets', icon: 'bed-empty' },
  { label: 'Pillow', value: 'pillow', icon: 'sleep' },
  { label: 'Blanket', value: 'blanket', icon: 'bed' },
  { label: 'Mattress', value: 'mattress', icon: 'bed-king' },
  { label: 'Dish Sponge', value: 'sponge', icon: 'dishwasher' },
  { label: 'Water Filter', value: 'water-filter', icon: 'water-pump' },
  { label: 'Fridge', value: 'fridge', icon: 'fridge' },
  { label: 'Microwave', value: 'microwave', icon: 'microwave' },
  { label: 'Oil Change', value: 'oil', icon: 'oil' },
  { label: 'Air Filter', value: 'filter', icon: 'air-filter' },
  { label: 'Tire', value: 'tire', icon: 'tire' },
  { label: 'Car Wash', value: 'car-wash', icon: 'car-wash' },
  { label: 'Battery', value: 'battery', icon: 'car-battery' },
  { label: 'Desk', value: 'desk', icon: 'desk' },
  { label: 'Computer', value: 'computer', icon: 'monitor' },
  { label: 'Backup', value: 'backup', icon: 'backup-restore' },
  { label: 'Home', value: 'home', icon: 'home-city' },
  { label: 'Bill', value: 'bill', icon: 'receipt' },
  { label: 'Subscription', value: 'subscription', icon: 'credit-card' },
  { label: 'Investment', value: 'investment', icon: 'chart-line' },
  { label: 'Medicine', value: 'medicine', icon: 'pill' },
  { label: 'Doctor', value: 'doctor', icon: 'stethoscope' },
  { label: 'Eye', value: 'eye', icon: 'eye' },
  { label: 'Dental', value: 'dental', icon: 'tooth' },
  { label: 'Water Plants', value: 'water-plants', icon: 'watering-can' },
  { label: 'Fertilize', value: 'fertilize', icon: 'sprout' },
  { label: 'Lawn', value: 'lawn', icon: 'grass' },
  { label: 'Vet', value: 'vet', icon: 'paw' },
  { label: 'Flea', value: 'flea', icon: 'bug' },
  { label: 'Pet Bath', value: 'pet-bath', icon: 'dog-side' },
  { label: 'Pet Food', value: 'pet-food', icon: 'food-drumstick' },
  { label: 'Gym', value: 'gym', icon: 'dumbbell' },
  { label: 'Yoga', value: 'yoga', icon: 'meditation' },
  { label: 'Running', value: 'running', icon: 'run' },
  { label: 'AC Filter', value: 'ac-filter', icon: 'air-conditioner' },
  { label: 'Smoke', value: 'smoke', icon: 'fire' },
  { label: 'Clean', value: 'clean', icon: 'broom' },
  { label: 'Pest', value: 'pest', icon: 'bug-outline' },
  { label: 'Haircut', value: 'haircut', icon: 'content-cut' },
  { label: 'Nails', value: 'nails', icon: 'hand-back-right' },
  { label: 'Skincare', value: 'skincare', icon: 'face-woman' },
];

const intervalOptions = [
  { days: 1, label: '1 day' },
  { days: 2, label: '2 days' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 21, label: '3 weeks' },
  { days: 28, label: '4 weeks' },
  { days: 30, label: '1 month' },
  { days: 60, label: '2 months' },
  { days: 90, label: '3 months' },
  { days: 180, label: '6 months' },
  { days: 365, label: '1 year' },
];

export default function AddTimer() {
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ isEditing?: string; timer?: string }>();
  const isEditing = params?.isEditing === 'true';
  const existingTimer = params?.timer ? JSON.parse(params.timer as string) : null;

  const [name, setName] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showIntervalModal, setShowIntervalModal] = useState(false);

  useEffect(() => {
    if (isEditing && existingTimer) {
      setName(existingTimer.name);
      setIntervalDays(String(existingTimer.intervalDays));
      setCategory(existingTimer.category);
      // Support older saved timers where icon might be the value or the raw icon name
      const matchByValue = allIcons.find(i => i.value === existingTimer.icon);
      const matchByIcon = allIcons.find(i => i.icon === existingTimer.icon);
      setIcon(matchByValue ? matchByValue.value : (matchByIcon ? matchByIcon.value : ''));
    }
  }, [isEditing, existingTimer]);

  const handleSaveTimer = async () => {
    if (isSaving) return;
    if (!name.trim()) { Alert.alert('Error', 'Please enter a timer name.'); return; }
    if (!category) { Alert.alert('Error', 'Please select a category.'); return; }
    if (!icon) { Alert.alert('Error', 'Please select an icon.'); return; }
    if (!intervalDays) { Alert.alert('Error', 'Please select a reset interval.'); return; }

    try {
      setIsSaving(true);
      if (isAuthenticated) {
        if (isEditing && existingTimer) {
          const iconName = allIcons.find(i => i.value === icon)?.icon || 'timer-sand';
          const result = await timerService.updateTimer(existingTimer.id, { name: name.trim(), intervalDays: parseInt(intervalDays, 10), category, icon: iconName });
          if (result.success) {
            // cancel previous notifications and reschedule with possibly updated values
            await notificationService.cancelTimerNotifications(existingTimer.id, isAuthenticated);
            const updatedTimer = {
              ...existingTimer,
              name: name.trim(),
              intervalDays: parseInt(intervalDays, 10),
              category,
              icon: iconName,
            };
            await notificationService.scheduleTimerNotification(updatedTimer, isAuthenticated);
            Alert.alert('Success', 'Timer successfully updated!', [{ text: 'OK', onPress: () => router.replace('/home') }]);
          } else {
            Alert.alert('Error', result.message);
          }
        } else {
          const iconName = allIcons.find(i => i.value === icon)?.icon || 'timer-sand';
          const result = await timerService.createTimer({ name: name.trim(), intervalDays: parseInt(intervalDays, 10), category, icon: iconName, lastResetTimestamp: Date.now() });
          if (result.success) {
            const newTimer = { id: (result as any).timer.id, name: name.trim(), intervalDays: parseInt(intervalDays, 10), category, icon: iconName, lastResetTimestamp: Date.now(), daysRemaining: parseInt(intervalDays, 10) };
            await notificationService.scheduleTimerNotification(newTimer, isAuthenticated);
            await notificationService.notifyTimerAdded(newTimer, isAuthenticated);
            Alert.alert('Success', 'Timer successfully added!', [{ text: 'OK', onPress: () => router.replace('/home') }]);
          } else {
            Alert.alert('Error', result.message);
          }
        }
      } else {
        const saved = await AsyncStorage.getItem('timers');
        const timers = saved ? JSON.parse(saved) : [];
        if (isEditing && existingTimer) {
          const iconName = allIcons.find(i => i.value === icon)?.icon || 'timer-sand';
          const updatedTimers = timers.map((t: any) => t.id === existingTimer.id ? { ...t, name: name.trim(), intervalDays: parseInt(intervalDays, 10), category, icon: iconName } : t);
          await AsyncStorage.setItem('timers', JSON.stringify(updatedTimers));
          Alert.alert('Success', 'Timer successfully updated!', [{ text: 'OK', onPress: () => router.replace('/home') }]);
        } else {
          const iconName = allIcons.find(i => i.value === icon)?.icon || 'timer-sand';
          const newTimer = { id: Date.now().toString(), name: name.trim(), intervalDays: parseInt(intervalDays, 10), lastResetTimestamp: Date.now(), category, icon: iconName };
          timers.push(newTimer);
          await AsyncStorage.setItem('timers', JSON.stringify(timers));
          await notificationService.scheduleTimerNotification({ ...newTimer, daysRemaining: parseInt(intervalDays, 10) }, false);
          await notificationService.notifyTimerAdded(newTimer, false);
          Alert.alert('Success', 'Timer successfully added!', [{ text: 'OK', onPress: () => router.replace('/home') }]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save timer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedCategoryIcon = () => categories.find(c => c.value === category)?.icon || 'folder-outline';
  const getSelectedIcon = () => allIcons.find(i => i.value === icon)?.icon || 'timer-sand';
  const getSelectedIntervalLabel = () => {
    const option = intervalOptions.find(opt => opt.days.toString() === intervalDays);
    return option ? option.label : 'Select interval';
  };

  const renderCategoryItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.modalItem, category === item.value && styles.selectedModalItem]} onPress={() => { setCategory(item.value); setShowCategoryModal(false); }}>
      <MaterialCommunityIcons name={item.icon as any} size={24} color={COLORS.primary} />
      <Text style={[styles.modalItemText, category === item.value && styles.selectedModalItemText]}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderIconItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.modalItem, icon === item.value && styles.selectedModalItem]} onPress={() => { setIcon(item.value); setShowIconModal(false); }}>
      <MaterialCommunityIcons name={item.icon as any} size={24} color={COLORS.primary} />
      <Text style={[styles.modalItemText, icon === item.value && styles.selectedModalItemText]}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderIntervalItem = ({ item }: any) => (
    <TouchableOpacity style={[styles.modalItem, intervalDays === item.days.toString() && styles.selectedModalItem]} onPress={() => { setIntervalDays(item.days.toString()); setShowIntervalModal(false); }}>
      <MaterialCommunityIcons name="calendar-clock" size={24} color={COLORS.primary} />
      <Text style={[styles.modalItemText, intervalDays === item.days.toString() && styles.selectedModalItemText]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? 'Edit Timer' : 'Add New Timer'}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Timer Name</Text>
          <TextInput style={styles.input} placeholder="e.g., Change Toothbrush Head" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.selectorButton} onPress={() => setShowCategoryModal(true)}>
            <MaterialCommunityIcons name={getSelectedCategoryIcon() as any} size={20} color={category ? COLORS.primary : COLORS.textSecondary} style={styles.selectorIcon} />
            <Text style={[styles.selectorText, !category && styles.placeholderText]}>{category || 'Select category'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Icon</Text>
          <TouchableOpacity style={styles.selectorButton} onPress={() => setShowIconModal(true)}>
            <MaterialCommunityIcons name={getSelectedIcon() as any} size={20} color={icon ? COLORS.primary : COLORS.textSecondary} style={styles.selectorIcon} />
            <Text style={[styles.selectorText, !icon && styles.placeholderText]}>{icon ? (allIcons.find(i => i.value === icon)?.label) : 'Select icon'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Reset Interval</Text>
          <TouchableOpacity style={styles.selectorButton} onPress={() => setShowIntervalModal(true)}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={intervalDays ? COLORS.primary : COLORS.textSecondary} style={styles.selectorIcon} />
            <Text style={[styles.selectorText, !intervalDays && styles.placeholderText]}>{getSelectedIntervalLabel()}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.saveButton, isSaving && { opacity: 0.6 }]} onPress={handleSaveTimer} activeOpacity={0.8} disabled={isSaving}>
          <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.saveButtonText}>{isSaving ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Timer' : 'Save Timer')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Modal visible={showCategoryModal} animationType="slide" transparent onRequestClose={() => setShowCategoryModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <FlatList data={categories} renderItem={renderCategoryItem} keyExtractor={(item) => item.value} showsVerticalScrollIndicator={false} />
            </View>
          </View>
        </Modal>

        <Modal visible={showIconModal} animationType="slide" transparent onRequestClose={() => setShowIconModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Icon</Text>
                <TouchableOpacity onPress={() => setShowIconModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <FlatList data={allIcons} renderItem={renderIconItem} keyExtractor={(item) => item.value} numColumns={2} columnWrapperStyle={styles.iconColumnWrapper} showsVerticalScrollIndicator={false} />
            </View>
          </View>
        </Modal>

        <Modal visible={showIntervalModal} animationType="slide" transparent onRequestClose={() => setShowIntervalModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Interval</Text>
                <TouchableOpacity onPress={() => setShowIntervalModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <FlatList data={intervalOptions} renderItem={renderIntervalItem} keyExtractor={(item) => item.days.toString()} showsVerticalScrollIndicator={false} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backButton: { padding: 8 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  placeholder: { width: 40 },
  inputContainer: { marginBottom: 24 },
  label: { color: COLORS.text, fontSize: 15, fontWeight: '600', marginBottom: 10, letterSpacing: 0.3 },
  input: { backgroundColor: COLORS.card, color: COLORS.text, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  selectorButton: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', alignItems: 'center', padding: 16 },
  selectorIcon: { marginRight: 12 },
  selectorText: { flex: 1, color: COLORS.text, fontSize: 16 },
  placeholderText: { color: COLORS.textSecondary },
  saveButton: { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 5, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6 },
  buttonIcon: { marginRight: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  cancelButton: { backgroundColor: 'transparent', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: COLORS.textSecondary },
  cancelButtonText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 20, width: '100%', maxHeight: '80%', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  selectedModalItem: { backgroundColor: 'rgba(255,255,255,0.1)' },
  modalItemText: { color: COLORS.text, fontSize: 16, marginLeft: 12, flex: 1 },
  selectedModalItemText: { color: COLORS.primary, fontWeight: '600' },
  iconColumnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
});
