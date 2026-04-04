import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import sizes from '../constants/sizes';

const authStyles = StyleSheet.create({
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
    marginBottom: sizes.xxl,
  },
  footer: {
    marginTop: sizes.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.subtext,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  helperText: {
    marginTop: sizes.md,
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
  },
});

export default authStyles;