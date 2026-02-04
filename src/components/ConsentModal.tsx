import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/utils/constants';
import consentService from '@/src/services/consentService';

interface ConsentModalProps {
  visible: boolean;
  onConsentGiven: (accepted: boolean) => void;
  onClose: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  visible,
  onConsentGiven,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await consentService.setConsent('accepted');
      onConsentGiven(true);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save consent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await consentService.setConsent('rejected');
      onConsentGiven(false);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save consent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyPolicy = async () => {
    try {
      const url = consentService.getPrivacyPolicyUrl();
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open privacy policy URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open privacy policy');
    }
  };

  const consentText = consentService.getConsentText();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.primary} />
            <Text style={styles.title}>{consentText.title}</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.message}>{consentText.message}</Text>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="information" size={20} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>
                  Personalized ads use your data to show relevant advertisements
                </Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="shield-off" size={20} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>
                  Non-personalized ads don't use your personal data for targeting
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.privacyLink} onPress={handlePrivacyPolicy}>
              <Text style={styles.privacyLinkText}>Read our Privacy Policy</Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}
              disabled={isLoading}
            >
              <Text style={styles.rejectButtonText}>{consentText.rejectText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isLoading}
            >
              <Text style={styles.acceptButtonText}>{consentText.acceptText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  privacyLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
    marginRight: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  rejectButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ConsentModal;
