import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import sizes from '../constants/sizes';

const homeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: sizes.md,
    backgroundColor: "#F0F2F5",
  },
  headerCard: {
    backgroundColor: colors.white,
    borderBottomWidth: sizes.borderWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: sizes.sm,
    paddingTop: sizes.sm,
    paddingBottom: sizes.md,
    marginBottom: sizes.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.subtext,
    marginTop: sizes.xs,
  },
  sourceLabel: {
    alignSelf: "flex-start",
    marginTop: sizes.sm,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: sizes.md,
    paddingVertical: sizes.xs,
  },
  errorText: {
    marginTop: sizes.sm,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonSpacing: {
    height: sizes.md,
  },
});

export default homeStyles;
