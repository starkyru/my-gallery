import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SignInPromptProps {
  message: string;
  onPress: () => void;
}

export default function SignInPrompt({ message, onPress }: SignInPromptProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.heading}>{message}</Text>
      <TouchableOpacity style={styles.loginBtn} onPress={onPress}>
        <Text style={styles.loginBtnText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  loginBtn: {
    marginTop: 16,
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
