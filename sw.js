// Service worker của VocaBook: cho phép dùng offline phần Sổ tay / Flashcard / Bài tập.
// Chiến lược "mạng trước, cache sau": online thì luôn lấy bản mới nhất (nên đổi config.js hay index.html là có hiệu lực ngay),
// mất mạng mới dùng bản đã lưu. KHÔNG đụng tới các request sang domain khác (API chấm điểm, font, từ điển).
// Muốn buộc mọi người bỏ cache cũ: tăng số phiên bản V.
const V = 'vocabook-v5';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))   // thiếu một file cũng không làm hỏng việc cài đặt
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;            // API / font / từ điển: để trình duyệt tự xử lý
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(V).then(c => c.put(r, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
