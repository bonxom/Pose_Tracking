import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Login Example</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Pose Tracking</Text>
          <Text style={styles.subtitle}>khók</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0f",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#15151d",
    borderBottomWidth: 1,
    borderBottomColor: "#232330",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: "#1b1b25",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2d2d3c",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#b7b7c9",
    fontSize: 16,
    lineHeight: 24,
  },
});
