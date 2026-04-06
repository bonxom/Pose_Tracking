import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import Screen from '@/components/common/Screen';
import authStyles from '@/styles/auth.styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Đăng ký</Text>
      <Text style={authStyles.subtitle}>Tạo tài khoản mới để tiếp tục.</Text>

      <AppInput
        label="Họ và tên"
        placeholder="Nhập họ và tên"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />

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

      <AppButton
        title="Tiếp tục"
        onPress={() => router.push('/(auth)/verify')}
      />

      <Pressable
        style={authStyles.footer}
        onPress={() => router.back()}
      >
        <Text style={authStyles.footerText}>
          Đã có tài khoản? <Text style={authStyles.footerLink}>Đăng nhập</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}