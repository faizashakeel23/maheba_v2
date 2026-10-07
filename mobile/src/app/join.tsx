import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../lib/theme";
import { providerSchema } from "../lib/validation";
import { saveJoinSubmission } from "../lib/providers";
import { CATEGORIES } from "../lib/types";
import type { ProviderCategory } from "../lib/types";
import { Card, Field, GText, H1, PrettyButton } from "../components/ui";
import { Pressable } from "react-native";

export default function Join() {
  const [category, setCategory] = useState<ProviderCategory>("makeup");
  const [business, setBusiness] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    const parsed = providerSchema.safeParse({
      business_name: business,
      category,
      location,
      bio,
      phone,
      whatsapp,
      instagram,
    });
    if (!parsed.success) {
      setMsg(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    await saveJoinSubmission({
      ...parsed.data,
      id: `pending-${Date.now()}`,
    });
    setMsg("Yay, submitted! ♡ Pending admin approval — you'll appear publicly only after approval + paid subscription.");
    setBusiness(""); setLocation(""); setBio(""); setPhone(""); setWhatsapp(""); setInstagram("");
    Alert.alert("Submitted ♡", "Your profile is pending admin approval.");
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
      <GText script style={styles.eyebrow}>
        join the pretty club ♡
      </GText>
      <H1 style={styles.title}>Become a provider</H1>
      <GText style={styles.sub}>
        Makeup, henna or baking cutie in Kenya? Apply here ✿ listings go live
        after approval + KES 500/month M-Pesa.
      </GText>
      <Card style={styles.card}>
        <Field value={business} onChangeText={setBusiness} placeholder="Business name ✿" />
        <View style={styles.gap} />
        <View style={styles.cats}>
          {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value as ProviderCategory)}
              style={[styles.cat, category === c.value && styles.catActive]}
            >
              <Text style={[styles.catText, category === c.value && { color: COLORS.white }]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.gap} />
        <Field value={location} onChangeText={setLocation} placeholder="Location (e.g. Nyali)" />
        <View style={styles.gap} />
        <Field value={bio} onChangeText={setBio} placeholder="Bio, experience, area… ♡" multiline />
        <View style={styles.gap} />
        <Field value={phone} onChangeText={setPhone} placeholder="Phone +254…" keyboard="phone-pad" />
        <View style={styles.gap} />
        <Field value={whatsapp} onChangeText={setWhatsapp} placeholder="WhatsApp 254…" keyboard="phone-pad" />
        <View style={styles.gap} />
        <Field value={instagram} onChangeText={setInstagram} placeholder="Instagram @handle (optional)" />
        <View style={styles.gap} />
        <PrettyButton title="Submit for approval ✿" onPress={submit} />
        {!!msg && <Text style={styles.msg}>{msg}</Text>}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream },
  pad: { padding: 16, paddingBottom: 40 },
  eyebrow: { color: COLORS.blush, textAlign: "center" },
  title: { textAlign: "center", fontFamily: FONTS.display },
  sub: { textAlign: "center", color: COLORS.plumSoft, marginTop: 6 },
  card: { marginTop: 16 },
  cats: { flexDirection: "row", gap: 8 },
  cat: { flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.blushBorder, paddingVertical: 9, alignItems: "center", backgroundColor: COLORS.white },
  catActive: { backgroundColor: COLORS.blush, borderColor: COLORS.blush },
  catText: { fontWeight: "800", fontSize: 13, color: COLORS.plum },
  gap: { height: 10 },
  msg: { marginTop: 10, fontWeight: "700", fontSize: 13, color: COLORS.blushDeep },
});
