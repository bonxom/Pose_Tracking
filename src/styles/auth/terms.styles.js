import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  termsCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 12,
  },
  termsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  termsCardText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.subtext,
    textAlign: 'left',
  },
  termsButton: {
    height: 50,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  termsLink: {
    textAlign: 'center',
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  termsWebviewWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  termsWebview: {
    flex: 1,
  },
});

export default styles;
