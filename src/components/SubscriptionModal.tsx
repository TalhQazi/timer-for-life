import subscriptionService from "@/src/services/subscriptionService";
import { COLORS } from "@/src/utils/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  onPurchaseComplete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    "monthly" | "lifetime" | null
  >(null);

  const handlePurchaseMonthly = async () => {
    setIsProcessing(true);
    setSelectedPlan("monthly");

    try {
      const result = await subscriptionService.purchaseMonthlySubscription();
      if (result.success) {
        Alert.alert(
          "Success",
          "Monthly subscription purchased successfully! Enjoy your ad-free experience.",
          [{ text: "OK", onPress: () => onPurchaseComplete() }],
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to purchase monthly subscription",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handlePurchaseLifetime = async () => {
    setIsProcessing(true);
    setSelectedPlan("lifetime");

    try {
      const result = await subscriptionService.purchaseLifetimeUnlock();
      if (result.success) {
        Alert.alert(
          "Success",
          "Lifetime unlock purchased successfully! Enjoy your ad-free experience forever.",
          [{ text: "OK", onPress: () => onPurchaseComplete() }],
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to purchase lifetime unlock",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const result = await subscriptionService.restorePurchases();
      if (result.success) {
        Alert.alert(
          "Success",
          "Your purchases have been restored successfully!",
          [{ text: "OK", onPress: () => onPurchaseComplete() }],
        );
      } else {
        Alert.alert("Error", result.error || "Failed to restore purchases");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while restoring purchases.",
      );
    }
  };

  const monthlyPrice = subscriptionService.getSubscriptionPrice("monthly");
  const lifetimePrice = subscriptionService.getSubscriptionPrice("lifetime");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons
                name="crown"
                size={32}
                color={COLORS.primary}
              />
              <Text style={styles.title}>Remove Ads</Text>
            </View>
            <Text style={styles.subtitle}>
              Enjoy an uninterrupted, ad-free experience
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color="#666666"
              />
            </TouchableOpacity>
          </View>

          {/* Plans Comparison */}
          <View style={styles.plansComparison}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Features</Text>
              <View style={styles.comparisonColumns}>
                <Text style={styles.comparisonPlan}>Free</Text>
                <Text style={styles.comparisonPlan}>Premium</Text>
              </View>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Banner Ads</Text>
              <View style={styles.comparisonColumns}>
                <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
                <MaterialCommunityIcons name="check" size={20} color="#34C759" />
              </View>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Interstitial Ads</Text>
              <View style={styles.comparisonColumns}>
                <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
                <MaterialCommunityIcons name="check" size={20} color="#34C759" />
              </View>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Video Ads</Text>
              <View style={styles.comparisonColumns}>
                <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
                <MaterialCommunityIcons name="check" size={20} color="#34C759" />
              </View>
            </View>
          </View>

          {/* Plan Cards */}
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            
            <View style={styles.plansContainer}>
              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === "monthly" && styles.selectedPlanCard,
                ]}
                onPress={handlePurchaseMonthly}
                disabled={isProcessing}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>POPULAR</Text>
                </View>
                <View style={styles.planHeader}>
                  <MaterialCommunityIcons
                    name="calendar-month"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.planTitle}>Monthly</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.planPrice}>${monthlyPrice}</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>
                <Text style={styles.planDescription}>
                  Cancel anytime • Ad-free experience
                </Text>
                <View style={styles.savingsTag}>
                  <Text style={styles.savingsText}>Save 50% vs yearly</Text>
                </View>
                {selectedPlan === "monthly" && isProcessing ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                    style={styles.loader}
                  />
                ) : (
                  <Text style={styles.planButtonText}>
                    {selectedPlan === "monthly" && isProcessing ? "Processing..." : "Get Monthly Plan"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Lifetime Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  styles.lifetimePlanCard,
                  selectedPlan === "lifetime" && styles.selectedPlanCard,
                ]}
                onPress={handlePurchaseLifetime}
                disabled={isProcessing}
              >
                <View style={[styles.planBadge, styles.lifetimeBadge]}>
                  <MaterialCommunityIcons
                    name="star"
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.planBadgeText}>BEST VALUE</Text>
                </View>
                <View style={styles.planHeader}>
                  <MaterialCommunityIcons
                    name="infinity"
                    size={24}
                    color="#FF9500"
                  />
                  <Text style={[styles.planTitle, styles.lifetimeTitle]}>
                    Lifetime
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, styles.lifetimePrice]}>
                    ${lifetimePrice}
                  </Text>
                </View>
                <Text style={styles.planDescription}>
                  One-time payment • Forever ad-free
                </Text>
                <View style={styles.savingsTag}>
                  <Text style={styles.savingsText}>Save 80% overall</Text>
                </View>
                {selectedPlan === "lifetime" && isProcessing ? (
                  <ActivityIndicator
                    size="small"
                    color="#FF9500"
                    style={styles.loader}
                  />
                ) : (
                  <Text style={styles.planButtonText}>
                    {selectedPlan === "lifetime" && isProcessing ? "Processing..." : "Get Lifetime"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Features List */}
            <View style={styles.features}>
              <Text style={styles.featuresTitle}>What you get:</Text>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.featureText}>Complete ad removal</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="rocket-launch"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.featureText}>Faster app performance</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="heart"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.featureText}>Support continued development</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestorePurchases}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={16}
                  color={COLORS.primary}
                />
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
              
              <Text style={styles.footerText}>
                Subscription automatically renews unless canceled 24 hours before the end of the current period.
              </Text>
              <Text style={styles.footerLinks}>
                By subscribing, you agree to our{' '}
                <Text style={styles.link}>Terms</Text> and{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  header: {
    backgroundColor: "#F8F9FA",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    position: "relative",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  plansComparison: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 2,
  },
  comparisonColumns: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  comparisonPlan: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  comparisonFeature: {
    fontSize: 14,
    color: "#666666",
    flex: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
    textAlign: "center",
  },
  plansContainer: {
    marginBottom: 28,
    gap: 16,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 16,
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
    position: "relative",
  },
  planBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  lifetimeBadge: {
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lifetimePlanCard: {
    borderColor: "#FF9500",
    backgroundColor: "#FFF9F0",
  },
  selectedPlanCard: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F7FF",
    transform: [{ scale: 1.02 }],
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginLeft: 8,
  },
  lifetimeTitle: {
    color: "#FF9500",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.primary,
  },
  planPeriod: {
    fontSize: 16,
    color: "#666666",
    marginLeft: 4,
  },
  lifetimePrice: {
    color: "#FF9500",
  },
  planDescription: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  savingsTag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "600",
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    textAlign: "center",
  },
  loader: {
    marginVertical: 12,
  },
  features: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#444444",
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
    paddingTop: 20,
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 12,
  },
  footerLinks: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
});

export default SubscriptionModal;