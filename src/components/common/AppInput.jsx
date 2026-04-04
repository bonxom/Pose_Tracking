import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import COLORS from '../../constants/colors';
import styles from '../../styles/common/input.styles';

const AppInput = forwardRef(function AppInput({
  label,
  error,
  containerStyle,
  hideErrorText = false,
  style,
  onFocus,
  onBlur,
  ...props
}, ref) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={[styles.inputWrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        ref={ref}
        {...props}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={COLORS.placeholder}
      />

      {!!error && !hideErrorText && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

export default AppInput;
