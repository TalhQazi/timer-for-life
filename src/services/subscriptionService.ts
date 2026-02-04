import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import apiService from "./api";

const STORAGE_KEYS = {
  IS_PAID_USER: "is_paid_user",
  SUBSCRIPTION_TYPE: "subscription_type", // 'monthly' | 'lifetime' | null
  SUBSCRIPTION_EXPIRY: "subscription_expiry",
  PURCHASE_TOKEN: "purchase_token",
};

const SUBSCRIPTION_PRODUCTS = {
  monthly:
    Platform.OS === "android"
      ? "timer_for_life_monthly"
      : "timer_for_life_monthly_ios",
  lifetime:
    Platform.OS === "android"
      ? "timer_for_life_lifetime"
      : "timer_for_life_lifetime_ios",
};

const PRICES = {
  monthly: 0.99,
  lifetime: 9.99,
};

interface SubscriptionStatus {
  isPaidUser: boolean;
  subscriptionType: "monthly" | "lifetime" | null;
  subscriptionExpiry: number | null;
  purchaseToken: string | null;
}

class SubscriptionService {
  private static instance: SubscriptionService;
  private isInitialized = false;
  private currentStatus: SubscriptionStatus = {
    isPaidUser: false,
    subscriptionType: null,
    subscriptionExpiry: null,
    purchaseToken: null,
  };

