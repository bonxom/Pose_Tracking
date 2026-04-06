import Screen from '@/components/common/Screen';
import homeStyles from '@/styles/home.styles';
import { Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <Screen style={homeStyles.container}>
      <Text style={homeStyles.title}>Profile</Text>
      <Text style={homeStyles.subtitle}>Trang hồ sơ cá nhân.</Text>
    </Screen>
  );
}