import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SUBSCRIPTION_PRICE_KES, type Appointment } from "../lib/types";
import { COLORS, FONTS } from "../lib/theme";
import { useAuth } from "../lib/auth";
import {
  decideAppointment,
  getAppointments,
  statusLabel,
} from "../lib/appointments";
import { newTransactionReference } from "../lib/mpesa";
import { Card, Field, GText, H1, PrettyButton } from "../components/ui";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ApptCard({ appt, onChange }: { appt: Appointment; onChange: () => void }) {
  const [proposeDate, setProposeDate] = useState("");
  const [proposeTime, setProposeTime] = useState("");
  const pending = appt.status === "pending" || appt.status === "rescheduled";

  async function act(kind: "accept" | "decline" | "cancel") {
    await decideAppointment(appt.id, { kind });
    onChange();
  }

  async function sendProposal() {
    const raw = `${proposeDate}T${proposeTime}`;
    if (Number.isNaN(Date.parse(raw))) return;
    const iso = new Date(raw).toISOString();
    if (Date.parse(iso) <= Date.now()) return;
    await decideAppointment(appt.id, { kind: "propose", proposed_starts_at: iso });
    setProposeDate("");
    setProposeTime("");
    onChange();
  }

  return (
    <Card style={styles.appt}>
      <View style={styles.apptHead}>
        <View>
          <Text style={styles.apptName}>{appt.customer_name}</Text>
          <GText style={styles.apptPhone}>{appt.customer_phone}</GText>
        </View>
        <View style={styles.status}>
          <Text style={styles.statusText}>{statusLabel(appt.status)}</Text>
        </View>
      </View>
      <Text style={styles.when}>♡ {fmt(appt.starts_at)}</Text>
      {appt.status === "rescheduled" && appt.proposed_starts_at && (
        <Text style={styles.proposed}>✿ you proposed {fmt(appt.proposed_starts_at)}</Text>
      )}
      {!!appt.notes && <GText style={styles.notes}>“{appt.notes}”</GText>}
      {pending && (
        <>
          <View style={styles.btnRow}>
            <PrettyButton title="Accept ✿" color={COLORS.green} onPress={() => act("accept")} style={styles.flex} />
            <PrettyButton title="Decline" color={COLORS.plum} onPress={() => act("decline")} style={styles.flex} />
          </View>
          <View style={styles.gap} />
          <Field value={proposeDate} onChangeText={setProposeDate} placeholder="New date YYYY-MM-DD" />
          <View style={styles.gap} />
          <Field value={proposeTime} onChangeText={setProposeTime} placeholder="New time HH:MM" />
          <View style={styles.gap} />
          <PrettyButton title="Propose new time ♡" color="#8B5CF6" onPress={sendProposal} />
        </>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [phone, setPhone] = useState("2547XXXXXXXX");
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (user?.providerId) getAppointments(user.providerId).then(setAppts).catch(() => {});
  }, [user]);

  useFocusEffect(reload);

  function pay() {
    // Demo mode: mock STK push (no Daraja keys on device). Real flow calls the
    // Next.js /api/mpesa/stk-push endpoint once the backend URL is configured.
    const ref = newTransactionReference();
    setMsg(
      `STK push sent (ref ${ref}) ♡ Enter M-Pesa PIN on ${phone}. Demo mode — no real charge.`
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <GText script style={styles.script}>shh… providers only ♡</GText>
        <H1>Log in first</H1>
        <Link href="/login" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Go to login ✿</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (!user.providerId) {
    return (
      <View style={styles.center}>
        <GText script style={styles.script}>oopsie ♡</GText>
        <H1>Provider account needed</H1>
      </View>
    );
  }

  const awaiting = appts.filter((a) => a.status === "pending" || a.status === "rescheduled");

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pad}>
      <View style={styles.top}>
        <View>
          <GText script style={styles.script}>hey gorgeous ♡</GText>
          <Text style={styles.biz}>{user.businessName}</Text>
        </View>
        <Pressable onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>
        appointments{"  "}
        <Text style={styles.count}>{awaiting.length} awaiting you</Text>
      </Text>
      {appts.length === 0 && (
        <GText script style={styles.script}>no bookings yet, pretty… share your page ♡</GText>
      )}
      {appts.map((a) => (
        <ApptCard key={a.id} appt={a} onChange={reload} />
      ))}

      <Card style={styles.sub}>
        <Text style={styles.section}>subscription ♡</Text>
        <GText>KES {SUBSCRIPTION_PRICE_KES}/month · <Text style={styles.active}>Active ✿</Text></GText>
        <View style={styles.gap} />
        <Field value={phone} onChangeText={setPhone} placeholder="M-Pesa phone 254…" keyboard="phone-pad" />
        <View style={styles.gap} />
        <PrettyButton title="Pay with M-Pesa ♡" color={COLORS.green} onPress={pay} />
        {!!msg && <Text style={styles.msg}>{msg}</Text>}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream },
  pad: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: COLORS.cream, gap: 6 },
  script: { color: COLORS.blush },
  cta: { backgroundColor: COLORS.blush, borderRadius: 999, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  ctaText: { color: COLORS.white, fontWeight: "800" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  biz: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 36, color: COLORS.plum },
  logout: { borderWidth: 1.5, borderColor: COLORS.blushBorder, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: COLORS.white },
  logoutText: { fontWeight: "800", fontSize: 12, color: COLORS.plum },
  section: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.plum, marginTop: 18, marginBottom: 8 },
  count: { fontFamily: undefined, fontSize: 12, fontWeight: "800", color: COLORS.blushDeep, backgroundColor: COLORS.blushSoft, borderRadius: 999 },
  appt: { marginBottom: 10 },
  apptHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  apptName: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.plum },
  apptPhone: { fontSize: 12, color: COLORS.plumSoft },
  status: { backgroundColor: COLORS.blushSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "800", color: COLORS.plum },
  when: { fontWeight: "800", color: COLORS.plum, marginTop: 4 },
  proposed: { fontWeight: "800", color: "#6D28D9", fontSize: 13 },
  notes: { color: COLORS.plumSoft, fontSize: 13, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  flex: { flex: 1 },
  gap: { height: 10 },
  sub: { marginTop: 14 },
  active: { color: COLORS.greenDeep, fontWeight: "800" },
  msg: { marginTop: 10, fontWeight: "700", fontSize: 13, color: COLORS.plum },
});
