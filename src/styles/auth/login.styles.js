import { StyleSheet } from 'react-native';
import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  languageText: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  languageLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
  },
  input: {
    fontSize: 15,
    color: COLORS.text,
  },
  loginButton: {
    marginTop: 18,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  forgotRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: COLORS.subtext,
    fontWeight: '600',
  },
  createButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default styles;
