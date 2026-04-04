import AppButton from '@/components/common/AppButton';
import baseStyles from '@/styles/auth/base.styles';
import termsStyles from '@/styles/auth/terms.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable,  StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const POLICY_URL = 'https://www.facebook.com/privacy/policy/';
const styles = { ...baseStyles, ...termsStyles };

export default function SignupTermsScreen() {
  const params = useLocalSearchParams();
  const fullName = typeof params.fullName === 'string' ? params.fullName : '';
  const birthDate = typeof params.birthDate === 'string' ? params.birthDate : '';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/birthday');
  };

  const handleAgree = () => {
    router.push({
      pathname: '/(auth)/email',
      params: { fullName, birthDate },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.signupHeaderRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={handleBack}
            style={styles.signupBackButton}
          >
            <Text style={styles.signupBackText}>←</Text>
          </Pressable>

          <Text style={styles.signupHeaderTitle}>Điều khoản & quyền riêng tư</Text>
        </View>

        <View style={styles.termsCard}>
          <Text style={styles.termsCardTitle}>Hoàn tất đăng ký</Text>
          <Text style={styles.termsCardText}>
            Bằng cách nhấn vào Đăng ký, bạn đồng ý với Điều khoản, Chính sách dữ liệu và Chính
            sách cookie của chúng tôi.
          </Text>

          <AppButton
            title="Đồng ý"
            onPress={handleAgree}
            style={[styles.ctaButton, styles.termsButton]}
            textStyle={styles.ctaText}
          />

          <Pressable onPress={handleAgree}>
            <Text style={styles.termsLink}>Đăng ký mà không tải danh bạ của tôi lên</Text>
          </Pressable>
        </View>

        <View style={styles.termsWebviewWrap}>
          <WebView source={{ uri: POLICY_URL }} style={styles.termsWebview} />
        </View>
      </View>
    </SafeAreaView>
  );
}
