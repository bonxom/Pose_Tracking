import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import sizes from '../constants/sizes';

const homeStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginBottom: sizes.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: sizes.xl,
  },
  buttonSpacing: {
    height: sizes.md,
  },
});

export default homeStyles;
