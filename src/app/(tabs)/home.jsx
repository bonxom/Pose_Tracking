import AppButton from '@/components/common/AppButton';
import Screen from '@/components/common/Screen';
import homeStyles from '@/styles/home.styles';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <Screen style={homeStyles.container}>
      <Text style={homeStyles.title}>Home</Text>
      <Text style={homeStyles.subtitle}>Trang chính của ứng dụng.</Text>

      <AppButton
        title="Xem chi tiết bài viết"
        onPress={() => router.push('/post/1')}
      />

      <View style={homeStyles.buttonSpacing} />

      <AppButton
        title="Mở bình luận"
        onPress={() => router.push('/comment/1')}
      />

      <View style={homeStyles.buttonSpacing} />

      <AppButton
        title="Đăng xuất"
        onPress={() => router.replace('/(auth)/login')}
      />
    </Screen>
  );
}