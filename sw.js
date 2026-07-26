/* ═══════════════════════════════════════════
   StayScan 서비스 워커
   ▸ 앱 파일이 바뀌면 아래 VERSION 숫자만 올리세요.
     그러면 다음 실행 때 자동으로 최신본이 받아집니다.
   ═══════════════════════════════════════════ */

const VERSION = '1.1.7';
const CACHE = 'stayscan-' + VERSION;

const SHELL = [
  './stayscan.html',
  './config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

/* 설치: 앱 껍데기를 미리 받아둔다 */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

/* 활성화: 옛 버전 캐시를 지운다 */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('stayscan-') && k !== CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* 가져오기 전략
   · 같은 주소의 파일 → 네트워크 우선, 실패하면 캐시 (항상 최신본을 보되 오프라인에서도 열림)
   · 외부 주소(Firebase, 폰트 CDN) → 그대로 통과 */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match('./stayscan.html'))
      )
  );
});

/* 앱에서 즉시 업데이트를 요청할 때 */
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
