import adsService from "@/src/services/adsService";
import React from "react";
import { NativeModules, Platform, View } from "react-native";

interface Props {
  style?: any;
  size?: any;
}

const BannerAdComponent: React.FC<Props> = ({ style, size }) => {
  if (Platform.OS === "web") return null;
  if (!adsService.shouldShowAds()) return null;

  // If you are running in Expo Go (or a dev-client binary without the native module),
  // importing `react-native-google-mobile-ads` will crash immediately.
  if (!(NativeModules as any)?.RNGoogleMobileAdsModule) return null;

  let BannerAd: any;
  let BannerAdSize: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const gma = require("react-native-google-mobile-ads");
    BannerAd = gma?.BannerAd;
    BannerAdSize = gma?.BannerAdSize;
  } catch {
    return null;
  }

  if (!BannerAd || !BannerAdSize) return null;

  const resolvedSize = size ?? BannerAdSize.BANNER;

  return (
    <View style={style}>
      <BannerAd
        unitId={adsService.getAdUnitId("banner")}
        size={resolvedSize}
        requestOptions={adsService.getAdRequestOptions()}
      />
    </View>
  );
};

export default BannerAdComponent;
