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
 */

const CACHE = "thehood-v2";
const OFFLINE = "/offline";

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

/** A touch of caching, so the site is not a blank page with no signal. */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // A navigation with no signal gets the fallback rather than the browser's
  // dinosaur.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE).then((hit) => hit || Response.error())
      )
    );
    return;
  }

  // The payload of a partly prerendered page is asked for fresh, and the
  // cache is only a fallback for when there is no signal.
  if (isPayload(request, url)) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((hit) => hit || Response.error())
      )
    );
    return;
  }

  // Everything else is served from the network, and cached on the way past
  // so the next visit is quick.
  event.respondWith(
    caches.match(request).then((hit) => {
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
        .catch(() => hit);
      return hit || live;
    })
  );
});
