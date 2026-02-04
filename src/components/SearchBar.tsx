import { COLORS } from "@/src/utils/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  searchText: string;
  onSearchChange: (t: string) => void;
  onAddPress: () => void;
  onProfilePress: () => void;
  isAuthenticated: boolean;
  isPaidUser?: boolean;
  onRemoveAds?: () => void;
}

const SearchBar: React.FC<Props> = ({
  searchText,
  onSearchChange,
  onAddPress,
  onProfilePress,
  isAuthenticated,
  isPaidUser = false,
  onRemoveAds,
}) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={onProfilePress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={isAuthenticated ? "account-circle" : "account-circle-outline"}
          size={30}
          color={isAuthenticated ? COLORS.primary : COLORS.textSecondary}
        />
      </TouchableOpacity>

      <View style={styles.searchBox}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={COLORS.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Timers or Categories..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={onSearchChange}
        />
        {searchText?.length ? (
          <TouchableOpacity
            onPress={() => onSearchChange("")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color={COLORS.text} />
      </TouchableOpacity>

      {/* Remove Ads Button - Show for free users */}
      {!isPaidUser && onRemoveAds && (
        <TouchableOpacity
          style={styles.removeAdsButton}
          onPress={onRemoveAds}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="crown"
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.removeAdsText}>Remove Ads</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  profileButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
    paddingVertical: 0,
    marginRight: 6,
  },
  addButton: {
    marginLeft: 14,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 9,
  },
  removeAdsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  removeAdsText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default SearchBar;
