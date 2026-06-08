import sizes from "@/constants/sizes";
import { StyleSheet, View } from 'react-native';
import colors from '../../constants/colors';

export default function Screen({ children, style }) {
  return (
    <View style={[styles.container, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: sizes.lg,
    backgroundColor: colors.background,
  },
});