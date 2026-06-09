const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPT_URL = "https://exp.host/--/api/v2/push/getReceipts";

const token = process.argv[2];
const channel = process.argv[3] || "voice";

const CHANNELS = {
  voice: {
    channelId: "push-voice",
    title: "Test thông báo giọng nói",
    body: "Đây là notification test channel voice",
  },
  sms: {
    channelId: "push-sms",
    title: "Test thông báo SMS",
    body: "Đây là notification test channel sms",
  },
};

if (!token) {
  console.error(`
Thiếu ExpoPushToken.

Cách chạy:
npm run push:test -- "ExponentPushToken[...]" voice
npm run push:test -- "ExponentPushToken[...]" sms
`);
  process.exit(1);
}

if (!/^Expo(nent)?PushToken\[[^\]]+\]$/.test(token)) {
  console.error(`Token không hợp lệ: ${token}`);
  process.exit(1);
}

if (!CHANNELS[channel]) {
  console.error(`Channel không hợp lệ: ${channel}`);
  console.error(`Chỉ dùng: voice hoặc sms`);
  process.exit(1);
}

const selected = CHANNELS[channel];

const payload = {
  to: token,
  title: selected.title,
  body: selected.body,
  sound: "default",
  priority: "high",
  channelId: selected.channelId,
  data: {
    screen: "notifications",
    notificationId: `test-${channel}-${Date.now()}`,
    type: "test",
    targetType: "test",
    targetId: "test",
    channel,
  },
};

console.log("Sending push:");
console.log(JSON.stringify(payload, null, 2));

const response = await fetch(EXPO_PUSH_URL, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

const result = await response.json();

console.log("\nPush response:");
console.log(JSON.stringify(result, null, 2));

const pushId = result?.data?.id;

if (!pushId) {
  process.exit(response.ok ? 0 : 1);
}

await new Promise((resolve) => setTimeout(resolve, 3000));

const receiptResponse = await fetch(EXPO_RECEIPT_URL, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    ids: [pushId],
  }),
});

const receipt = await receiptResponse.json();

console.log("\nReceipt response:");
console.log(JSON.stringify(receipt, null, 2));
