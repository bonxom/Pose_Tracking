import AppButton from '@/components/common/AppButton';
import COLORS from '@/constants/colors';
import baseStyles from '@/styles/auth/base.styles';
import nameStyles from '@/styles/auth/name.styles';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable,  StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = { ...baseStyles, ...nameStyles };

export default function SignupNameScreen() {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [activeField, setActiveField] = useState('lastName');
  const [error, setError] = useState('');
  const firstNameRef = useRef(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/signup');
  };

  const handleNext = () => {
    const trimmedLastName = lastName.trim();
    const trimmedFirstName = firstName.trim();

    if (!trimmedLastName || !trimmedFirstName) {
      setError('Vui lòng nhập đầy đủ Họ và Tên.');
      return;
    }

    setError('');
    router.push({
      pathname: '/(auth)/birthday',
      params: { fullName: `${trimmedLastName} ${trimmedFirstName}` },
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

          <Text style={styles.signupHeaderTitle}>Tên</Text>
        </View>

        <View style={styles.nameStepBody}>
          <Text style={styles.nameStepQuestion}>Bạn tên gì?</Text>

          <View style={styles.nameStepInputWrap}>
            <View style={styles.nameInlineRow}>
              <View style={styles.nameInlineCol}>
                <Text style={styles.nameInlineLabel}>Họ</Text>
                <TextInput
                  placeholder="Họ"
                  placeholderTextColor={COLORS.placeholder}
                  value={lastName}
                  onChangeText={(value) => {
                    setLastName(value);
                    if (error) setError('');
                  }}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="next"
                  onFocus={() => setActiveField('lastName')}
                  onSubmitEditing={() => firstNameRef.current?.focus()}
                  style={[
                    styles.nameInlineInput,
                    activeField === 'lastName' && styles.nameInlineInputFocused,
                    !!error && styles.nameInlineInputError,
                  ]}
                />
              </View>

              <View style={styles.nameInlineCol}>
                <Text style={styles.nameInlineLabel}>Tên</Text>
                <TextInput
                  ref={firstNameRef}
                  placeholder="Tên"
                  placeholderTextColor={COLORS.placeholder}
                  value={firstName}
                  onChangeText={(value) => {
                    setFirstName(value);
                    if (error) setError('');
                  }}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onFocus={() => setActiveField('firstName')}
                  onSubmitEditing={handleNext}
                  style={[
                    styles.nameInlineInput,
                    activeField === 'firstName' && styles.nameInlineInputFocused,
                    !!error && styles.nameInlineInputError,
                  ]}
                />
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={styles.nameStepButtonWrap}>
            <AppButton
              title="Tiếp"
              onPress={handleNext}
              style={styles.ctaButton}
              textStyle={styles.ctaText}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
