# Server Demo And Developer Fallback Script

Use this script to run the IT4788 marching/parade pose-training social app through Docker. The normal product path is server-backed; the old demo shortcut is kept only as developer fallback.

## 1. Start Expo Web

From the repository root:

```bash
docker compose build
docker compose up
```

Open:

```text
http://localhost:8081
```

## 2. Real Server Path

1. Open `http://localhost:8081`.
2. Register a new account through the signup flow or log in with a valid backend account.
3. Complete verification and profile completion if the backend accepts the account.
4. Confirm the app opens Home with `Nguồn dữ liệu: Server`.
5. Open a post, comments, courses, notifications, settings, blocks, and conversations.
6. Submit an exercise with two real videos; demo placeholders are not valid server uploads.
7. Verify server errors are shown safely instead of silently converting to local success.

Current blocker: no valid backend token/account was available in this environment, so the real path is frontend-complete but not fully verified end-to-end.

## 3. Developer Local Fallback Path

Use only when backend accounts/contracts are unavailable.

Visible buttons:

```text
Student HV: 0900000001 / 123456
Teacher GV: 0900000002 / 123456
```

Fallback flow:

1. Click `Use demo student account`.
2. Confirm the Home feed opens.
3. Open a teacher exercise post.
4. Click `Nộp bài`.
5. Use `Use demo video 1` and `Use demo video 2`.
6. Submit and confirm the local scoring comment appears.
7. Test local like/comment/search/courses/notifications/profile/logout.

## 4. Limitations To State Clearly

- Demo buttons are local-only and do not prove backend login.
- Local scoring comments are not authoritative backend scoring.
- `/it4788/like` and `/it4788/delete_post` returned 404 in deployed probing.
- Most authenticated APIs require a valid backend token and remain unverified for success payload shape.
- Chat compose remains local-only because no send-message API appears in the 40-API list.
