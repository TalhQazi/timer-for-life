// Timer Service - API Integration (ported)
import apiService from './api';

export interface Timer {
  id: string;
  name: string;
  intervalDays: number;
  category: string;
  icon: string;
  lastResetTimestamp: number;
  createdAt: number;
  updatedAt: number;
  daysRemaining: number;
}

export interface CreateTimerData {
  name: string;
  intervalDays: number;
  category: string;
  icon: string;
  lastResetTimestamp?: number;
}

export interface UpdateTimerData {
  name?: string;
  intervalDays?: number;
  category?: string;
  icon?: string;
}

class TimerService {
  private static instance: TimerService;
  private constructor() {}
  static getInstance(): TimerService {
    if (!TimerService.instance) TimerService.instance = new TimerService();
    return TimerService.instance;
  }

  async getTimers(): Promise<{ success: boolean; message: string; timers?: Timer[] }> {
    try {
      const response = await apiService.getTimers();
      if (response.success) {
        return { success: true, message: response.message, timers: (response as any).data?.timers || [] };
      }
      return { success: false, message: response.message || 'Failed to fetch timers' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to fetch timers. Please try again.' };
    }
  }

  async createTimer(timerData: CreateTimerData): Promise<{ success: boolean; message: string; timer?: Timer }> {
    try {
      const response = await apiService.createTimer(timerData);
      if (response.success) {
        return { success: true, message: response.message, timer: (response as any).data?.timer };
      }
      return { success: false, message: response.message || 'Failed to create timer' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to create timer. Please try again.' };
    }
  }

  async updateTimer(id: string, timerData: UpdateTimerData): Promise<{ success: boolean; message: string; timer?: Timer }> {
    try {
      const response = await apiService.updateTimer(id, timerData);
      if (response.success) {
        return { success: true, message: response.message, timer: (response as any).data?.timer };
      }
      return { success: false, message: response.message || 'Failed to update timer' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to update timer. Please try again.' };
    }
  }

  async deleteTimer(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.deleteTimer(id);
      if (response.success) {
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || 'Failed to delete timer' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to delete timer. Please try again.' };
    }
  }

  async resetTimer(id: string, newResetTimestamp?: number): Promise<{ success: boolean; message: string; timer?: Timer }> {
    try {
      const response = await apiService.resetTimer(id, newResetTimestamp);
      if (response.success) {
        return { success: true, message: response.message, timer: (response as any).data?.timer };
      }
      return { success: false, message: response.message || 'Failed to reset timer' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to reset timer. Please try again.' };
    }
  }
}

export const timerService = TimerService.getInstance();
export default timerService;
