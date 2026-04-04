import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';
import sizes from '../../constants/sizes';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
  },
  signupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },
  signupBackButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  signupBackText: {
    fontSize: 22,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: '600',
  },
  signupHeaderTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.subtext,
  },
  footerBlock: {
    marginTop: 'auto',
    paddingBottom: 8,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignSelf: 'stretch',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  footerLinkWrap: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  footer: {
    marginTop: sizes.xl,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.error,
  },
});

export default styles;
