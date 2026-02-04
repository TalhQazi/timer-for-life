import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';

interface User {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  timezone: string;
  notificationPreferences: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    dailySummaryTime: string;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private tokens: AuthTokens | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      const storedTokens = await AsyncStorage.getItem('auth_tokens');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedTokens && storedUser) {
        const tokens = JSON.parse(storedTokens) as AuthTokens;
        const user = JSON.parse(storedUser) as User;

        apiService.setAccessToken(tokens.accessToken);

        try {
          await apiService.getTimers();
          this.tokens = tokens;
          this.user = user;
          return true;
        } catch {
          try {
            const refreshResponse = await apiService.refreshToken(tokens.refreshToken);
            if (refreshResponse.success) {
              const newTokens: AuthTokens = {
                accessToken: (refreshResponse as any).data.accessToken,
                refreshToken: tokens.refreshToken,
              };
              await this.saveAuthData(user, newTokens);
              return true;
            }
          } catch {
            await this.clearAuthData();
          }
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async register(userData: { email: string; password: string; name: string; timezone: string }) {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        return { success: true, message: response.message, user: (response as any).data?.user as User };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Registration failed. Please try again.' };
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await apiService.login({ email, password });
      if (response.success) {
        const { user, tokens } = (response as any).data as { user: User; tokens: AuthTokens };
        await this.saveAuthData(user, tokens);
        apiService.setAccessToken(tokens.accessToken);
        this.user = user;
        this.tokens = tokens;
        return { success: true, message: response.message, user };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Login failed. Please try again.' };
    }
  }

  async logout() {
    try {
      if (this.tokens?.refreshToken) {
        await apiService.logout(this.tokens.refreshToken);
      }
    } catch {}
    await this.clearAuthData();
    return { success: true, message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    try {
      const response = await apiService.forgotPassword(email);
      return { success: response.success, message: response.message };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to send reset email. Please try again.' };
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  private async saveAuthData(user: User, tokens: AuthTokens) {
    try {
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
    } catch {}
  }

  private async clearAuthData() {
    try {
      await AsyncStorage.removeItem('auth_tokens');
      await AsyncStorage.removeItem('user_data');
      this.user = null;
      this.tokens = null;
      apiService.setAccessToken(null);
    } catch {}
  }
}

export const authService = AuthService.getInstance();
export default authService;
