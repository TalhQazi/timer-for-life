import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  CONSENT_STATUS: 'consent_status',
  CONSENT_TIMESTAMP: 'consent_timestamp',
};

type ConsentStatus = 'accepted' | 'rejected' | 'pending' | null;

class ConsentService {
  private static instance: ConsentService;
  private consentStatus: ConsentStatus = null;
  private consentTimestamp: number | null = null;

  private constructor() {}

  static getInstance(): ConsentService {
    if (!ConsentService.instance) {
      ConsentService.instance = new ConsentService();
    }
    return ConsentService.instance;
  }

  async initialize() {
    try {
      await this.loadConsentStatus();
    } catch (error) {
      console.error('ConsentService initialization error:', error);
    }
  }

  private async loadConsentStatus() {
    try {
      const [status, timestamp] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CONSENT_STATUS),
        AsyncStorage.getItem(STORAGE_KEYS.CONSENT_TIMESTAMP),
      ]);

      this.consentStatus = status as ConsentStatus;
      this.consentTimestamp = timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('Error loading consent status:', error);
    }
  }

  private async saveConsentStatus() {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CONSENT_STATUS, this.consentStatus || ''),
        AsyncStorage.setItem(STORAGE_KEYS.CONSENT_TIMESTAMP, this.consentTimestamp?.toString() || ''),
      ]);
    } catch (error) {
      console.error('Error saving consent status:', error);
    }
  }

  async setConsent(status: 'accepted' | 'rejected') {
    this.consentStatus = status;
    this.consentTimestamp = Date.now();
    await this.saveConsentStatus();
  }

  getConsentStatus(): ConsentStatus {
    return this.consentStatus;
  }

  hasConsented(): boolean {
    return this.consentStatus === 'accepted';
  }

  hasRejected(): boolean {
    return this.consentStatus === 'rejected';
  }

  isPending(): boolean {
    return this.consentStatus === null || this.consentStatus === 'pending';
  }

  getConsentTimestamp(): number | null {
    return this.consentTimestamp;
  }

  async resetConsent() {
    this.consentStatus = null;
    this.consentTimestamp = null;
    await this.saveConsentStatus();
  }

  // For GDPR compliance, consent should be renewed periodically
  shouldRenewConsent(): boolean {
    if (!this.consentTimestamp) return true;
    
    const daysSinceConsent = (Date.now() - this.consentTimestamp) / (1000 * 60 * 60 * 24);
    return daysSinceConsent > 365; // Renew consent annually
  }

  getConsentText(): {
    title: string;
    message: string;
    acceptText: string;
    rejectText: string;
  } {
    return {
      title: 'Privacy & Consent',
      message: 'This app uses Google AdMob to show personalized ads. You can choose to accept personalized ads for a better experience or opt-out for non-personalized ads. Your data is handled according to our Privacy Policy.',
      acceptText: 'Accept',
      rejectText: 'Opt Out',
    };
  }

  getPrivacyPolicyUrl(): string {
    // You should update this with your actual privacy policy URL
    return 'https://yourapp.com/privacy-policy';
  }
}

export const consentService = ConsentService.getInstance();
export default consentService;
