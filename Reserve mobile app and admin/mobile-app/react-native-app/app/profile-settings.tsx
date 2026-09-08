import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  View as RNView,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/src/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, User, Mail, Phone, Calendar, Save } from 'lucide-react-native';
import Colors, { BRAND, LIGHT, DARK, RADIUS, SPACING, TYPOGRAPHY, SHADOW } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from '@/components/ui/Button';

export default function ProfileSettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  const bg = isDark ? DARK.background : LIGHT.background;
  const card = isDark ? DARK.card : LIGHT.card;
  const text = isDark ? DARK.text : LIGHT.text;
  const subtle = isDark ? DARK.textSecondary : LIGHT.textSecondary;
  const border = isDark ? DARK.border : LIGHT.border;
  const tint = isDark ? DARK.tint : LIGHT.tint;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    }, 1500);
  };

  return (
    <RNView style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: 'Profile Settings',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <ChevronLeft color={text} size={24} />
            </Pressable>
          ),
          headerStyle: { backgroundColor: bg },
          headerTitleStyle: { color: text, fontWeight: '700' },
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.section, { backgroundColor: card }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={16} color={subtle} />
              <Text style={[styles.label, { color: subtle }]}>Full Name</Text>
            </View>
            <TextInput
              style={[styles.input, { color: text, borderColor: border, backgroundColor: isDark ? DARK.inputBg : LIGHT.inputBg }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={subtle}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Mail size={16} color={subtle} />
              <Text style={[styles.label, { color: subtle }]}>Email Address</Text>
            </View>
            <TextInput
              style={[styles.input, { color: text, borderColor: border, backgroundColor: isDark ? DARK.inputBg : LIGHT.inputBg, opacity: 0.7 }]}
              value={email}
              editable={false}
              placeholder="Enter your email"
              placeholderTextColor={subtle}
            />
            <Text style={[styles.infoText, { color: subtle }]}>Email cannot be changed.</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Phone size={16} color={subtle} />
              <Text style={[styles.label, { color: subtle }]}>Phone Number</Text>
            </View>
            <TextInput
              style={[styles.input, { color: text, borderColor: border, backgroundColor: isDark ? DARK.inputBg : LIGHT.inputBg }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor={subtle}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Calendar size={16} color={subtle} />
              <Text style={[styles.label, { color: subtle }]}>Member Since</Text>
            </View>
            <View style={[styles.input, { borderColor: border, backgroundColor: isDark ? DARK.inputBg : LIGHT.inputBg, justifyContent: 'center' }]}>
              <Text style={{ color: text }}>
                {(user as any)?.createdAt 
                  ? new Date((user as any).createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
                  : 'March 2026'}
              </Text>
            </View>
          </View>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          isLoading={isSaving}
          variant="primary"
          style={{ marginVertical: SPACING.lg }}
        />
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  infoText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
