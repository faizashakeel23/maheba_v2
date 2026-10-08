# Maheba Mobile (Expo SDK 57, React Native)

Android-first app with full parity to the web MVP: feed, provider profiles +
guest booking, join, provider/admin login, appointments, subscriptions, admin
approvals. Demo data in `src/lib` (AsyncStorage); swap for Supabase when keys exist.

## Run on your phone (Expo Go)

1. Phone + PC on the **same Wi-Fi**.
2. `cd mobile`, then start with the backend URL baked in (see below):
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.100.20:3000 npx expo start --tunnel --clear
   ```
   (`--clear` matters: the URL is baked in at bundle time.)
3. Scan the QR **from inside the Expo Go app** (Android). Use a current
   Expo Go release — SDK 57 refuses to load on old clients.

## Connect to the backend (real data + real login)

The app talks to the Next.js API (`web/`). Phones can't reach your PC's
`localhost`, so the API must be reachable on the PC's LAN IP:

- **Windows Wi-Fi must be Private**, not Public (Public blocks inbound):
  elevated PowerShell —
  `Set-NetConnectionProfile -InterfaceAlias "Wi-Fi 2" -NetworkCategory Private`
- **Firewall**: allow inbound TCP 3000 (rule `Maheba Next.js 3000`).
  `New-NetFirewallRule -DisplayName "Maheba Next.js 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private`
- **LAN → API path**: the dev server currently runs in **WSL**, so the
  phone's `http://<windows-lan-ip>:3000` must be forwarded into WSL.
  Pick one (deferred setup — LAN testing is broken until this is done):
  - portproxy (quick, redo when the WSL IP changes), elevated PowerShell:
    `netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<wsl-ip>`
    (find it: `wsl hostname -I`)
  - mirrored networking (durable): `%USERPROFILE%\.wslconfig` with
    `[wsl2] networkingMode=mirrored`, then `wsl --shutdown` and reopen.
- **LAN IP moves with DHCP** (e.g. `.48` → `.20` after a Wi-Fi switch).
  Re-check with `ipconfig`, update `EXPO_PUBLIC_API_URL`, and consider a
  router DHCP reservation for a stable address.

Without a reachable API, the app silently falls back to the on-device
demo store. Confirm you're on the real backend by logging in with a seed
account (`maheba123` password) — success = real API; *"Can't reach the
server"* = still on fallback.

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
