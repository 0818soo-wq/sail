// 오픽 원버튼 트레이너 - 서비스워커
// 역할: 홈 화면 설치(PWA) 지원 + 웹 푸시 수신 시 알림 표시(아이폰 알림 -> 애플워치로 미러링)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "오픽 트레이너", body: "" };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    data = { title: "오픽 트레이너", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "오픽 트레이너";
  const options = {
    body: data.body || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "opic-sentence", // 같은 태그로 이전 알림을 대체 -> 워치 알림이 계속 쌓이지 않음
    renotify: true,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./index.html");
    })
  );
});
