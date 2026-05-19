import postStyles from "@/styles/post.styles";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export default function SkeletonComment() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[postStyles.commentCard, { opacity }]}>
      <View
        style={{
          width: 120,
          height: 16,
          backgroundColor: "#e2e8f0",
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <View
        style={{
          width: "100%",
          height: 14,
          backgroundColor: "#f1f5f9",
          borderRadius: 4,
          marginBottom: 4,
        }}
      />
      <View
        style={{
          width: "80%",
          height: 14,
          backgroundColor: "#f1f5f9",
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <View
        style={{
          width: 60,
          height: 12,
          backgroundColor: "#cbd5e1",
          borderRadius: 4,
        }}
      />
    </Animated.View>
  );
}
