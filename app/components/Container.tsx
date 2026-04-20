// components/Container.tsx
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FA" },
  scroll: { paddingBottom: 20 },
});
