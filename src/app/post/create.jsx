import { Text } from 'react-native';
import Screen from '../../components/common/Screen';
import homeStyles from '../../styles/home.styles';

export default function CreatePostScreen() {
  return (
    <Screen style={homeStyles.container}>
      <Text style={homeStyles.title}>Create Post</Text>
    </Screen>
  );
}