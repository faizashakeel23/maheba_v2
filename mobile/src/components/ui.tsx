import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { COLORS, FONTS } from "../lib/theme";

export function GText({
  children,
  style,
  script,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  script?: boolean;
}) {
  return (
    <Text
      style={[
        styles.body,
        script && { fontFamily: FONTS.display, fontSize: 26, lineHeight: 32 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function PrettyButton({
  title,
  onPress,
  color = COLORS.blush,
  style,
  disabled,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghost, { opacity: pressed ? 0.7 : 1 }, style]}
    >
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  secure,
  keyboard = "default",
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboard?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.plumFaint}
      secureTextEntry={secure}
      keyboardType={keyboard}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={[styles.field, multiline && { height: 76, textAlignVertical: "top" }, focus && styles.fieldFocus]}
    />
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  body: { color: COLORS.plum, fontSize: 14, fontWeight: "600" },
  h1: { fontFamily: FONTS.display, color: COLORS.plum, fontSize: 40, lineHeight: 44 },
  button: {
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: COLORS.blush,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },
  ghost: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.blushBorder,
    backgroundColor: COLORS.white,
  },
  ghostText: { color: COLORS.plum, fontWeight: "800", fontSize: 13 },
  field: {
    backgroundColor: "#FFF5F8",
    borderWidth: 1.5,
    borderColor: COLORS.blushBorder,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.plum,
  },
  fieldFocus: { borderColor: COLORS.blush },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.blushSoft,
    shadowColor: COLORS.blush,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
