/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const shares: File[] = [];
let shareLock: Promise<void> | null, shareRes: () => void;

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  //Intercept share intent
  if (url.pathname === "/_share") {
    if (event.request.method === "POST")
      event.respondWith(
        (async () => {
          const files = (await event.request.formData()).getAll(
            "files",
          ) as File[];

          if (!shareLock) {
            shareLock = new Promise((res) => (shareRes = res));
            event.waitUntil(shareLock);
          }
          shares.push(...files);
          return Response.redirect("/#share", 303);
        })(),
      );
    else if (event.request.method === "PATCH") {
      event.respondWith(Response.json(shares.map((f) => f.name)));
    } else if (event.request.method === "GET") {
      const share = shares.shift();
      if (shareLock && !shares.length) {
        shareLock = null;
        shareRes();
      }
      event.respondWith(
        new Response(share?.stream(), { status: share ? 200 : 400 }),
      );
    }
  }
});

cleanupOutdatedCaches();

// Generate list using mise scripts:locale
// prettier-ignore
const locale_keys = ["af","am","ar-dz","ar-iq","ar-kw","ar-ly","ar-ma","ar-sa","ar-tn","ar","az","be","bg","bi","bm","bn-bd","bn","bo","br","bs","ca","cs","cv","cy","da","de-at","de-ch","de","dv","el","en-au","en-ca","en-gb","en-ie","en-il","en-in","en-nz","en-sg","en-tt","en","eo","es-do","es-mx","es-pr","es-us","es","et","eu","fa","fi","fo","fr-ca","fr-ch","fr","fy","ga","gd","gl","gom-latn","gu","he","hi","hr","ht","hu","hy-am","id","is","it-ch","it","ja","jv","ka","kk","km","kn","ko","ku","ky","lb","lo","lt","lv","me","mi","mk","ml","mn","mr","ms-my","ms","mt","my","nb","ne","nl-be","nl","nn","oc-lnc","pa-in","pl","pt-br","pt","rn","ro","ru","rw","sd","se","si","sk","sl","sq","sr-cyrl","sr","ss","sv-fi","sv","sw","ta","te","tet","tg","th","tk","tl-ph","tlh","tr","tzl","tzm-latn","tzm","ug-cn","uk","ur","uz-latn","uz","vi","x-pseudo","yo","zh-cn","zh-hk","zh-tw","zh"];

precacheAndRoute(
  self.__WB_MANIFEST.filter((entry) => {
    try {
      const url = typeof entry === "string" ? entry : entry.url;
      if (url.includes("-legacy")) return false;

      const fn = url.split("/").pop();
      if (fn) {
        if (fn.endsWith("css") && !isNaN(parseInt(fn.substring(0, 3)))) {
          return false;
        }

        // Don't cache index.html under any circumstances
        if (fn.endsWith(".html")) {
          return false;
        }

        // Don't cache dayjs locales
        for (const key of locale_keys) {
          if (fn.startsWith(`${key}-`)) {
            return false;
          }
        }

        // Don't cache lingui translations
        if (fn.startsWith("messages-")) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }),
);
