import {
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import colors from '../../constants/colors';
import sizes from '../../constants/sizes';

export default function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
  inputStyle,
  ...props
}) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, error ? styles.inputError : null, inputStyle]}
        {...props}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: sizes.lg,
  },
  label: {
    marginBottom: sizes.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    height: sizes.inputHeight,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    borderRadius: sizes.radiusMd,
    paddingHorizontal: sizes.lg,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    marginTop: sizes.xs,
    fontSize: 12,
    color: colors.error,
  },
});