// import { Stack } from "expo-router";
// import { ThemeProvider } from "./ThemeContext";
// export default function Layout() {
//  return (
// <ThemeProvider>
// <Stack screenOptions={{ headerShown: false }}>
// {/* <Stack.Screen name="splashscreen" /> */}
// {/* <Stack.Screen name="LicenseKeyScreen" /> 
// <Stack.Screen name="signup" /> */}
// <Stack.Screen name="login" />
// <Stack.Screen name="addchild" /> 
//  {/* <Stack.Screen name="NewChildScreen" />
//  <Stack.Screen name="Dashboard" />  */}
// {/* <Stack.Screen name="study" /> */}
//  {/* <Stack.Screen name="fees" /> */}
// </Stack>
// </ThemeProvider>
//   );
// }


// import { Stack } from "expo-router";
// import { ThemeProvider } from "./ThemeContext";
// import { useEffect, useState } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ActivityIndicator, View } from "react-native";
// import { useRouter, useSegments } from "expo-router";
 
// export default function Layout() {
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
//   const segments = useSegments();
 
//   useEffect(() => {
//     checkAuth();
//   }, []);
 
//   const checkAuth = async () => {
//     const token = await AsyncStorage.getItem("token");
 
//     const inAuthGroup = segments[0] === "login";
 
//     if (!token && !inAuthGroup) {
//       router.replace("/login");
//     } else if (token && inAuthGroup) {
//       router.replace("/Dashboard");
//     }
 
//     setLoading(false);
//   };
 
//   if (loading) {
//     return (
// <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
// <ActivityIndicator size="large" />
// </View>
//     );
//   }
 
//   return (
// <ThemeProvider>
// <Stack screenOptions={{ headerShown: false }} />
// </ThemeProvider>
//   );
// }

// import { Stack } from "expo-router";
// import { ThemeProvider } from "./ThemeContext";
// import { useEffect, useState } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ActivityIndicator, View } from "react-native";
// import { useRouter, useSegments } from "expo-router";

// // ✅ All public routes that don't need a token
// const PUBLIC_ROUTES = ["login", "signup", "LicenseKeyScreen"];

// export default function Layout() {
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
//   const segments = useSegments();

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     const token = await AsyncStorage.getItem("token");
//     const currentRoute = segments[0]; // e.g. "login", "fees", "Dashboard"

//     const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

//     if (!token && !isPublicRoute) {
//       // ❌ No token + trying to access protected page → send to login
//       router.replace("/login");
//     } else if (token && isPublicRoute) {
//       // ✅ Has token + on a public page → send to dashboard
//       router.replace("/addchild");
//     }
//     // ✅ All other cases → stay on current page

//     setLoading(false);
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" color="#0047AB" />
//       </View>
//     );
//   }

//   return (
//     <ThemeProvider>
//       <Stack screenOptions={{ headerShown: false }} />
//     </ThemeProvider>
//   );
// }

// import { Stack } from "expo-router";
// import { ThemeProvider } from "./ThemeContext";
// import { useEffect, useState } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ActivityIndicator, View } from "react-native";
// import { useRouter, useSegments } from "expo-router";

// export default function Layout() {
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
//   const segments = useSegments();

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     const token = await AsyncStorage.getItem("token");

//     // safer check: look at full segments array
//     const inAuthGroup = segments.includes("login");

//     if (!token && !inAuthGroup) {
//       router.replace("/login");
//     } else if (token && inAuthGroup) {
//       // explicitly send to Dashboard/Home instead of just /Dashboard
//       router.replace("/addchild");
//     }

//     setLoading(false);
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <ThemeProvider>
//       <Stack screenOptions={{ headerShown: false }} />
//     </ThemeProvider>
//   );
// }


import { Stack } from "expo-router";
import { ThemeProvider } from "./ThemeContext";

export default function Layout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}