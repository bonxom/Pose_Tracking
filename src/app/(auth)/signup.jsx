import AppButton from '../../components/common/AppButton';
import { router } from 'expo-router';
import { Image, Pressable,  StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import baseStyles from '../../styles/auth/base.styles';
import signupStyles from '../../styles/auth/signup.styles';

const styles = { ...baseStyles, ...signupStyles };

export default function SignupScreen() {
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    router.push('/(auth)/name');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
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
          <Image
            source={require('../../../assets/images/anhstart.png')}
            style={styles.welcomeImage}
            resizeMode="contain"
          />

          <Text style={styles.welcomeTitle}>Tham gia Facebook</Text>
          <Text style={styles.welcomeDesc}>
            Chúng tôi sẽ giúp bạn tạo tài khoản mới sau vài bước dễ dàng.
          </Text>

          <View style={styles.welcomeButtonWrap}>
            <AppButton
              title="Tiếp"
              onPress={handleNext}
              style={styles.ctaButton}
              textStyle={styles.ctaText}
            />
          </View>
        </View>

        <View style={styles.welcomeBottomHint}>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerText}>
              Bạn đã có tài khoản? <Text style={styles.footerLink}>Đăng nhập</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
