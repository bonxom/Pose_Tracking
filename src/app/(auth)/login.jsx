import Screen from '@/components/common/Screen';
import baseStyles from '@/styles/auth/base.styles';
import loginStyles from '@/styles/auth/login.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';

const styles = { ...baseStyles, ...loginStyles };
const HEADER_IMAGE = require('../../../assets/images/headface.png');

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const signupIdentifier = useMemo(
    () => (typeof params.identifier === 'string' ? params.identifier : ''),
    [params.identifier]
  );

  const [identifier, setIdentifier] = useState(signupIdentifier);
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <Screen style={styles.container}>
      <Image source={HEADER_IMAGE} style={styles.headerImage} />

      <View style={styles.languageRow}>
        <Text style={styles.languageText}>English · 中文(台灣) ·</Text>
        <Text style={styles.languageLink}>Xem thêm...</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Số điện thoại hoặc email"
          placeholderTextColor="#94A3B8"
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Mật khẩu"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <Pressable style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Đăng nhập</Text>
      </Pressable>

      <Pressable style={styles.forgotRow}>
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>HOẶC</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable style={styles.createButton} onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.createText}>Tạo tài khoản Facebook mới</Text>
      </Pressable>
    </Screen>
  );
}
