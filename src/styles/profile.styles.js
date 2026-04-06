import { StyleSheet } from "react-native";
import sizes from "../constants/sizes";

const profileStyles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "#ffffff",
  },
  topSection: {
    flex: 1,
    alignItems: "center",
  },
  coverBlock: {
    width: "100%",
    height: 190,
    backgroundColor: "#c1c3cc",
  },
  avatarBox: {
    marginTop: -120,
    width: 250,
    height: 250,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: "100%",
    height: "100%",
    borderWidth: 4,
    borderColor: "#ffffff",
    borderRadius: 125,
    overflow: "hidden",
    backgroundColor: "#c1c3cc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  cameraButton: {
    position: "absolute",
    right: -2,
    bottom: 24,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#c1c3cc",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  nameText: {
    marginTop: sizes.xl,
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: sizes.lg,
    paddingTop: sizes.sm,
    paddingBottom: 34,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 92,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    marginBottom: sizes.lg,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.md,
    marginBottom: sizes.xl,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#EEF1F5",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "500",
    flexShrink: 1,
  },
});

export default profileStyles;
