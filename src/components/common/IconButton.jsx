import React from 'react';
import { Pressable, View } from 'react-native';
import colors from '@/constants/colors';
import styles from '@/styles/common/iconButton.styles';

export default function IconButton({
  icon,
  children,
  onPress,
  disabled = false,
  style,
  backgroundColor = colors.gray,
  ...props
}) {
  if (!onPress) {
    return (
      <View
        style={[
          styles.button,
          { backgroundColor },
          style,
        ]}
        {...props}
      >
        {icon || children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {icon || children}
    </Pressable>
  );
}
