import AppButton from "@/components/common/AppButton";
import baseStyles from "@/styles/auth/base.styles";
import signupStyles from "@/styles/auth/signup.styles";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = { ...baseStyles, ...signupStyles };
const START_IMAGE = require("../../../assets/images/anhstart.png");

export default function SignupStartScreen() {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.welcomeTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={handleBack}
            style={styles.welcomeBackButton}
          >
            <Text style={styles.welcomeBackText}>←</Text>
          </Pressable>

          <Text style={styles.welcomeTopTitle}>Tạo tài khoản</Text>
        </View>
        <View style={styles.welcomeDivider} />

        <View style={styles.welcomeBody}>
          <Image source={START_IMAGE} style={styles.welcomeImage} resizeMode="contain" />
          <Text style={styles.welcomeTitle}>Tham gia Facebook</Text>
          <Text style={styles.welcomeDesc}>
            Chúng tôi sẽ giúp bạn tạo tài khoản mới sau vài bước dễ dàng.
          </Text>

          <View style={styles.welcomeButtonWrap}>
            <AppButton
              title="Tiếp"
              onPress={() => router.push("/(auth)/signup-profile")}
              style={styles.ctaButton}
              textStyle={styles.ctaText}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
