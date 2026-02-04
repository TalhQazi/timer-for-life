import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";

type GoogleMobileAdsModule = {
  AdEventType: any;
  InterstitialAd: any;
  RewardedAd: any;
};

const getGoogleMobileAds = (): GoogleMobileAdsModule | null => {
  if (Platform.OS === "web") return null;
  if (!(NativeModules as any)?.RNGoogleMobileAdsModule) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("react-native-google-mobile-ads");
};

const AD_UNIT_IDS = {
  banner: {
    android: "ca-app-pub-4184573887331805/8196325149",
    ios: "ca-app-pub-3940256099942544/6300978111",
  },
  interstitial: {
    android: "ca-app-pub-4184573887331805/9871874058",
    ios: "ca-app-pub-3940256099942544/1033173712",
  },
  rewarded: {
    android: "ca-app-pub-4184573887331805/9784738982",
    ios: "ca-app-pub-3940256099942544/5224354917",
  },
};

const STORAGE_KEYS = {
  LAST_INTERSTITIAL_TIME: "last_interstitial_time",
  AD_CONSENT: "ad_consent",
  IS_PAID_USER: "is_paid_user",
};

const INTERSTITIAL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class AdsService {
  private static instance: AdsService;
  private isInitialized = false;
  private isPaidUser = false;
  private adConsent = false;

  private interstitialAd: any | null = null;
  private rewardedAd: any | null = null;

  private constructor() {}

  static getInstance(): AdsService {
    if (!AdsService.instance) {
      AdsService.instance = new AdsService();
    }
    return AdsService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadUserSettings();
      this.isInitialized = true;
    } catch (error) {
      console.error("AdsService initialization error:", error);
    }
  }

  private async loadUserSettings() {
    try {
      const [paidUser, consent] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.IS_PAID_USER),
        AsyncStorage.getItem(STORAGE_KEYS.AD_CONSENT),
      ]);

      this.isPaidUser = paidUser === "true";
      this.adConsent = consent === "true";
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
  }

  async setPaidUser(isPaid: boolean) {
    this.isPaidUser = isPaid;
    await AsyncStorage.setItem(STORAGE_KEYS.IS_PAID_USER, isPaid.toString());
  }

  async setAdConsent(consent: boolean) {
    this.adConsent = consent;
    await AsyncStorage.setItem(STORAGE_KEYS.AD_CONSENT, consent.toString());
  }

  getAdRequestOptions(): { requestNonPersonalizedAdsOnly: boolean } {
    return {
      requestNonPersonalizedAdsOnly: !this.adConsent,
    };
  }

  getAdUnitId(adType: "banner" | "interstitial" | "rewarded"): string {
    const platform = Platform.OS as "android" | "ios";
    return AD_UNIT_IDS[adType][platform];
  }

  shouldShowAds(): boolean {
    // Show ads for all free users. If user declined consent, we still show
    // non-personalized ads via requestNonPersonalizedAdsOnly.
    return !this.isPaidUser;
  }

  async canShowInterstitial(): Promise<boolean> {
    if (!this.shouldShowAds()) return false;

    try {
      const lastInterstitialTime = await AsyncStorage.getItem(
        STORAGE_KEYS.LAST_INTERSTITIAL_TIME,
      );
      if (!lastInterstitialTime) return true;

      const timeSinceLastAd = Date.now() - parseInt(lastInterstitialTime, 10);
      return timeSinceLastAd >= INTERSTITIAL_INTERVAL_MS;
    } catch (error) {
      console.error("Error checking interstitial timing:", error);
      return true;
    }
  }

  async recordInterstitialShown() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_INTERSTITIAL_TIME,
        Date.now().toString(),
      );
    } catch (error) {
      console.error("Error recording interstitial time:", error);
    }
  }

  createInterstitialAd() {
    if (!this.shouldShowAds()) return null;

    const gma = getGoogleMobileAds();
    if (!gma) return null;

    const adUnitId = this.getAdUnitId("interstitial");
    return gma.InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: !this.adConsent,
    });
  }

  createRewardedAd() {
    if (!this.shouldShowAds()) return null;

    const gma = getGoogleMobileAds();
    if (!gma) return null;

    const adUnitId = this.getAdUnitId("rewarded");
    return gma.RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: !this.adConsent,
    });
  }

  loadAndShowInterstitial(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.shouldShowAds()) {
        resolve(false);
        return;
      }

      const canShow = await this.canShowInterstitial();
      if (!canShow) {
        resolve(false);
        return;
      }

      try {
        const interstitial = this.createInterstitialAd();
        if (!interstitial) {
          resolve(false);
          return;
        }
        this.interstitialAd = interstitial;

        const gma = getGoogleMobileAds();
        if (!gma) {
          resolve(false);
          return;
        }

        const unsubscribeLoaded = interstitial.addAdEventListener(
          gma.AdEventType.LOADED,
          async () => {
            try {
              await interstitial.show();
              await this.recordInterstitialShown();
              resolve(true);
            } catch {
              resolve(false);
            } finally {
              unsubscribeLoaded();
              unsubscribeClosed();
              unsubscribeError();
              this.interstitialAd = null;
            }
          },
        );

        const unsubscribeClosed = interstitial.addAdEventListener(
          gma.AdEventType.CLOSED,
          () => {
            resolve(false);
            unsubscribeLoaded();
            unsubscribeClosed();
            unsubscribeError();
            this.interstitialAd = null;
          },
        );

        const unsubscribeError = interstitial.addAdEventListener(
          gma.AdEventType.ERROR,
          () => {
            resolve(false);
            unsubscribeLoaded();
            unsubscribeClosed();
            unsubscribeError();
            this.interstitialAd = null;
          },
        );

        interstitial.load();
      } catch (e) {
        console.error("Interstitial error:", e);
        resolve(false);
      }
    });
  }

  loadAndShowRewardedAd(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.shouldShowAds()) {
        resolve(false);
        return;
      }

      try {
        const rewarded = this.createRewardedAd();
        if (!rewarded) {
          resolve(false);
          return;
        }
        this.rewardedAd = rewarded;

        const gma = getGoogleMobileAds();
        if (!gma) {
          resolve(false);
          return;
        }

        const unsubscribeLoaded = rewarded.addAdEventListener(
          gma.AdEventType.LOADED,
          () => {
            rewarded.show();
          },
        );

        const unsubscribeEarnedReward = rewarded.addAdEventListener(
          gma.AdEventType.EARNED_REWARD,
          () => {
            resolve(true);
            unsubscribeLoaded();
            unsubscribeEarnedReward();
            unsubscribeClosed();
            unsubscribeError();
            this.rewardedAd = null;
          },
        );

        const unsubscribeClosed = rewarded.addAdEventListener(
          gma.AdEventType.CLOSED,
          () => {
            resolve(false);
            unsubscribeLoaded();
            unsubscribeEarnedReward();
            unsubscribeClosed();
            unsubscribeError();
            this.rewardedAd = null;
          },
        );

        const unsubscribeError = rewarded.addAdEventListener(
          gma.AdEventType.ERROR,
          () => {
            resolve(false);
            unsubscribeLoaded();
            unsubscribeEarnedReward();
            unsubscribeClosed();
            unsubscribeError();
            this.rewardedAd = null;
          },
        );

        rewarded.load();
      } catch (e) {
        console.error("Rewarded error:", e);
        resolve(false);
      }
    });
  }

  // Banner rendering should live in a TSX component (e.g., src/components/BannerAd.tsx).
  // This service should stay JSX-free because it's a .ts file.
}

export const adsService = AdsService.getInstance();
export default adsService;
