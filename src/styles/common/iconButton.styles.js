import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default styles;
