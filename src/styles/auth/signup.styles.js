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
});

export default styles;
