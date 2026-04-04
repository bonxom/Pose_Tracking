import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 24,
  },
  illustrationShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: 220,
    height: 360,
    borderRadius: 26,
    backgroundColor: '#111111',
    alignItems: 'center',
    paddingTop: 14,
  },
  phoneNotch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E1E1E',
    marginBottom: 8,
  },
  phoneScreen: {
    width: 196,
    height: 320,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  phoneCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingTop: 22,
    paddingHorizontal: 16,
  },
  fbCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  fbText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: COLORS.background,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneShadow: {
    shadowColor: COLORS.black,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGhost: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionGhostText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionPrimaryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default styles;
