import React from 'react';
import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';

export default function Welcomescreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header with logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/logo.png')} // replace with your logo path
              style={styles.logo}
              defaultSource={require('../assets/logo.png')} // fallback placeholder
            />
          </View>
          <Text style={styles.headerTitle}>SchoolAid </Text>
        </View>

        {/* Welcome text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome Back! </Text>
          <Text style={styles.subtitle}>
            Select a child profile to view their schedule, messages, and progress.
          </Text>
        </View>

        {/* Child cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>E</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Arav Patel</Text>
                <Text style={styles.cardSubtitle}>Grade 4 - Section A</Text>
                <Text style={styles.cardSchool}>🏫 Lincoln Elementary</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>L</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Rohan Das</Text>
                <Text style={styles.cardSubtitle}>Grade 7 - Science</Text>
                <Text style={styles.cardSchool}>🏫 Washington Middle</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Continue →</Text>
          </TouchableOpacity>

          {/* Add Child button using Link */}
          <Link href="/addChild" style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>+ Add Another Child</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}




const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
header: {
  flexDirection: 'column',
  alignItems: 'center',       // centers children horizontally
  marginBottom: 30,
  // paddingTop: 1,
  paddingHorizontal: 12,
  borderWidth: 2,
  borderColor: '#0047AB',
  borderRadius: 10,
  backgroundColor : '#0047AB',
  marginTop: 20,
  
},
logoContainer: {
  width: 70,
  height: 70,              // make it square so logo centers better
  borderRadius: 35,        // half of width/height for perfect circle
  backgroundColor: '#E6F0FF',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
  overflow: 'hidden',
  marginTop: 20,
},
logo: {
  width: 55,               // increase size relative to container
  height: 55,
  resizeMode: 'contain',
  // keeps proportions
},

headerTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#e5eaf1',
  letterSpacing: 0.5,
  marginTop: 10,
  marginBottom : 5,
  textAlign: 'center',        // centers text inside its box
},
  welcomeSection: {
    marginBottom: 15,
    padding: 15,
  
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0047AB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  cardsContainer: {
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#F8FBFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0ECFF',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cardSchool: {
    fontSize: 13,
    color: '#0047AB',
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 33,
  },
  button: {
    backgroundColor: '#0047AB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderColor: '#0047AB',
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
  },
  secondaryButtonText: {
    color: '#0047AB',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
   textAlign: 'center',
  },
});
