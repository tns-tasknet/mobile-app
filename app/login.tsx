import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#3862CC"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#3862CC"
          secureTextEntry
        />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TouchableOpacity style={styles.passwordForgot}>
          <Text style={styles.passwordButton}>¿Olvidaste tu contraseña?</Text> 
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E3598',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#FAF9F6',
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 44,
    borderColor: '#3862CC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: '#FAF9F6',
    color: '#273F7D',
  },
  button: {
    width: '100%',
    maxWidth: 320,
    height: 44,
    backgroundColor: '#3862CC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FAF9F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 8,
  },
  passwordForgot: { 
    alignItems: 'center',
  },
  passwordButton: {
    textDecorationLine: 'underline',
    color: '#11B0E1',
    fontWeight: 'bold',
  },
});