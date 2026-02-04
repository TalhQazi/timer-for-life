import BannerAdComponent from "@/src/components/BannerAd";
import ConsentModal from "@/src/components/ConsentModal";
import FAB from "@/src/components/FAB";
import SubscriptionModal from "@/src/components/SubscriptionModal";
import { useAuth } from "@/src/contexts/AuthContext";
import adsService from "@/src/services/adsService";
import consentService from "@/src/services/consentService";
import subscriptionService from "@/src/services/subscriptionService";
import timerService from "@/src/services/timerService";
import { COLORS } from "@/src/utils/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TimerCard from "../src/components/TimerCard";

const calculateDaysRemaining = (
  lastResetTimestamp: number,
  intervalDays: number,
) => {
  if (!lastResetTimestamp || !intervalDays) return 0;
  const now = Date.now();
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const nextExpirationTimestamp = lastResetTimestamp + intervalMs;
  const differenceMs = nextExpirationTimestamp - now;
  const daysRemaining = Math.ceil(differenceMs / (24 * 60 * 60 * 1000));
  return Math.max(0, daysRemaining);
};

const autoResetExpiredTimers = async (rawTimers: any[]) => {
  try {
    const now = Date.now();
    let hasChanges = false;
    const updated = rawTimers.map((timer) => {
      const intervalMs = timer.intervalDays * 24 * 60 * 60 * 1000;
      const nextResetTime = timer.lastResetTimestamp + intervalMs;
      if (now >= nextResetTime) {
        hasChanges = true;
        const timePassed = now - timer.lastResetTimestamp;
        const intervalsPassed = Math.floor(timePassed / intervalMs);
        const newLastResetTimestamp =
          timer.lastResetTimestamp + intervalsPassed * intervalMs;
        return { ...timer, lastResetTimestamp: newLastResetTimestamp };
      }
      return timer;
    });
    if (hasChanges) {
      await AsyncStorage.setItem("timers", JSON.stringify(updated));
      return updated;
    }
    return rawTimers;
  } catch (e) {
    return rawTimers;
  }
};

// Note: Scheduling is handled on create/update/reset/delete flows to avoid duplicates.

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [timers, setTimers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        adsService.initialize(),
        consentService.initialize(),
        subscriptionService.initialize(),
      ]);

      const paid = subscriptionService.isPaidUser();
      setIsPaidUser(paid);
      await adsService.setPaidUser(paid);

      const hasConsent = consentService.hasConsented();
      await adsService.setAdConsent(hasConsent);

      if (consentService.isPending() || consentService.shouldRenewConsent()) {
        setShowConsentModal(true);
      }
    };

    init();
  }, []);

  const loadTimers = async () => {
    try {
      setIsLoading(true);
      if (isAuthenticated) {
        const result = await timerService.getTimers();
        if (result.success && result.timers) {
          const processed = result.timers.map((timer) => ({
            ...timer,
            daysRemaining: calculateDaysRemaining(
              timer.lastResetTimestamp,
              timer.intervalDays,
            ),
          }));
          setTimers(processed);
        } else {
          setTimers([]);
        }
      } else {
        const saved = await AsyncStorage.getItem("timers");
        let rawTimers = saved ? JSON.parse(saved) : [];
        rawTimers = await autoResetExpiredTimers(rawTimers);
        const processed = rawTimers.map((timer: any) => ({
          ...timer,
          daysRemaining: calculateDaysRemaining(
            timer.lastResetTimestamp,
            timer.intervalDays,
          ),
        }));
        setTimers(processed);
      }
    } catch (e) {
      setTimers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimers();
  }, [isAuthenticated]);

  // Ensure list refreshes when returning from add/edit/delete
  useFocusEffect(
    useCallback(() => {
      loadTimers();
      return () => {};
    }, [isAuthenticated]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTimers();
    setRefreshing(false);
  }, [isAuthenticated]);

  const filteredTimers = useMemo(() => timers, [timers]);

  const handleAddTimer = async () => {
    // Interstitial after adding timer (frequency-limited by adsService)
    try {
      await adsService.loadAndShowInterstitial();
    } catch {}
    router.push("/add-timer");
  };

  const handleConsentGiven = async (accepted: boolean) => {
    await adsService.setAdConsent(accepted);
    setShowConsentModal(false);
  };

  const handleSubscriptionComplete = async () => {
    const paid = subscriptionService.isPaidUser();
    setIsPaidUser(paid);
    await adsService.setPaidUser(paid);
    setShowSubscriptionModal(false);
  };

  const handleRemoveAds = () => {
    setShowSubscriptionModal(true);
  };

  const handleProfilePress = () => {
    if (isAuthenticated && user) {
      Alert.alert(
        "Profile",
        `Welcome, ${user.name}!\n\nEmail: ${user.email}\nTimezone: ${user.timezone}`,
        [
          { text: "OK", style: "default" },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => await logout(),
          },
        ],
      );
    } else {
      Alert.alert(
        "Authentication",
        "You are using the app without an account. Your data is stored locally on this device.",
        [
          { text: "Continue", style: "default" },
          { text: "Sign In", onPress: () => router.replace("/login") },
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        {!isPaidUser && (
          <TouchableOpacity
            style={styles.removeAdsButton}
            onPress={handleRemoveAds}
            activeOpacity={0.8}
          >
            <Text style={styles.removeAdsText}>Remove Ads</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.8}
        >
          <Text style={styles.profileText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredTimers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No timer card to show</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTimers}
          renderItem={({ item }) => (
            <TimerCard timer={item} onTimerUpdate={loadTimers} />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {!isPaidUser && <BannerAdComponent style={styles.bannerAd} />}
  <FAB onPress={handleAddTimer} />
      <ConsentModal
        visible={showConsentModal}
        onConsentGiven={handleConsentGiven}
        onClose={() => setShowConsentModal(false)}
      />

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onPurchaseComplete={handleSubscriptionComplete}
      />

    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  removeAdsButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeAdsText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  profileButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  profileText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: { paddingBottom: 80, paddingHorizontal: 8 },
  columnWrapper: { justifyContent: "space-between" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: COLORS.text, fontSize: 16 },
  bannerAd: { marginTop: 10 },
});
