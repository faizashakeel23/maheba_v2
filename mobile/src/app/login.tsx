import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../lib/theme";
import { useAuth, type DemoRole } from "../lib/auth";
import { getAllProviders } from "../lib/providers";
import { isVisible } from "../lib/directory";
import type { Provider } from "../lib/types";
import { Card, Field, GText, H1, PrettyButton, GhostButton } from "../components/ui";

export default function Login() {
  const { user, loginProvider, loginAdmin, logout } = useAuth();
  const [role, setRole] = useState<DemoRole>("provider");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [options, setOptions] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getAllProviders()
      .then((all) => {
        const v = all.filter((p) => isVisible(p));
        setOptions(v);
        setProviderId((cur) => cur || v[0]?.id || "");
      })
      .catch(() => {});
  }, []);

  async function submit() {
    if (!email.includes("@")) {
      setMsg("Please enter a valid email, pretty.");
      return;
    }
    if (password.length < 4) {
      setMsg("Password must be at least 4 characters.");
      return;
    }
    if (role === "admin") {
      await loginAdmin(email.trim());
      router.replace("/admin");
      return;
    }
    const provider = options.find((p) => p.id === providerId);
    if (!provider) {
      setMsg("Pick your provider profile.");
      return;
    }
    await loginProvider(email.trim(), provider.id, provider.business_name);
    router.replace("/dashboard");
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
      <View style={styles.toggle}>
        {(["provider", "admin"] as DemoRole[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={[styles.tab, role === r && styles.tabActive]}
          >
            <Text style={[styles.tabText, role === r && { color: COLORS.white }]}>
              {r}
            </Text>
          </Pressable>
        ))}
      </View>
      <Card>
        {role === "provider" && (
          <>
            <Text style={styles.label}>YOUR BUSINESS PROFILE</Text>
            <View style={styles.gap} />
            {options.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setProviderId(p.id)}
                style={[styles.opt, providerId === p.id && styles.optActive]}
              >
                <Text style={[styles.optText, providerId === p.id && { color: COLORS.white }]}>
                  {p.business_name} · {p.category}
                </Text>
              </Pressable>
            ))}
            <View style={styles.gap} />
          </>
        )}
        {role === "admin" && (
          <Text style={styles.note}>
            ✿ Admin demo: any email + 4-char password works. Admins approve
            providers — providers can&apos;t open the admin tab.
          </Text>
        )}
        <View style={styles.gap} />
        <Field value={email} onChangeText={setEmail} placeholder="Email ✿" keyboard="email-address" />
        <View style={styles.gap} />
        <Field value={password} onChangeText={setPassword} placeholder="Password ♡" secure />
        <View style={styles.gap} />
        <PrettyButton title={`Log in as ${role} ✿`} onPress={submit} />
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
  toggle: { flexDirection: "row", alignSelf: "center", backgroundColor: COLORS.white, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.blushBorder, padding: 4, marginTop: 12, gap: 4 },
  tab: { borderRadius: 999, paddingHorizontal: 26, paddingVertical: 8 },
  tabActive: { backgroundColor: COLORS.blush },
  tabText: { fontWeight: "800", fontSize: 14, color: COLORS.plumSoft, textTransform: "capitalize" },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, color: COLORS.plumSoft },
  opt: { borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.blushBorder, padding: 11, marginBottom: 6, backgroundColor: COLORS.white },
  optActive: { backgroundColor: COLORS.blush, borderColor: COLORS.blush },
  optText: { fontWeight: "700", fontSize: 13, color: COLORS.plum },
  note: { backgroundColor: "#EDE9FE", borderRadius: 12, padding: 10, fontSize: 12, fontWeight: "700", color: "#6D28D9" },
  gap: { height: 10 },
  msg: { marginTop: 10, fontWeight: "700", fontSize: 13, color: COLORS.blushDeep },
});
