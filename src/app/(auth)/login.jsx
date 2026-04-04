import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import Screen from '@/components/common/Screen';
import authStyles from '@/styles/auth.styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Đăng nhập</Text>
      <Text style={authStyles.subtitle}>Chào mừng bạn quay lại.</Text>

      <AppInput
        label="Email"
        placeholder="Nhập email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <AppInput
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <AppButton title="Đăng nhập" onPress={handleLogin} />

      <Pressable
        style={authStyles.footer}
        onPress={() => router.push('/(auth)/signup')}
      >
        <Text style={authStyles.footerText}>
          Chưa có tài khoản? <Text style={authStyles.footerLink}>Đăng ký</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}