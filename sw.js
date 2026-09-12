// 오픽 원버튼 트레이너 - 서비스워커 (홈 화면 설치(PWA) 지원용)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
