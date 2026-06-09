import homeStyles from "@/styles/home.styles";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export default function FeedLoadingCard() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [animatedValue]);

  return (
    <Animated.View
      style={[
        homeStyles.loadingCard,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={homeStyles.loadingHeader}>
        <View style={homeStyles.loadingAvatar} />
        <View style={homeStyles.loadingMeta}>
          <View style={homeStyles.loadingLinePrimary} />
          <View style={homeStyles.loadingLineSecondary} />
        </View>
      </View>
      <View style={homeStyles.loadingBlock} />
      <View style={homeStyles.loadingLineTertiary} />
      <View style={homeStyles.loadingLineSecondary} />
    </Animated.View>
  );
}
