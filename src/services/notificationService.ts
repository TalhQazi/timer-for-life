// Expo Notifications implementation
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';

export interface ScheduleNotificationData {
  timerId: string;
  notificationTime: number;
  title: string;
  message: string;
}

type TimerNotificationRecord = {
  timerId: string;
  notificationIds: string[];
};

const STORAGE_KEY = 'timer_notification_ids';
const DAY_MS = 24 * 60 * 60 * 1000;

async function loadAllRecords(): Promise<TimerNotificationRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveAllRecords(records: TimerNotificationRecord[]) {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch {}
}

function buildContent(title: string, body: string): Notifications.NotificationContentInput {
  return {
    title,
    body,
    sound: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  };
}

class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) NotificationService.instance = new NotificationService();
    return NotificationService.instance;
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        // Newer SDKs surface banner/list options on iOS
        shouldShowBanner: true as any,
        shouldShowList: true as any,
      } as any),
    });

    await this.requestPermissions();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('timers', {
        name: 'Timers',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }

  private async scheduleImmediateLocal(title: string, message: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: buildContent(title, message),
        trigger: null,
      });
    } catch {}
  }

  async notifyTimerAdded(timer: any, _isAuthenticated: boolean) {
    await this.initialize();
    const title = 'Timer Added';
    const message = `"${timer.name}" has been added.`;
    await this.scheduleImmediateLocal(title, message);
  }

  async notifyTimerReset(timer: any, _isAuthenticated: boolean) {
    await this.initialize();
    const title = 'Timer Reset';
    const message = `"${timer.name}" has been reset. Next due in ${timer.intervalDays} day(s).`;
    await this.scheduleImmediateLocal(title, message);
  }

  async requestPermissions() {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      await Notifications.requestPermissionsAsync();
    }
  }

  private async scheduleLocal(date: Date, title: string, message: string): Promise<string | null> {
    const diffMs = date.getTime() - Date.now();
    const isPastOrNow = diffMs <= 0;
    try {
      let trigger: any = null;
      if (!isPastOrNow) {
        if (Platform.OS === 'android') {
          const seconds = Math.ceil(diffMs / 1000);
          trigger = { channelId: 'timers', seconds } as Notifications.NotificationTriggerInput as any;
        } else {
          trigger = date; // iOS supports Date trigger directly
        }
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: buildContent(title, message),
        trigger,
      } as any);
      return id;
    } catch {
      return null;
    }
  }

  private async addRecord(timerId: string, notificationId: string) {
    const records = await loadAllRecords();
    const existing = records.find(r => r.timerId === timerId);
    if (existing) existing.notificationIds.push(notificationId);
    else records.push({ timerId, notificationIds: [notificationId] });
    await saveAllRecords(records);
  }

  private async clearRecord(timerId: string) {
    const records = await loadAllRecords();
    const next = records.filter(r => r.timerId !== timerId);
    await saveAllRecords(next);
  }

  private async getRecord(timerId: string) {
    const records = await loadAllRecords();
    return records.find(r => r.timerId === timerId);
  }

  async scheduleNotificationAPI(notificationData: ScheduleNotificationData) {
    try {
      const response = await apiService.request('/notifications/schedule', {
        method: 'POST',
        body: JSON.stringify(notificationData),
      });
      return { success: response.success, message: response.message };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to schedule notification via API' };
    }
  }

  // Schedule notifications at due-2 days, due-1 day, and due date
  async scheduleTimerNotification(timer: any, _isAuthenticated: boolean = false) {
    await this.initialize();
    const { id, name, intervalDays, lastResetTimestamp } = timer;
    const dueTime = lastResetTimestamp + intervalDays * DAY_MS;

    const schedulePoints = [
      ...(intervalDays >= 2 ? [{ offset: 2 * DAY_MS, title: '⏰ 2 Days Left', msg: `"${name}" will expire in 2 days!` }] : []),
      ...(intervalDays >= 1 ? [{ offset: 1 * DAY_MS, title: '⚠️ Expires Tomorrow', msg: `"${name}" expires tomorrow!` }] : []),
      { offset: 0, title: '🚨 Timer Expired!', msg: `"${name}" has expired. Reset it after completion.` },
    ];

    for (const point of schedulePoints) {
      const when = new Date(dueTime - point.offset);
      if (when.getTime() <= Date.now()) continue; // skip past times
      const localId = await this.scheduleLocal(when, point.title, point.msg);
      if (localId) await this.addRecord(id, localId);
    }
  }

  async cancelTimerNotifications(timerId: string, isAuthenticated: boolean = false) {
    // cancel local
    const record = await this.getRecord(timerId);
    if (record?.notificationIds?.length) {
      for (const nid of record.notificationIds) {
        try { await Notifications.cancelScheduledNotificationAsync(nid); } catch {}
      }
    }
    await this.clearRecord(timerId);

    // cancel backend if authenticated
    if (isAuthenticated) {
      try {
        const response = await apiService.request(`/notifications/timer/${timerId}`, { method: 'DELETE' });
        return { success: response.success, message: response.message };
      } catch (e: any) {
        return { success: false, message: e?.message || 'Failed to cancel notifications' };
      }
    }
    return { success: true, message: 'Cancelled local notifications' };
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
