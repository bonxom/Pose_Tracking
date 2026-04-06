import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  birthdayBody: {
    flex: 1,
    paddingTop: 14,
  },
  birthdayQuestion: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  birthdayPickerShell: {
    height: 220,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 10,
  },
  birthdayPickerHighlight: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 82,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.28,
  },
  birthdayColumns: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
  },
  birthdayColumnList: {
    flex: 1,
  },
  birthdayColumnContent: {
    paddingVertical: 82,
  },
  birthdayItem: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birthdayItemText: {
    fontSize: 18,
    color: COLORS.subtext,
    fontWeight: '500',
  },
  birthdayItemTextSelected: {
    color: COLORS.text,
    fontWeight: '700',
  },
  birthdayHint: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.subtext,
  },
  birthdayButtonWrap: {
    marginTop: 22,
  },
});

export default styles;
