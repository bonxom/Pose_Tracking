import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  emailBody: {
    flex: 1,
    paddingTop: 16,
  },
  emailQuestion: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  emailInputRow: {
    marginTop: 12,
    borderBottomWidth: 1.6,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInputRowFocused: {
    borderBottomColor: COLORS.primary,
  },
  emailInputRowError: {
    borderBottomColor: COLORS.error,
  },
  emailInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 17,
    color: COLORS.text,
  },
  emailInputFocused: {
    color: COLORS.text,
  },
  emailInputError: {
    color: COLORS.error,
  },
  emailClearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailClearButtonText: {
    fontSize: 20,
    lineHeight: 20,
    color: COLORS.subtext,
  },
  emailButtonWrap: {
    marginTop: 28,
  },
});

export default styles;
