import { Text } from 'react-native';
import Screen from '../../components/common/Screen';
import homeStyles from '../../styles/home.styles';

export default function PostDetailScreen() {
  return (
    <Screen style={homeStyles.container}>
      <Text style={homeStyles.title}>Post Detail</Text>
    </Screen>
  );
}