import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import Screen from '@/components/common/Screen';
import authStyles from '@/styles/auth.styles';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

export default function VerifyScreen() {
  const [code, setCode] = useState('');

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Xác minh</Text>
      <Text style={authStyles.subtitle}>
        Nhập mã xác minh đã được gửi tới email của bạn.
      </Text>

      <AppInput
        label="Mã xác minh"
        placeholder="Nhập 6 chữ số"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
      />

      <AppButton
        title="Xác nhận"
        onPress={() => router.replace('/(tabs)/home')}
      />
    </Screen>
  );
}