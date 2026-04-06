import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  heroBlock: {
    marginBottom: 28,
  },
  nameHeroBlock: {
    marginBottom: 20,
  },
  nameCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameFormWrap: {
    marginTop: 6,
  },
  nameCol: {
    flex: 1,
  },
  nameInputWrap: {
    marginBottom: 0,
  },
  nameInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  nameTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  nameErrorText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.error,
  },
  nameStepBody: {
    flex: 1,
    paddingTop: 14,
  },
  nameStepQuestion: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 24,
  },
  nameStepInputWrap: {
    marginTop: 2,
  },
  nameInlineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInlineCol: {
    flex: 1,
  },
  nameInlineLabel: {
    fontSize: 13,
    color: COLORS.placeholder,
    marginBottom: 2,
  },
  nameInlineInput: {
    borderBottomWidth: 1.6,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontSize: 18,
    color: COLORS.text,
  },
  nameInlineInputFocused: {
    borderBottomColor: COLORS.primary,
  },
  nameInlineInputError: {
    borderBottomColor: COLORS.error,
  },
  nameStepInputContainer: {
    marginBottom: 0,
  },
  nameStepInput: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingBottom: 10,
    fontSize: 18,
  },
  nameStepButtonWrap: {
    marginTop: 28,
  },
});

export default styles;
