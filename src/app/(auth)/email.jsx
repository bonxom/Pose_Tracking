import AppButton from '@/components/common/AppButton';
import COLORS from '@/constants/colors';
import baseStyles from '@/styles/auth/base.styles';
import emailStyles from '@/styles/auth/email.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const styles = { ...baseStyles, ...emailStyles };
const REGISTERED_EMAILS = ['nguyenthanh@soict.hust.edu.vn'];
const REGISTERED_PHONES = ['0912345678'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VI_PHONE_REGEX = /^(0\d{9}|84\d{9}|\+84\d{9})$/;

function normalizePhone(value) {
  return value.replace(/[\s-]/g, '');
}

function detectIdentifier(rawValue) {
  const value = rawValue.trim();
  if (!value) {
    return { type: '', value: '' };
  }

  const normalizedEmail = value.toLowerCase();
  if (EMAIL_REGEX.test(normalizedEmail)) {
    return { type: 'email', value: normalizedEmail };
  }

  const normalizedPhone = normalizePhone(value);
  if (VI_PHONE_REGEX.test(normalizedPhone)) {
    return { type: 'phone', value: normalizedPhone };
  }

  return { type: 'invalid', value };
}

export default function SignupEmailScreen() {
  const params = useLocalSearchParams();
  const fullName = typeof params.fullName === 'string' ? params.fullName : '';
  const birthDate = typeof params.birthDate === 'string' ? params.birthDate : '';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const identifier = useMemo(() => detectIdentifier(email), [email]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/terms');
  };

  const handleContinue = () => {
    if (!identifier.value) {
      setError('Vui lòng nhập email hoặc số điện thoại của bạn.');
      return;
    }

    if (identifier.type === 'invalid') {
      setError('Email hoặc số điện thoại chưa đúng định dạng.');
      return;
    }

    if (identifier.type === 'email' && REGISTERED_EMAILS.includes(identifier.value)) {
      setError('Hiện đã có tài khoản liên kết với email này.');
      return;
    }

    if (identifier.type === 'phone' && REGISTERED_PHONES.includes(identifier.value)) {
      setError('Hiện đã có tài khoản liên kết với số điện thoại này.');
      return;
    }

    setError('');
    router.push({
      pathname: '/(auth)/verify',
      params: {
        fullName,
        birthDate,
        identifierType: identifier.type,
        identifierValue: identifier.value,
      },
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

          <Text style={styles.signupHeaderTitle}>Địa chỉ email</Text>
        </View>

        <View style={styles.emailBody}>
          <Text style={styles.emailQuestion}>Nhập email hoặc số điện thoại của bạn</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View
            style={[
              styles.emailInputRow,
              focused && styles.emailInputRowFocused,
              !!error && styles.emailInputRowError,
            ]}
          >
            <TextInput
              placeholder="Email hoặc số điện thoại"
              placeholderTextColor={COLORS.placeholder}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (error) setError('');
              }}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              style={[
                styles.emailInput,
                focused && styles.emailInputFocused,
                !!error && styles.emailInputError,
              ]}
            />

            {!!email && (
              <Pressable onPress={() => setEmail('')} style={styles.emailClearButton}>
                <Text style={styles.emailClearButtonText}>×</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.emailButtonWrap}>
            <AppButton
              title="Tiếp"
              onPress={handleContinue}
              style={styles.ctaButton}
              textStyle={styles.ctaText}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
