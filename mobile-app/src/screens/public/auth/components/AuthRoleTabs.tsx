import React from "react";
import { Pressable, Text, View } from "react-native";
import { loginStyles } from "../styles/login.styles";

type LoginRoleTab = "customer" | "owner";

type Props = {
  activeTab: LoginRoleTab;
  onChange: (tab: LoginRoleTab) => void;
};

export default function AuthRoleTabs({ activeTab, onChange }: Props) {
  return (
    <View style={loginStyles.tabContainer}>
      <Pressable
        onPress={() => onChange("customer")}
        style={[
          loginStyles.tabButton,
          activeTab === "customer" && loginStyles.activeTabButton,
        ]}
      >
        <Text
          style={[
            loginStyles.tabButtonText,
            activeTab === "customer" && loginStyles.activeTabButtonText,
          ]}
        >
          Customer
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("owner")}
        style={[
          loginStyles.tabButton,
          activeTab === "owner" && loginStyles.activeTabButton,
        ]}
      >
        <Text
          style={[
            loginStyles.tabButtonText,
            activeTab === "owner" && loginStyles.activeTabButtonText,
          ]}
        >
          Owner / Staff
        </Text>
      </Pressable>
    </View>
  );
}