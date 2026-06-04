import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export default function TextInput({
  label,
  error,
  isPassword,
  style,
  ...props
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [secureText, setSecureText] = useState(isPassword);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          style as any,
        ]}
      >
        <RNTextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textDisabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={secureText}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setSecureText(!secureText)}
          >
            <Ionicons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.xs,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
  },
  iconContainer: {
    padding: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
    marginLeft: 4,
  },
});
