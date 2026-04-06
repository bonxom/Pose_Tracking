import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import Screen from '@/components/common/Screen';
import authStyles from '@/styles/auth/base.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const params = useLocalSearchParams();
  const fullName = typeof params.fullName === 'string' ? params.fullName : '';
  const birthDate = typeof params.birthDate === 'string' ? params.birthDate : '';
  const identifierType = typeof params.identifierType === 'string' ? params.identifierType : '';
  const identifierValue = typeof params.identifierValue === 'string' ? params.identifierValue : '';

  const handleVerify = () => {
    const normalizedCode = code.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('Mã xác minh phải gồm đúng 6 chữ số.');
      return;
    }

    setError('');
    router.push({
      pathname: '/(auth)/password',
      params: { fullName, birthDate, identifierType, identifierValue },
    });
  };

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Xác minh</Text>
      <Text style={authStyles.subtitle}>
        {identifierValue
          ? `Nhập mã xác minh đã được gửi tới ${identifierValue}.`
          : 'Nhập mã xác minh đã được gửi tới email hoặc số điện thoại của bạn.'}
      </Text>

      <AppInput
        label="Mã xác minh"
        placeholder="Nhập 6 chữ số"
        value={code}
        onChangeText={(value) => {
          setCode(value);
          if (error) setError('');
        }}
        keyboardType="number-pad"
        maxLength={6}
        error={error}
      />

      <AppButton
        title="Xác nhận"
        onPress={handleVerify}
      />
    </Screen>
  );
}
