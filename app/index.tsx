import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./ThemeContext";

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const licenseKey = await AsyncStorage.getItem("licenseKey");
    const token = await AsyncStorage.getItem("token");

    if (!licenseKey) {
      router.replace("/LicenseKeyScreen");
    } else if (!token) {
      router.replace("/login");
    } else {
      router.replace("/addchild");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.background,
      }}
    >
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}
