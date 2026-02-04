import { COLORS } from '@/src/utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicy() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  const sections = [
    {
      number: "1",
      title: "Information Collection",
      content: "Timer for Life does NOT collect, store, transmit, sell, or share any personal information. The app does not require user accounts, logins, names, email addresses, phone numbers, location data, contacts, photos, biometric data, or identifiers of any kind."
    },
    {
      number: "2",
      title: "App Functionality",
      content: "Timer for Life functions entirely offline and locally on the user's device. All timer data, preferences, or settings remain on the device and are never transmitted externally."
    },
    {
      number: "3",
      title: "Data Sharing",
      content: "Timer for Life does not share data with third parties because no data is collected."
    },
    {
      number: "4",
      title: "Analytics & Tracking",
      content: "Timer for Life does not use analytics tools, advertising SDKs, trackers, cookies, or any third-party data collection frameworks."
    },
    {
      number: "5",
      title: "Permissions",
      content: "Timer for Life requests only the minimum permissions required for core timer functionality. No permissions are used to access personal data."
    },
    {
      number: "6",
      title: "Children's Privacy",
      content: "Timer for Life is safe for all ages. The app does not knowingly collect personal information from children under 13 or any other age group."
    },
    {
      number: "7",
      title: "Security",
      content: "Because no personal data is collected or transmitted, there is no risk of data breaches or misuse."
    },
    {
      number: "8",
      title: "Changes to This Policy",
      content: "If the app's functionality changes in a way that affects privacy, this policy will be updated accordingly."
    },
    {
      number: "9",
      title: "Contact Information",
      content: "If you have questions about this Privacy Policy, contact:\n\nNathan Reardon\nPO Box 52\nDetroit, ME 04929\nUnited States"
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.text} />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.subtitle}>Timer for Life</Text>
          </View>
          <View style={styles.placeholder} />
        </Animated.View>

        <Animated.View 
          style={[
            styles.effectiveDate,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 25]
              }) }]
            }
          ]}
        >
          <MaterialCommunityIcons name="shield-check" size={18} color={COLORS.primary} />
          <Text style={styles.effectiveDateText}>Effective Date: December 22, 2025</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.introBox,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <MaterialCommunityIcons name="shield-account" size={24} color={COLORS.primary} style={styles.introIcon} />
          <Text style={styles.introText}>
            Timer for Life respects user privacy and is committed to protecting it. This Privacy Policy explains how information is handled when you use the Timer for Life mobile application.
          </Text>
        </Animated.View>

        {sections.map((section, index) => (
          <Animated.View 
            key={section.number}
            style={[
              styles.sectionContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, index * 8]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumberBox}>
                <Text style={styles.sectionNumber}>{section.number}</Text>
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionText}>{section.content}</Text>
            </View>
          </Animated.View>
        ))}

        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.goBackButton} 
            onPress={() => router.back()} 
            activeOpacity={0.7}
          >
            <View style={styles.goBackButtonInner}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" style={styles.goBackIcon} />
              <Text style={styles.goBackText}>Go Back</Text>
              <MaterialCommunityIcons name="shield" size={16} color="#FFF" style={styles.shieldIcon} />
            </View>
          </TouchableOpacity>
          <Text style={styles.footerNote}>Your privacy is our priority</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  container: { 
    padding: 16, 
    paddingBottom: 40,
    backgroundColor: COLORS.background
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 4,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.text,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    letterSpacing: 1,
    textAlign: 'center',
    opacity: 0.8,
  },
  placeholder: { 
    width: 44 
  },
  effectiveDate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  effectiveDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  introBox: {
    
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  introIcon: {
    marginBottom: 12,
    alignSelf: 'center',
  },
  introText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 16,
   
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionNumberBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    letterSpacing: -0.3,
  },
  sectionContent: {},
  sectionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    fontWeight: '400',
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  goBackButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  goBackButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  goBackIcon: {
    marginRight: 10,
  },
  goBackText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shieldIcon: {
    marginLeft: 10,
    opacity: 0.8,
  },
  footerNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    opacity: 0.7,
    letterSpacing: 0.5,
  },
});