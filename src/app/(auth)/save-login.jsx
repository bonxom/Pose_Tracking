import baseStyles from '@/styles/auth/base.styles';
import miscStyles from '@/styles/auth/misc.styles';
import saveLoginStyles from '@/styles/auth/save-login.styles';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = { ...baseStyles, ...miscStyles, ...saveLoginStyles };
const AVATAR_IMAGE = require('../../../assets/images/white.png');

export default function SaveLoginScreen() {
  const params = useLocalSearchParams();
  const identifier = useMemo(
    () => (typeof params.identifier === 'string' ? params.identifier : ''),
    [params.identifier]
  );
  const fullName = useMemo(
    () => (typeof params.fullName === 'string' ? params.fullName : ''),
    [params.fullName]
  );

  const translateY = useRef(new Animated.Value(90)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const handleFinish = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        <Text style={styles.title}>Lưu thông tin đăng nhập của bạn</Text>
        <Text style={styles.subtitle}>
          {identifier
            ? `Lần tới khi đăng nhập vào ${identifier}, bạn chỉ cần nhấn OK để tiếp tục.`
            : 'Lần tới khi đăng nhập, bạn chỉ cần nhấn OK để tiếp tục.'}
        </Text>

        <View style={styles.illustrationShell}>
          <Animated.View style={[styles.illustrationCard, styles.phoneShadow, { opacity }]}>
            <View style={styles.illustrationOrb} />
            <Animated.View style={{ transform: [{ translateY }] }}>
              <View style={styles.phoneFrame}>
                <View style={styles.phoneNotch} />
                <View style={styles.phoneScreen}>
                  <View style={styles.phoneCard}>
                    <View style={styles.fbCircle}>
                      <Text style={styles.fbText}>f</Text>
                    </View>
                    <View style={styles.profileRow}>
                      <View style={styles.avatar}>
                        <Image source={AVATAR_IMAGE} style={styles.avatarImage} />
                      </View>
                      <Text style={styles.profileName}>
                        {fullName || identifier || 'Người dùng'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.actionButton, styles.actionGhost]} onPress={handleFinish}>
            <Text style={styles.actionGhostText}>Lúc khác</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.actionPrimary]} onPress={handleFinish}>
            <Text style={styles.actionPrimaryText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
