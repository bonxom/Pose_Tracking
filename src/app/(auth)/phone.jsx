import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import Screen from '@/components/common/Screen';
import authStyles from '@/styles/auth/base.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

const VI_PHONE_REGEX = /^(0\d{9}|84\d{9}|\+84\d{9})$/;

function normalizePhone(rawPhone) {
  return rawPhone.replace(/[\s-]/g, '');
}

export default function SignupPhoneScreen() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const params = useLocalSearchParams();

  const fullName = typeof params.fullName === 'string' ? params.fullName : '';
  const birthDate = typeof params.birthDate === 'string' ? params.birthDate : '';
  const email = typeof params.email === 'string' ? params.email : '';

  const handleContinue = () => {
    const normalizedPhone = normalizePhone(phone.trim());

    if (!normalizedPhone) {
      setError('Vui lòng nhập số điện thoại.');
      return;
    }

    if (!VI_PHONE_REGEX.test(normalizedPhone)) {
      setError('Số điện thoại chưa đúng định dạng Việt Nam.');
      return;
    }

    setError('');
    router.push({
      pathname: '/(auth)/password',
      params: { fullName, birthDate, email, phone: normalizedPhone },
    });
  };

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Số điện thoại</Text>
      <Text style={authStyles.subtitle}>Nhập số điện thoại để bảo mật tài khoản tốt hơn.</Text>

      <AppInput
        label="Số điện thoại"
        placeholder="Ví dụ: 0912345678"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          if (error) setError('');
        }}
        keyboardType="phone-pad"
        error={error}
      />

      <AppButton title="Tiếp" onPress={handleContinue} />
    </Screen>
  );
}
