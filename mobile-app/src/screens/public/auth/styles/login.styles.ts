import { StyleSheet } from "react-native";

export const loginStyles = StyleSheet.create({
  card: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 24,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 9,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
  },
  tabButtonText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  activeTabButtonText: {
    color: "#0F172A",
  },
});