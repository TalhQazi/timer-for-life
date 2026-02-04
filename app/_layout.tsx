import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/src/contexts/AuthContext";
import adsService from "@/src/services/adsService";
import consentService from "@/src/services/consentService";
import notificationService from "@/src/services/notificationService";
import subscriptionService from "@/src/services/subscriptionService";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize all services
        await Promise.all([
          notificationService.initialize(),
          adsService.initialize(),
          subscriptionService.initialize(),
          consentService.initialize(),
        ]);

        // Sync subscription status with ads service
        const isPaidUser = subscriptionService.isPaidUser();
        await adsService.setPaidUser(isPaidUser);

        // Set ad consent status
        const hasConsent = consentService.hasConsented();
        await adsService.setAdConsent(hasConsent);

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing services:", error);
        setIsInitialized(true); // Still allow app to function
      }
    };

    initializeServices();

    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      try {
        router.replace("/home");
      } catch {}
    });
    return () => {
      try {
        sub.remove();
      } catch {}
    };
  }, []);

  if (!isInitialized) {
    // You could show a loading screen here if needed
    return null;
  }
// now gioing to the return statemnet
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="add-timer" options={{ headerShown: false }} />
          <Stack.Screen
            name="privacy-policy"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
