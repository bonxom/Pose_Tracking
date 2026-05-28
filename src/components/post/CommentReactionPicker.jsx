import colors from "@/constants/colors";
import sizes from "@/constants/sizes";
import { Pressable, StyleSheet, Text, View } from "react-native";

const REACTION_OPTIONS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😡",
  "🔥",
  "👏",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "✋",
  "😐",
  "🤚",
  "🙌",
  "3️⃣",
  "6️⃣",
  "🤡",
  "👀",
  "💀",
  "🫠",
  "🫃",
  "🫡",
  "🐸",
  "🗿",
  "🍿",
  "🫵",
  "🤌",
  "💩",
];

export default function CommentReactionPicker({ onSelectReaction }) {
  return (
    <View style={styles.reactionPicker}>
      {REACTION_OPTIONS.map((reaction) => (
        <Pressable
          key={reaction}
          onPress={() => onSelectReaction(reaction)}
          style={({ pressed }) => [
            styles.reactionOption,
            pressed && styles.reactionOptionPressed,
          ]}
          hitSlop={6}
        >
          <Text style={styles.reactionEmoji}>{reaction}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  reactionPicker: {
    position: "absolute",
    right: 0,
    bottom: 52,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 212,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: sizes.borderWidth,
    borderColor: colors.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    zIndex: 10,
  },
  reactionOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionOptionPressed: {
    backgroundColor: colors.surface,
  },
  reactionEmoji: {
    fontSize: 22,
  },
});
