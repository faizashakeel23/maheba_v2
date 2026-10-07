import { Link, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CATEGORIES, type Provider, type ProviderCategory } from "../lib/types";
import { CATEGORY_THEMES, COLORS, FONTS } from "../lib/theme";
import { filterProviders, staticVisible } from "../lib/directory";
import { getAllProviders } from "../lib/providers";
import { fetchProviders } from "../lib/api";
import { isVisible } from "../lib/directory";
import { Card, GText, H1 } from "../components/ui";

export default function Feed() {
  const [category, setCategory] = useState<ProviderCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [base, setBase] = useState<Provider[]>(() => staticVisible());

  const reload = useCallback(() => {
    // API (Postgres) first; local demo store when unreachable.
    fetchProviders()
      .then((live) => {
        if (live) {
          setBase(live);
          return;
        }
        return getAllProviders()
          .then((all) => setBase(all.filter((p) => isVisible(p))))
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  useEffect(reload, [reload]);
  useFocusEffect(reload);

  const providers = useMemo(
    () => filterProviders(base, { category, query }),
    [base, category, query]
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
      <GText script style={styles.eyebrow}>
        karibu cutie ♡
      </GText>
      <H1 style={styles.title}>
        Kenya&apos;s <Text style={styles.pretty}>prettiest</Text> little directory
      </H1>
      <GText style={styles.sub}>
        Glam, henna & bakes ✿ tap a card for the full portfolio, then WhatsApp
        your fave directly.
      </GText>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search bridal, Nyali, cupcakes… ♡"
        placeholderTextColor={COLORS.plumFaint}
        style={styles.search}
      />

      <View style={styles.pills}>
        {CATEGORIES.map((c) => {
          const active = category === c.value;
          const color =
            c.value === "all" ? COLORS.blush : CATEGORY_THEMES[c.value].primary;
          return (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={[
                styles.pill,
                active
                  ? { backgroundColor: color, borderColor: color }
                  : styles.pillIdle,
              ]}
            >
              <Text style={[styles.pillText, active && { color: COLORS.white }]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.nav}>
        <Link href="/join" asChild>
          <Pressable style={styles.navBtn}><Text style={styles.navText}>Join ✿</Text></Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable style={styles.navBtn}><Text style={styles.navText}>Login ♡</Text></Pressable>
        </Link>
        <Link href="/dashboard" asChild>
          <Pressable style={styles.navBtn}><Text style={styles.navText}>Dashboard</Text></Pressable>
        </Link>
        <Link href="/admin" asChild>
          <Pressable style={styles.navBtn}><Text style={styles.navText}>Admin</Text></Pressable>
        </Link>
      </View>

      {providers.length === 0 && (
        <GText script style={styles.empty}>
          nothing found, pretty… ♡
        </GText>
      )}

      {providers.map((p) => {
        const t = CATEGORY_THEMES[p.category];
        return (
          <Link key={p.id} href={{ pathname: "/p/[id]", params: { id: p.id } }} asChild>
            <Pressable>
              <Card style={styles.card}>
                <View style={[styles.topbar, { backgroundColor: t.primary }]} />
                <Image source={p.portfolio[0]?.image ?? p.cover_image} style={styles.hero} />
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: t.soft }]}>
                    <Text style={[styles.badgeText, { color: t.onSoft }]}>
                      ✿ {t.label}
                    </Text>
                  </View>
                  <View style={styles.rating}>
                    <Text style={styles.ratingText}>★ {p.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <Image source={p.avatar} style={[styles.avatar, { borderColor: t.primary }]} />
                  <View style={styles.info}>
                    <Text style={styles.name}>{p.business_name}</Text>
                    <GText style={styles.meta}>
                      {p.location} · ({p.reviews_count} reviews)
                    </GText>
                  </View>
                </View>
                <View style={styles.grid}>
                  {p.portfolio.slice(1, 4).map((item) => (
                    <Image key={item.id} source={item.image} style={styles.thumb} />
                  ))}
                </View>
              </Card>
            </Pressable>
          </Link>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream },
  pad: { padding: 16, paddingBottom: 40 },
  eyebrow: { color: COLORS.blush, textAlign: "center" },
  title: { textAlign: "center", marginTop: 2 },
  pretty: { color: COLORS.blush },
  sub: { textAlign: "center", color: COLORS.plumSoft, marginTop: 6 },
  search: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.blushBorder,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.plum,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 10 },
  pill: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 7, borderWidth: 1.5 },
  pillIdle: { backgroundColor: COLORS.white, borderColor: COLORS.blushBorder },
  pillText: { fontWeight: "800", fontSize: 13, color: COLORS.plum },
  nav: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 10 },
  navBtn: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.blushBorder, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  navText: { fontWeight: "800", fontSize: 12, color: COLORS.plum },
  empty: { textAlign: "center", marginTop: 30, color: COLORS.plumSoft },
  card: { marginTop: 14, padding: 0, overflow: "hidden" },
  topbar: { height: 6 },
  hero: { width: "100%", aspectRatio: 1 },
  badges: { flexDirection: "row", justifyContent: "space-between", margin: 12, marginBottom: 0 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontWeight: "800", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  rating: { backgroundColor: COLORS.plum, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ratingText: { color: "#FDE68A", fontWeight: "800", fontSize: 11 },
  row: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2 },
  info: { flex: 1 },
  name: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.plum, lineHeight: 26 },
  meta: { color: COLORS.plumSoft, fontSize: 12 },
  grid: { flexDirection: "row", gap: 4, padding: 12, paddingTop: 0 },
  thumb: { flex: 1, aspectRatio: 1, borderRadius: 12 },
});
