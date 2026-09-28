/* Cache name derived from version.json — falls back to hardcoded value */
let CACHE_NAME = 'aashirwad-v1.0.2';
const VIDEO_CACHE_NAME = 'aashirwad-video-v1';
const VERSION_PREFIX = 'aashirwad-v';

/* ── All images to pre-cache on install ── */
const PRECACHE_IMAGES = [
  'assets/images/logo.webp',
  'assets/images/favicon.png',
];

/* ── INSTALL: fetch version, pre-cache all images ── */
self.addEventListener('install', event => {
  event.waitUntil(
    fetch('/version.json')
      .then(res => res.json())
      .then(data => VERSION_PREFIX + data.v)
      .catch(() => CACHE_NAME)
      .then(resolvedName => {
        CACHE_NAME = resolvedName;
        return caches.open(resolvedName);
      })
      .then(cache => {
        return Promise.allSettled(
          PRECACHE_IMAGES.map(url =>
            cache.add(url).catch(err =>
              console.warn('[SW] Failed to pre-cache:', url, err)
            )
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: delete old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    fetch('/version.json')
      .then(res => res.json())
      .then(data => { CACHE_NAME = VERSION_PREFIX + data.v; })
      .catch(() => {})
      .then(() => caches.keys())
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key !== CACHE_NAME &&
              key !== VIDEO_CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) return;

  /* Non-GET (HEAD from popup.js, POST, etc.) — never cache, never intercept */
  if (request.method !== 'GET') return;

  const isImage =
    request.destination === 'image' ||
    /\.(webp|jpg|jpeg|png|gif|svg|avif|ico)$/i.test(url.pathname);

  const isVideo =
    request.destination === 'video' ||
    /\.(mp4|webm)$/i.test(url.pathname);

  /* ── IMAGES: cache-first ── */
  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  /* ── VIDEOS: cache-first for non-range, let browser handle range ── */
  if (isVideo) {
    const range = request.headers.get('Range');
    if (range) return; /* let browser handle range requests natively */
    event.respondWith(handleVideoRequest(request));
    return;
  }

  /* Everything else — browser handles normally */
});

async function handleVideoRequest(request) {
  const cache = await caches.open(VIDEO_CACHE_NAME);
  const range = request.headers.get('Range');

  if (range) {
    const cached = await cache.match(
      new Request(request.url, { method: 'GET' })
    );
    if (cached) return createRangeResponse(cached, range);
    return fetch(request);
  }

  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

async function createRangeResponse(cachedResponse, rangeHeader) {
  const buffer = await cachedResponse.arrayBuffer();
  const size = buffer.byteLength;
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return cachedResponse;

  const start = Number(match[1]);
  const end = Math.min(match[2] ? Number(match[2]) : size - 1, size - 1);

  if (start >= size || start > end) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}` }
    });
  }

  const chunk = buffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(chunk.byteLength),
      'Accept-Ranges': 'bytes',
      'Cache-Control': cachedResponse.headers.get('Cache-Control') || 'public, max-age=31536000'
    }
  });
}
