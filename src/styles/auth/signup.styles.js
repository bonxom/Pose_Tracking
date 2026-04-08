import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  welcomeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  welcomeBackButton: {
    width: 28,
    height: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  welcomeBackText: {
    fontSize: 22,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: '600',
  },
  welcomeTopTitle: {
    marginLeft: 10,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: COLORS.text,
  },
  welcomeDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 10,
  },
  welcomeBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 26,
  },
  welcomeImage: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeDesc: {
    fontSize: 19,
    lineHeight: 28,
    color: COLORS.subtext,
    textAlign: 'center',
    maxWidth: 320,
  },
  welcomeButtonWrap: {
    marginTop: 26,
    width: '100%',
    maxWidth: 360,
  },
  welcomeBottomHint: {
    alignItems: 'center',
    paddingBottom: 6,
  },

  // Form styles
  formBody: {
    flex: 1,
    marginTop: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 8,
    marginRight: -8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  roleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },

  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    marginTop: 24,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  errorText: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 13,
    color: COLORS.error,
  },
});

export default styles;
