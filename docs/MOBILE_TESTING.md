# Mobile Testing

The reliable physical-phone path is the Expo Web build opened in the phone browser over the same Wi-Fi network. Native Expo Go is best-effort because the project is on Expo SDK 55, and current Expo Go compatibility may be sensitive during the SDK transition.

## Reliable Phone Browser Path

1. Connect the laptop and phone to the same Wi-Fi network.
2. Start the web demo:

```bash
docker compose build
docker compose up
```

3. Find the laptop LAN IP.

macOS Wi-Fi:

```bash
ipconfig getifaddr en0
```

macOS Ethernet or fallback:

```bash
ifconfig | grep "inet "
```

4. On the phone browser, open:

```text
http://<HOST_LAN_IP>:8081
```

Example:

```text
http://192.168.1.25:8081
```

5. Use a real backend account for server-mode testing. Developer demo buttons remain local-only fallback.

## Troubleshooting Phone Browser Access

- Make sure the phone and laptop are on the same Wi-Fi and not isolated by guest-network rules.
- Confirm Docker is still running with `docker compose up`.
- Confirm the desktop browser can open `http://localhost:8081`.
- If the phone cannot connect, check macOS firewall settings and allow incoming connections for Docker/Expo.
- If port `8081` is busy, stop the conflicting process before starting compose.

## Best-Effort Native Expo Path

Scripts are available:

```bash
npm run mobile:lan
npm run mobile:tunnel
```

Because the host machine does not have npm, use Docker:

```bash
docker compose run --rm --service-ports expo npm run mobile:lan
```

Tunnel mode:

```bash
docker compose run --rm --service-ports expo npm run mobile:tunnel
```

Notes:

- `mobile:tunnel` may require Expo's tunnel support and `@expo/ngrok`; if Expo prompts to install it, allow that only when network access is available.
- Docker LAN mode may advertise the container IP instead of the host LAN IP, so Expo Go may not connect reliably from a phone.
- Expo SDK 55 native testing was not made the primary demo path. Use phone-browser web testing when time is short.

## Verified In This Pass

- Docker publishes `8081:8081`.
- Expo Web starts and serves `http://localhost:8081`.
- Physical phone browser access instructions are documented but were not verified on an actual phone in this environment.
- Native Expo Go was not verified in this environment.
