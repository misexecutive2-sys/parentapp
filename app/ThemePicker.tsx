// import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
// import { useTheme, PALETTES } from "./ThemeContext";

// export default function ThemePicker() {
//   const { theme, activePaletteId, setPalette } = useTheme();

//   return (
//     <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
//       <Text style={[styles.title, { color: theme.text }]}>Choose Theme</Text>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//         <View style={styles.row}>
//           {PALETTES.map((palette) => {
//             const isActive = palette.id === activePaletteId;
//             return (
//               <TouchableOpacity
//                 key={palette.id}
//                 onPress={() => setPalette(palette)}
//                 style={styles.item}
//               >
//                 {/* Color circle */}
//                 <View
//                   style={[
//                     styles.circle,
//                     { backgroundColor: palette.preview },
//                     isActive && styles.activeRing,
//                   ]}
//                 />
//                 {/* Label */}
//                 <Text style={[styles.label, { color: theme.text }, isActive && { color: theme.primary, fontWeight: "700" }]}>
//                   {palette.name}
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     borderRadius: 16,
//     borderWidth: 1,
//     marginVertical: 12,
//   },
//   title: {
//     fontSize: 15,
//     fontWeight: "600",
//     marginBottom: 12,
//   },
//   row: {
//     flexDirection: "row",
//     gap: 16,
//     alignItems: "center",
//   },
//   item: {
//     alignItems: "center",
//     gap: 6,
//   },
//   circle: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//   },
//   activeRing: {
//     borderWidth: 3,
//     borderColor: "#FFFFFF",
//     shadowColor: "#000",
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   label: {
//     fontSize: 11,
//   },
// });