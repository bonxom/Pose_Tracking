# Morning Demo Script

Use this script for the IT4788 marching/parade pose-training social app demo.

## 1. Start The Web Demo

From the repository root:

```bash
docker compose build
docker compose up
```

Open:

```text
http://localhost:8081
```

## 2. Demo Account

Use the visible `Use demo student account` button on the login screen.

The local demo credentials are:

```text
Phone: 0900000001
Password: 123456
Role: HV
```

For tomorrow morning, use the visible demo shortcut. The normal login form now attempts backend login first in `auto` and `server` modes, and the deployed backend did not validate these local demo phone numbers during probing.

Optional teacher account:

```text
Phone: 0900000002
Password: 123456
Role: GV
```

## 3. Click-Through Flow

1. Open `http://localhost:8081`.
2. On the login screen, click `Use demo student account`.
3. Confirm the app opens the Home feed.
4. Point out the Facebook-style feed: avatars, GV/HV role badges, hashtags, video placeholders, likes, comments.
5. Open the teacher exercise post `Động tác chào điều lệnh`.
6. Click `Nộp bài`.
7. On `Nộp bài tập`, click `Use demo video 1`.
8. Click `Use demo video 2`.
9. Optionally edit the note text.
10. Click `Nộp bài`.
11. Confirm the new student submission post opens.
12. Point out the score summary and auto-generated scoring comment:

```text
Kết quả chấm tự động: 86/100. Lỗi chính: tay phải chưa thẳng ở nhịp 3; bước chân trái lệch nhịp 5. Gợi ý: giữ khuỷu tay cố định và tập lại đoạn 00:08-00:12.
```

13. Click `Thích` to like/unlike locally.
14. Add a short comment, for example `Em sẽ tập lại đoạn 00:08-00:12.`
15. Go back to the Home tab and confirm the new submission is at the top of the feed.
16. Open the Courses tab.
17. Show the course card, teacher info, enrollment state, stats, and exercise list.
18. Open the Search tab.
19. Search for `chào`, `#exercise_chao_dieu_lenh`, or `Nguyen Van A`.
20. Open a result to confirm search navigation works.
21. Open the Notifications tab.
22. Tap a notification and show it changes from unread to read.
23. Open the Menu tab.
24. Show user info, role, phone, demo mode, and menu rows.
25. Tap `Logout`.
26. Confirm the app returns to login.

## 4. Known Demo-Only Limitations To Mention

- The app is now server-first hybrid, but the visible demo-account buttons intentionally use local demo mode.
- The deployed backend was reachable, but the local demo credentials returned `9995 User is not validated`, so a real server login was not verified.
- Video attachments are web-safe placeholders, not real uploaded files.
- The score is a realistic simulation, not a real pose-estimation result.
- Likes, comments, notifications, enrollment, and submissions are stored locally in the browser/native storage.
- Backend repositories are wired for auth/feed/post/comment/like/add_post, but server flows need a valid backend token to exercise fully.
- Real upload, scoring pipeline, push notifications, and chat should be integrated after the demo.
