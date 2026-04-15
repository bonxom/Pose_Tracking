import baseStyles from "@/styles/auth/base.styles";
import signupStyles from "@/styles/auth/signup.styles";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = { ...baseStyles, ...signupStyles };
const AVATAR_IMAGE = require("../../../assets/images/white.png");

export default function SignupSuccessScreen() {
  const params = useLocalSearchParams();
  const username =
    typeof params.username === "string" ? params.username : "";

  const translateY = useRef(new Animated.Value(120)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fade, translateY]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.successScreen}>
        <View style={styles.successContent}>
          <View style={styles.successHeader}>
            <Text style={styles.successTitle}>Lưu thông tin đăng nhập của bạn</Text>
            <Text style={styles.successSubtitle}>
              Lần tới khi đăng nhập vào điện thoại này, bạn chỉ cần nhấn vào ảnh đại
              diện thay vì nhập mật khẩu.
            </Text>
          </View>

          <Animated.View
            style={[
              styles.successImageWrap,
              { opacity: fade, transform: [{ translateY }] },
            ]}
          >
            <View style={styles.successPhone}>
              <View style={styles.successPhoneOuter}>
                <View style={styles.successPhoneScreen}>
                  <View style={styles.successPhoneCamera} />
                  <View style={styles.successPhoneSpeaker} />
                  <View style={styles.successFacebookBadge}>
                    <Text style={styles.successFacebookText}>f</Text>
                  </View>

                  <View style={styles.successAvatarRow}>
                    <View style={styles.successAvatar}>
                      <Image
                        source={AVATAR_IMAGE}
                        style={styles.successAvatarImage}
                        resizeMode="cover"
                      />
                    </View>
                    {!!username && (
                      <Text style={styles.successName}>{username}</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.successFooter}>
          <View style={styles.successDivider} />
          <View style={styles.successActionRow}>
            <Text
              style={styles.successActionMuted}
              onPress={() => router.replace("/(tabs)/home")}
            >
              Lúc khác
            </Text>
            <View style={styles.successActionSeparator} />
            <Text
              style={styles.successActionPrimary}
              onPress={() => router.replace("/(tabs)/home")}
            >
              OK
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
