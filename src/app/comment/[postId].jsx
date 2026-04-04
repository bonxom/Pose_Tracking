import { Text } from 'react-native';
import Screen from '../../components/common/Screen';
import homeStyles from '../../styles/home.styles';

export default function CommentScreen() {
  return (
    <Screen style={homeStyles.container}>
      <Text style={homeStyles.title}>Comments</Text>
    </Screen>
  );
}