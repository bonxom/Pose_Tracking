import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';
import Screen from '@/components/common/Screen';
import authStyles from '@/styles/auth/base.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function getPasswordError(password, confirmPassword) {
  if (!password) {
    return 'Vui lòng tạo mật khẩu.';
  }

  if (!PASSWORD_REGEX.test(password)) {
    return 'Mật khẩu tối thiểu 8 ký tự, gồm chữ và số.';
  }

  if (password !== confirmPassword) {
    return 'Mật khẩu nhập lại chưa khớp.';
  }

  return '';
}

export default function SignupPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const params = useLocalSearchParams();
  const identifierValue = typeof params.identifierValue === 'string' ? params.identifierValue : '';
  const fullName = typeof params.fullName === 'string' ? params.fullName : '';

  const handleCreateAccount = () => {
    const validationError = getPasswordError(password.trim(), confirmPassword.trim());

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    router.push({
      pathname: '/(auth)/save-login',
      params: { identifier: identifierValue, fullName },
    });
  };

  return (
    <Screen style={authStyles.container}>
      <Text style={authStyles.title}>Tạo mật khẩu</Text>
      <Text style={authStyles.subtitle}>Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ và số.</Text>

      <AppInput
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (error) setError('');
        }}
        secureTextEntry
      />

      <AppInput
        label="Nhập lại mật khẩu"
        placeholder="Nhập lại mật khẩu"
        value={confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value);
          if (error) setError('');
        }}
        secureTextEntry
        error={error}
      />

      <AppButton title="Tạo tài khoản" onPress={handleCreateAccount} />
    </Screen>
  );
}
