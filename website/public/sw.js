/*
 * The service worker.
 *
 * It does three things and nothing else: show a notification when a push
 * arrives, open the right page when that notification is clicked, and keep
 * the offline fallback. It is served from the site's own origin, so the
 * browser is not talking to anybody else to deliver a message about this
 * site's own data.
 *
 * The push payload is encrypted by the browser's push service on its way
 * here, so the service never sees what the notification says. Only this
 * file does.
 *
 * Every branch below has to end in a Response. A fetch handler that hands
 * the browser `undefined` is a fetch handler that turns an ordinary network
 * failure into "the page could not load", which is a worse error than the
 * one that actually happened.
 */

const CACHE = "thehood-v3";
const OFFLINE = "/offline";

/** The last thing a navigation gets when there is no network and no cache. */
const FALLBACK_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Offline · Cybersecurity 300L</title>
  </head>
  <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f0d;color:#e7efe9;font:16px/1.6 system-ui,sans-serif">
    <main style="max-width:24rem;padding:2rem;text-align:center">
      <h1 style="font-size:1.25rem;margin:0 0 .5rem">No connection</h1>
      <p style="margin:0 0 1.5rem;opacity:.75">This page needs the network. Check your signal and try again.</p>
      <a href="/" style="color:#22c55e">Try the home page</a>
    </main>
  </body>
</html>`;

function offlineResponse() {
  return new Response(FALLBACK_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE]))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/** A push, which is a notification the reader asked for. */
self.addEventListener("push", (event) => {
  let payload = { title: "Cybersecurity 300L", body: "", href: "/", id: "" };

  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // A push with no readable body still deserves to be shown.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Cybersecurity 300L", {
      body: payload.body || "",
      icon: "/favicon-192.png",
      badge: "/favicon-96.png",
      tag: payload.id || "thehood",
      renotify: false,
      data: { href: payload.href || "/", id: payload.id || "" },
      // A class reminder is time-critical; anything else can wait in the tray.
      requireInteraction: false,
      vibrate: [40, 30, 40],
    })
  );
});

/** Clicking a notification opens the page it was about. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Open the page in the tab that is already there, if there is one.
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(href);
          return client.focus();
        }
      }
      return self.clients.openWindow(href);
    })
  );
});

/**
 * Whether a request is for the payload of a partly prerendered page.
 *
 * Next sends a header and a query parameter with it, and the payload is
 * not the same twice: it carries whatever the page knew at the moment it
 * was asked for. Serving one of these from the cache shows a reader the
 * page as it was, which on a course page means a file that has been added
 * and a video that has been put up are both missing, and the page says
 * they are not there.
 */
function isPayload(request, url) {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    url.searchParams.has("_rsc")
  );
}

/** The fallback page, then a response the browser can always render. */
function offline() {
  return caches
    .match(OFFLINE)
    .then((hit) => hit || offlineResponse())
    .catch(() => offlineResponse());
}

/** A touch of caching, so the site is not a blank page with no signal. */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // The API is never cached and never given a cached page. A stale answer
  // about what has changed is worse than no answer at all.
  if (url.pathname.startsWith("/api/")) return;

  // A navigation with no signal gets the fallback rather than the browser's
  // dinosaur.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => offline())
    );
    return;
  }

  // The payload of a partly prerendered page is asked for fresh, and the
  // cache is only a fallback for when there is no signal.
  if (isPayload(request, url)) {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(request)
          .then((hit) => hit || offlineResponse())
          .catch(() => offlineResponse())
      )
    );
    return;
  }

  // Everything else is served from the network, and cached on the way past
  // so the next visit is quick.
  event.respondWith(
    caches
      .match(request)
      .then((hit) => {
        const live = fetch(request)
          .then((response) => {
            // Only the static assets are kept. A page's own html is not, and
            // neither is the payload of a partly prerendered page, because
            // neither of them is the same twice: caching them means a reader
            // is shown the site as it was when it was last visited, and on a
            // course page that means a file that has been added is missing and
            // the page says it is not there.
            const type = response.headers.get("content-type") || "";
            const keepable =
              response.ok &&
              response.type === "basic" &&
              !type.includes("text/html") &&
              !type.includes("application/json");
            if (keepable) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => hit || offlineResponse());
        return hit || live;
      })
      .catch(() => fetch(request).catch(() => offlineResponse()))
  );
});