  private constructor() {}

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadSubscriptionStatus();
      await this.verifySubscriptionWithBackend();
      this.isInitialized = true;
    } catch (error) {
      console.error("SubscriptionService initialization error:", error);
    }
  }

  private async loadSubscriptionStatus() {
    try {
      const [isPaid, type, expiry, token] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.IS_PAID_USER),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_TYPE),
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_EXPIRY),
        AsyncStorage.getItem(STORAGE_KEYS.PURCHASE_TOKEN),
      ]);

      this.currentStatus = {
        isPaidUser: isPaid === "true",
        subscriptionType: type as "monthly" | "lifetime" | null,
        subscriptionExpiry: expiry ? parseInt(expiry, 10) : null,
        purchaseToken: token,
      };
    } catch (error) {
      console.error("Error loading subscription status:", error);
    }
  }

  private async saveSubscriptionStatus() {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.IS_PAID_USER,
          this.currentStatus.isPaidUser.toString(),
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.SUBSCRIPTION_TYPE,
          this.currentStatus.subscriptionType || "",
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.SUBSCRIPTION_EXPIRY,
          this.currentStatus.subscriptionExpiry?.toString() || "",
        ),
        AsyncStorage.setItem(
          STORAGE_KEYS.PURCHASE_TOKEN,
          this.currentStatus.purchaseToken || "",
        ),
      ]);
    } catch (error) {
      console.error("Error saving subscription status:", error);
    }
  }

  private async handlePurchaseUpdate(purchase: any) {
    try {
      if (purchase.type === "success") {
        await this.processPurchase(purchase);
      } else if (purchase.type === "cancelled") {
        console.log("Purchase cancelled");
      }
    } catch (error) {
      console.error("Error handling purchase update:", error);
    }
  }

  private async processPurchase(purchase: any) {
    try {
      const { productId, transactionId, transactionReceipt, transactionDate } =
        purchase;

      let subscriptionType: "monthly" | "lifetime";
      if (productId === SUBSCRIPTION_PRODUCTS.monthly) {
        subscriptionType = "monthly";
      } else if (productId === SUBSCRIPTION_PRODUCTS.lifetime) {
        subscriptionType = "lifetime";
      } else {
        throw new Error("Unknown product ID: " + productId);
      }

      // Verify with backend
      const verificationResult = await this.verifyPurchaseWithBackend({
        productId,
        transactionId,
        transactionReceipt,
        transactionDate,
        subscriptionType,
      });

      if (verificationResult.success) {
        this.currentStatus = {
          isPaidUser: true,
          subscriptionType,
          subscriptionExpiry:
            subscriptionType === "lifetime"
              ? null
              : (verificationResult as any).expiryDate || null,
          purchaseToken: transactionId,
        };

        await this.saveSubscriptionStatus();
        // Purchase finalization is handled by the IAP SDK (temporarily disabled)
      }
    } catch (error) {
      console.error("Error processing purchase:", error);
      // Purchase finalization is handled by the IAP SDK (temporarily disabled)
    }
  }

  private async handleRefund(purchase: any) {
    try {
      this.currentStatus = {
        isPaidUser: false,
        subscriptionType: null,
        subscriptionExpiry: null,
        purchaseToken: null,
      };

      await this.saveSubscriptionStatus();
      // Purchase finalization is handled by the IAP SDK (temporarily disabled)
    } catch (error) {
      console.error("Error handling refund:", error);
    }
  }

  private async verifyPurchaseWithBackend(
    purchaseData: any,
  ): Promise<{ success: boolean; expiryDate?: number }> {
    try {
      const response = await apiService.request("/subscriptions/verify", {
        method: "POST",
        body: JSON.stringify(purchaseData),
      });

      if (response.success) {
        const data = response.data as any;
        return {
          success: true,
          expiryDate: data?.expiryDate,
        };
      }

      return { success: false };
    } catch (error) {
      console.error("Backend verification error:", error);
      return { success: false };
    }
  }

  private async verifySubscriptionWithBackend() {
    try {
      if (!this.currentStatus.purchaseToken) return;

      const response = await apiService.request("/subscriptions/status", {
        method: "POST",
        body: JSON.stringify({
          purchaseToken: this.currentStatus.purchaseToken,
          subscriptionType: this.currentStatus.subscriptionType,
        }),
      });

      if (response.success) {
        const data = response.data as any;
        const { isActive, expiryDate } = data;

        if (!isActive) {
          this.currentStatus = {
            isPaidUser: false,
            subscriptionType: null,
            subscriptionExpiry: null,
            purchaseToken: null,
          };
          await this.saveSubscriptionStatus();
        } else if (
          expiryDate &&
          expiryDate !== this.currentStatus.subscriptionExpiry
        ) {
          this.currentStatus.subscriptionExpiry = expiryDate;
          await this.saveSubscriptionStatus();
        }
      }
    } catch (error) {
      console.error("Backend status verification error:", error);
    }
  }

  async purchaseMonthlySubscription(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      return {
        success: false,
        error:
          "Purchases are temporarily disabled in this build. Integrate a supported IAP SDK (e.g., react-native-iap/RevenueCat).",
      };
    } catch (error: any) {
      console.error("Error purchasing monthly subscription:", error);
      return { success: false, error: error.message };
    }
  }

  async purchaseLifetimeUnlock(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      return {
        success: false,
        error:
          "Purchases are temporarily disabled in this build. Integrate a supported IAP SDK (e.g., react-native-iap/RevenueCat).",
      };
    } catch (error: any) {
      console.error("Error purchasing lifetime unlock:", error);
      return { success: false, error: error.message };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      return {
        success: false,
        error:
          "Restore is temporarily disabled in this build. Integrate a supported IAP SDK (e.g., react-native-iap/RevenueCat).",
      };
    } catch (error: any) {
      console.error("Error restoring purchases:", error);
      return { success: false, error: error.message };
    }
  }

  getSubscriptionStatus(): SubscriptionStatus {
    return { ...this.currentStatus };
  }

  isPaidUser(): boolean {
    return this.currentStatus.isPaidUser;
  }

  getSubscriptionType(): "monthly" | "lifetime" | null {
    return this.currentStatus.subscriptionType;
  }

  getSubscriptionPrice(type: "monthly" | "lifetime"): number {
    return PRICES[type];
  }

  async manageSubscription() {
    try {
      if (Platform.OS === "ios") {
        // For iOS, you would typically use Linking to open App Store subscription management
        const url = "https://apps.apple.com/account/subscriptions";
        // You can use expo-linking to open this URL
        console.log("Open iOS subscription management:", url);
      } else {
        // For Android, open Google Play subscription management
        const url = "https://play.google.com/store/account/subscriptions";
        console.log("Open Android subscription management:", url);
      }
    } catch (error) {
      console.error("Error opening subscription management:", error);
    }
  }

  async checkSubscriptionExpiry() {
    if (this.currentStatus.subscriptionType === "lifetime") return;

    if (this.currentStatus.subscriptionExpiry) {
      const now = Date.now();
      if (now > this.currentStatus.subscriptionExpiry) {
        this.currentStatus = {
          isPaidUser: false,
          subscriptionType: null,
          subscriptionExpiry: null,
          purchaseToken: null,
        };
        await this.saveSubscriptionStatus();
      }
    }
  }
}

export const subscriptionService = SubscriptionService.getInstance();
export default subscriptionService;
