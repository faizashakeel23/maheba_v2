import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { Card, Field, GText, H1, PrettyButton, GhostButton } from "../components/ui";

export default function Login() {
  const { user, loading, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.includes("@")) {
      setMsg("Please enter a valid email, pretty.");
      return;
    }
    if (password.length < 1) {
      setMsg("Enter your password ♡");
      return;
    }
    setBusy(true);
    setMsg(null);
    const result = await login(email.trim(), password);
    setBusy(false);
    if ("error" in result) {
      setMsg(result.error);
      return;
    }
    router.replace(result.user.role === "admin" ? "/admin" : "/dashboard");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <GText script>one sec… ♡</GText>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.center}>
        <GText script style={styles.eyebrow}>
          hey {user.role === "admin" ? "boss" : user.businessName} ♡
        </GText>
        <H1>You&apos;re logged in</H1>
        <GText style={styles.sub}>
          {user.email} · {user.role}
        </GText>
        <View style={styles.gap} />
        <PrettyButton
          title={`Go to ${user.role === "admin" ? "admin" : "dashboard"} ✿`}
          onPress={() => router.replace(user.role === "admin" ? "/admin" : "/dashboard")}
        />
        <View style={styles.gap} />
        <GhostButton title="Log out" onPress={logout} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
      <GText script style={styles.eyebrow}>
        welcome back, gorgeous ♡
      </GText>
      <H1 style={styles.title}>Log in</H1>
      <Card>
        <Field value={email} onChangeText={setEmail} placeholder="Email ✿" keyboard="email-address" />
        <View style={styles.gap} />
        <Field value={password} onChangeText={setPassword} placeholder="Password ♡" secure />
        <View style={styles.gap} />
        <PrettyButton title={busy ? "Checking… ♡" : "Log in ✿"} onPress={submit} />
        {!!msg && <Text style={styles.msg}>{msg}</Text>}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream },
  pad: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: COLORS.cream, gap: 4 },
  eyebrow: { color: COLORS.blush, textAlign: "center" },
  title: { textAlign: "center", fontFamily: FONTS.display },
  sub: { color: COLORS.plumSoft },
  gap: { height: 10 },
  msg: { marginTop: 10, fontWeight: "700", fontSize: 13, color: COLORS.blushDeep },
});
