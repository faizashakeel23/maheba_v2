import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, FONTS } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { isVisible } from "../lib/directory";
import {
  approveSubmission,
  getAllProviders,
  getAudit,
  getJoinSubmissions,
  rejectSubmission,
  setProviderStatus,
} from "../lib/providers";
import type { AuditEntry, JoinSubmission, Provider } from "../lib/types";
import { Card, GText, H1, PrettyButton } from "../components/ui";

export default function Admin() {
  const { user, logout } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [joins, setJoins] = useState<JoinSubmission[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const reload = useCallback(() => {
    getAllProviders().then(setProviders).catch(() => {});
    getJoinSubmissions().then(setJoins).catch(() => {});
    getAudit().then(setAudit).catch(() => {});
  }, []);

  useFocusEffect(reload);

  if (!user) {
    return (
      <View style={styles.center}>
        <GText script style={styles.script}>bosses only ♡</GText>
        <H1>Admin login needed</H1>
        <Link href="/login" asChild>
          <Pressable style={styles.ctaViolet}>
            <Text style={styles.ctaText}>Go to login ✿</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (user.role !== "admin") {
    return (
      <View style={styles.center}>
        <GText script style={styles.script}>oopsie ♡</GText>
        <H1>Admins only</H1>
        <GText style={styles.sub}>Logged in as {user.businessName} (provider).</GText>
        <Pressable onPress={logout} style={styles.ctaGhost}>
          <Text style={styles.ctaGhostText}>Log out</Text>
        </Pressable>
      </View>
    );
  }

  const pending = providers.filter((p) => p.status === "pending");
  const hidden = providers.filter((p) => !isVisible(p));

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
      <View style={styles.top}>
        <View>
          <GText script style={styles.script}>boss babe mode ♡</GText>
          <Text style={styles.biz}>Admin dashboard</Text>
          <GText style={styles.sub}>as {user.email} · actions audit-logged ✿</GText>
        </View>
        <Pressable onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>pending approval ({pending.length + joins.length}) ✿</Text>
      {pending.length === 0 && joins.length === 0 && (
        <GText script style={styles.script}>all caught up, pretty ♡</GText>
      )}
      {pending.map((p) => (
        <Card key={p.id} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.pname}>{p.business_name}</Text>
            <GText style={styles.sub}>{p.category} · {p.location}</GText>
          </View>
          <View style={styles.btns}>
            <PrettyButton title="Approve ♡" color={COLORS.green} onPress={() => setProviderStatus(p.id, "approved", user.email).then(reload)} style={styles.half} />
            <PrettyButton title="Reject" color={COLORS.plum} onPress={() => setProviderStatus(p.id, "rejected", user.email).then(reload)} style={styles.half} />
          </View>
        </Card>
      ))}
      {joins.map((s) => (
        <Card key={s.id} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.pname}>{s.business_name}</Text>
            <GText style={styles.sub}>✿ via join · {s.category} · {s.phone}</GText>
          </View>
          <View style={styles.btns}>
            <PrettyButton title="Approve ♡" color={COLORS.green} onPress={() => approveSubmission(s, user.email).then(reload)} style={styles.half} />
            <PrettyButton title="Reject" color={COLORS.plum} onPress={() => rejectSubmission(s, user.email).then(reload)} style={styles.half} />
          </View>
        </Card>
      ))}

      <Text style={styles.section}>hidden from public ({hidden.length}) ♡</Text>
      {hidden.map((p) => (
        <GText key={p.id} style={styles.sub}>• {p.business_name} — {p.status}</GText>
      ))}

      <Text style={styles.section}>audit trail ✿</Text>
      {audit.length === 0 ? (
        <GText style={styles.sub}>No admin actions yet ♡</GText>
      ) : (
        audit.map((a, i) => (
          <Card key={`${a.at}-${i}`} style={styles.audit}>
            <GText style={styles.auditText}>
              {new Date(a.at).toLocaleString()} · {a.action} · {a.target}
            </GText>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream },
  pad: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: COLORS.cream, gap: 6 },
  script: { color: COLORS.blush },
  sub: { color: COLORS.plumSoft, fontSize: 13 },
  ctaViolet: { backgroundColor: "#8B5CF6", borderRadius: 999, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  ctaText: { color: COLORS.white, fontWeight: "800" },
  ctaGhost: { borderWidth: 1.5, borderColor: COLORS.blushBorder, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8, backgroundColor: COLORS.white },
  ctaGhostText: { fontWeight: "800", color: COLORS.plum },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  biz: { fontFamily: FONTS.display, fontSize: 36, lineHeight: 38, color: COLORS.plum },
  logout: { borderWidth: 1.5, borderColor: COLORS.blushBorder, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: COLORS.white },
  logoutText: { fontWeight: "800", fontSize: 12, color: COLORS.plum },
  section: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.plum, marginTop: 18, marginBottom: 8 },
  row: { marginBottom: 10 },
  info: { marginBottom: 10 },
  pname: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.plum },
  btns: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  audit: { marginBottom: 6, paddingVertical: 10 },
  auditText: { fontSize: 12 },
});
