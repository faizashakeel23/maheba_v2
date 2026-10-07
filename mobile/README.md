# Maheba Mobile (Expo SDK 57, React Native)

Android-first app with full parity to the web MVP: feed, provider profiles +
guest booking, join, provider/admin login, appointments, subscriptions, admin
approvals. Demo data in `src/lib` (AsyncStorage); swap for Supabase when keys exist.

## Run on your phone (Expo Go)

1. Phone + PC on the **same Wi-Fi**.
2. `cd mobile` then `npx expo start`
3. Scan the QR with **Expo Go** (Android: scan from inside the Expo Go app).

## Connect to the backend (real data + real login)

The app talks to the Next.js API (`web/`). Phones can't reach your PC's
`localhost`, so set your PC's LAN IP before starting:

```bash
# find it: ipconfig (look for IPv4, e.g. 192.168.1.20)
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 npx expo start --clear
```

On Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.20:3000"; npx.cmd expo start --clear
```

Without it, the app uses the Android-emulator default
(`http://10.0.2.2:3000`) and silently falls back to the on-device demo
store when unreachable. Log in with a seed account (`maheba123` password).

## Run on an Android emulator

1. Android Studio → Device Manager → create a virtual device (Pixel, API 34+).
2. Start it, then `npx expo start --android` (uses `adb` from your SDK).

## Verify without a device

```bash
npx tsc --noEmit
npx expo-doctor
```

## Notes

- Routes live in `src/app/` (expo-router Stack). Non-route code in `src/lib`, `src/components`.
- Photos bundled in `assets/images/`; Girlish font in `assets/fonts/` loaded via `expo-font` `useFonts` (Expo Go compatible — no native modules added).
- Date/time entry uses text fields (`YYYY-MM-DD`, `HH:MM`) so the app stays Expo Go compatible (no native picker modules).
- `app.json` scheme `maheba`, Android package `com.maheba.app` (ready for EAS dev builds / APKs later with `eas build`).
