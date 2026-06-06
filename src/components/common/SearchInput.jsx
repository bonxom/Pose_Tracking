import ProfileIcon from "@/components/icons/ProfileIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import colors from "@/constants/colors";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

export default function SearchInput({
  value,
  onChangeText,
  placeholder = "Tìm kiếm",
  onSubmitEditing,
  onClear,
  style,
  autoFocus = true,
  ...props
}) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[styles.input, style]}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        {...props}
      />
      <View style={styles.iconContainer} pointerEvents="none">
        <SearchIcon size={24} color={colors.subtext} />
      </View>
      {value ? (
        <Pressable style={styles.clearButton} onPress={onClear}>
          <ProfileIcon name="close" size={18} color={colors.subtext} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  input: {
    minHeight: 40,
    borderRadius: 20,
    paddingLeft: 38,
    paddingRight: 16,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.searchInput,
  },
  iconContainer: {
    position: "absolute",
    left: 8,
  },
  clearButton: {
    position: "absolute",
    right: 12,
  },
});
