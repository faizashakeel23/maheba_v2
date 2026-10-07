import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CATEGORY_THEMES, COLORS, FONTS } from "../../lib/theme";
import { findById, isVisible } from "../../lib/directory";
import { getAllProviders } from "../../lib/providers";
import { appointmentSchema } from "../../lib/validation";
import { createAppointment } from "../../lib/appointments";
import type { Provider } from "../../lib/types";
import { Card, Field, GText, H1, PrettyButton } from "../../components/ui";

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [provider, setProvider] = useState<Provider | null | undefined>(undefined);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    getAllProviders()
      .then((all) => {
        const p = findById(all, String(id));
        setProvider(p && isVisible(p) ? p : null);
      })
      .catch(() => setProvider(null));
  }, [id]);

  if (provider === undefined) {
    return (
      <View style={styles.center}>
        <GText script>one sec, pretty… ♡</GText>
      </View>
    );
  }

  if (provider === null) {
    return (
      <View style={styles.center}>
        <GText script style={styles.script}>oopsie ♡</GText>
        <H1>Not found or not public</H1>
        <Link href="/" asChild>
          <Text style={styles.link}>← back to the pretty stuff</Text>
        </Link>
      </View>
    );
  }

  const t = CATEGORY_THEMES[provider.category];
  const wa = `https://wa.me/${provider.whatsapp}?text=${encodeURIComponent(
    `Hi ${provider.business_name}, I found you on Maheba! ♡`
  )}`;

  async function book() {
    setOk(false);
    const raw = `${date}T${time}`;
    const parsed = appointmentSchema.safeParse({
      provider_id: provider!.id,
      customer_name: name,
      customer_phone: phone,
      starts_at: Number.isNaN(Date.parse(raw)) ? "invalid" : new Date(raw).toISOString(),
      notes,
    });
    if (!parsed.success) {
      setMsg(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    await createAppointment(parsed.data);
    setOk(true);
    setMsg(`Booked, pretty! ♡ ${date} at ${time} requested. The provider will accept or suggest another time.`);
    setName(""); setPhone(""); setDate(""); setTime(""); setNotes("");
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
      <Image source={provider.cover_image} style={styles.cover} />
      <View style={[styles.topbar, { backgroundColor: t.primary }]} />
      <View style={styles.head}>
        <Image source={provider.avatar} style={styles.avatar} />
        <View style={styles.headInfo}>
          <Text style={styles.name}>{provider.business_name}</Text>
          <GText style={styles.meta}>
            {provider.location} · ★ {provider.rating.toFixed(1)} ({provider.reviews_count})
          </GText>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: t.soft }]}>
        <Text style={[styles.badgeText, { color: t.onSoft }]}>✿ {t.label}</Text>
      </View>
      <GText style={styles.bio}>{provider.bio}</GText>
      {!!provider.instagram && (
        <Text style={[styles.insta, { color: t.primary }]}>{provider.instagram}</Text>
      )}

      <View style={styles.btnRow}>
        <PrettyButton title="WhatsApp ♡" color={COLORS.green} onPress={() => Linking.openURL(wa)} style={styles.btn} />
        <PrettyButton
          title="Call"
          color={t.primary}
          onPress={() => Linking.openURL(`tel:${provider.phone}`)}
          style={styles.btn}
        />
      </View>

      <Text style={styles.section}>portfolio ✿</Text>
      {provider.portfolio.length === 0 ? (
        <GText script>fresh face here — portfolio coming soon ♡</GText>
      ) : (
        <View style={styles.grid}>
          {provider.portfolio.map((item) => (
            <Image key={item.id} source={item.image} style={styles.cell} />
          ))}
        </View>
      )}

      <Text style={styles.section}>services & prices ♡</Text>
      {provider.services.map((s) => (
        <Card key={s.id} style={styles.svc}>
          <Text style={styles.svcTitle}>{s.title}</Text>
          <GText style={styles.svcDesc}>{s.description}</GText>
          <Text style={[styles.price, { color: t.primary }]}>
            KES {s.price_kes.toLocaleString()} {s.unit}
          </Text>
        </Card>
      ))}

      <Text style={styles.section}>book an appointment ♡</Text>
      <Card>
        <GText style={styles.meta}>No account needed — name + phone + date & time ♡</GText>
        <View style={styles.gap} />
        <Field value={name} onChangeText={setName} placeholder="Your name ✿" />
        <View style={styles.gap} />
        <Field value={phone} onChangeText={setPhone} placeholder="Phone (e.g. 2547…)" keyboard="phone-pad" />
        <View style={styles.gap} />
        <Field value={date} onChangeText={setDate} placeholder="Date YYYY-MM-DD" />
        <View style={styles.gap} />
        <Field value={time} onChangeText={setTime} placeholder="Time HH:MM (24h)" />
        <View style={styles.gap} />
        <Field value={notes} onChangeText={setNotes} placeholder="Notes (optional) ♡" multiline />
        <View style={styles.gap} />
        <PrettyButton title="Request appointment ✿" color={t.primary} onPress={book} />
        {!!msg && (
          <Text style={[styles.msg, { color: ok ? t.primary : COLORS.blushDeep }]}>{msg}</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream },
  pad: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: COLORS.cream },
  script: { color: COLORS.blush },
  link: { marginTop: 12, fontWeight: "800", color: COLORS.blushDeep, textDecorationLine: "underline" },
  cover: { width: "100%", height: 220, borderRadius: 24 },
  topbar: { height: 6, borderRadius: 3, marginTop: 8 },
  head: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: COLORS.white },
  headInfo: { flex: 1 },
  name: { fontFamily: FONTS.display, fontSize: 32, lineHeight: 34, color: COLORS.plum },
  meta: { color: COLORS.plumSoft, fontSize: 12 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  badgeText: { fontWeight: "800", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  bio: { marginTop: 8 },
  insta: { fontWeight: "800", fontSize: 13, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1 },
  section: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.plum, marginTop: 22, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { width: "32%", aspectRatio: 1, borderRadius: 14 },
  svc: { marginBottom: 10 },
  svcTitle: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.plum },
  svcDesc: { color: COLORS.plumSoft, fontSize: 13 },
  price: { fontFamily: FONTS.display, fontSize: 22, marginTop: 2 },
  gap: { height: 10 },
  msg: { marginTop: 10, fontWeight: "700", fontSize: 13 },
});
