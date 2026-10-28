/**
 * PostHog-Snippet mit Cookiebot-Einwilligung (Statistik). Früher ein Inline-Skript mit define:vars in
 * src/components/posthog.astro; jetzt eine eigene Datei unter /js/posthog.js (Endpunkt src/pages/js/posthog.js.ts),
 * damit die CSP ohne 'unsafe-inline' für Skripte auskommt. Verhalten unverändert:
 *  - PostHog lädt erst nach Statistik-Einwilligung (sofort, wenn sie schon besteht; sonst bei CookiebotOnConsentReady bzw. CookiebotOnAccept,
 *    auch wenn uc.js erst nach diesem Skript eintrifft).
 *  - Statistik aus (Widerruf, CookiebotOnDecline, ConsentReady/Accept ohne Statistik): ein bereits geladenes PostHog wird per
 *    opt_out_capturing ausgeschaltet. Nicht geladen bleibt es ungeladen.
 *  - Erneute Einwilligung: opt_in_capturing({ captureEventName: false }) nur, wenn PostHog zuvor ausgeschaltet war (von uns per
 *    opt_out oder als dauerhaftes Opt-out aus dem Speicher, geprüft im loaded-Callback), und nie mit eigenem $opt_in-Ereignis.
 *    Bei bloßem Wiederholen derselben Einwilligung (ConsentReady und Accept nacheinander) wird nichts aufgerufen.
 *  - Seitenaufrufe auch bei Seitenwechseln des Client-Routers (capture_pageview: "history_change").
 * Token und Host kommen beim Bauen aus PUBLIC_POSTHOG_PROJECT_TOKEN und PUBLIC_POSTHOG_HOST (der Token ist
 * öffentlich, er steht ohnehin im ausgelieferten Skript). JSON.stringify verhindert, dass ein Wert Code einschleust.
 */
export const POSTHOG_SKRIPT_PFAD = "/js/posthog.js"

export function posthogSkript(apiKey: string | undefined, apiHost: string | undefined): string {
  return `(function () {
  var apiKey = ${JSON.stringify(apiKey ?? "")}
  var apiHost = ${JSON.stringify(apiHost ?? "")}

  // Wir haben PostHog selbst ausgeschaltet (opt_out_capturing)? Nur dann ist beim nächsten Einwilligen ein opt_in nötig.
  var ausgeschaltet = false

  function statistikAn() {
    var cb = window.Cookiebot
    return !!(cb && cb.consent && cb.consent.statistics)
  }

  function ausschalten() {
    if (window.posthog && window.posthog.opt_out_capturing) {
      window.posthog.opt_out_capturing()
      ausgeschaltet = true
    }
  }

  function initPostHog() {
    if (window.__posthog_initialized) return
    window.__posthog_initialized = true

    !(function (t, e) {
      var o, n, p, r
      e.__SV ||
        ((window.posthog = e),
        (e._i = []),
        (e.init = function (i, s, a) {
          function g(t, e) {
            var o = e.split(".")
            ;(2 == o.length && ((t = t[o[0]]), (e = o[1])),
              (t[e] = function () {
                t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
              }))
          }
          ;(((p = t.createElement("script")).type = "text/javascript"),
            (p.crossOrigin = "anonymous"),
            (p.async = !0),
            (p.src = s.api_host + "/static/array.js"),
            (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r))
          var u = e
          for (
            void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
              u.people = u.people || [],
              u.toString = function (t) {
                var e = "posthog"
                return ("posthog" !== a && (e += "." + a), t || (e += " (stub)"), e)
              },
              u.people.toString = function () {
                return u.toString(1) + ".people (stub)"
              },
              o =
                "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(
                  " "
                ),
              n = 0;
            n < o.length;
            n++
          )
            g(u, o[n])
          e._i.push([i, s, a])
        }),
        (e.__SV = 1))
    })(document, window.posthog || [])

    posthog.init(apiKey, {
      api_host: apiHost,
      defaults: "2026-01-30",
      capture_pageview: "history_change",
      // Dauerhaftes Opt-out aus einem früheren Widerruf (PostHog speichert es im Browser): bei bestehender Einwilligung wieder einschalten,
      // auch wenn Cookiebot nur ein einziges Ereignis meldet. Ohne $opt_in-Ereignis.
      loaded: function (ph) {
        if (statistikAn() && ph.has_opted_out_capturing && ph.has_opted_out_capturing()) {
          ph.opt_in_capturing({ captureEventName: false })
        }
      },
    })
  }

  // Bereits zugestimmt (z. B. Folgebesuch): sofort laden
  if (statistikAn()) {
    initPostHog()
  }

  // Zustand der Statistik-Einwilligung auf PostHog abbilden. Gilt für Erstzustimmung (CookiebotOnAccept), den beim Laden gemeldeten
  // Zustand (CookiebotOnConsentReady, wichtig wenn uc.js erst nach diesem Skript eintrifft) und spätere Änderungen:
  //  - Statistik an: PostHog laden; war es von uns ausgeschaltet, wieder einschalten (ohne $opt_in-Ereignis).
  //  - Statistik aus: ein bereits geladenes PostHog ausschalten; nicht geladen bleibt es ungeladen.
  function einwilligungAnwenden() {
    var cb = window.Cookiebot
    if (!cb || !cb.consent) return
    if (cb.consent.statistics) {
      initPostHog()
      if (ausgeschaltet && window.posthog && window.posthog.opt_in_capturing) {
        window.posthog.opt_in_capturing({ captureEventName: false })
        ausgeschaltet = false
      }
    } else {
      ausschalten()
    }
  }
  window.addEventListener("CookiebotOnConsentReady", einwilligungAnwenden)
  window.addEventListener("CookiebotOnAccept", einwilligungAnwenden)

  // Consent widerrufen: PostHog opt-out
  window.addEventListener("CookiebotOnDecline", function () {
    var cb = window.Cookiebot
    if (cb && cb.consent && !cb.consent.statistics) ausschalten()
  })
})()
`
}
