import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
} from 'react-native';
import colors from '../../constants/colors';
import sizes from '../../constants/sizes';

export default function AppButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: sizes.buttonHeight,
    borderRadius: sizes.radiusMd,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});