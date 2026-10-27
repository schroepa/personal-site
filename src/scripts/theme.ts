/**
 * Theme: gespeichert ('light' | 'dark' in localStorage.theme) oder System.
 * `applyStoredTheme` läuft im Kopf-Skript /js/kopf.js vor dem ersten Paint (siehe kopf-skript.ts, SiteLayout),
 * deshalb muss die Funktion in sich geschlossen sein (keine Importe, keine Außenbezüge).
 */
export function applyStoredTheme(): void {
  let stored: string | null = null
  try {
    stored = localStorage.getItem("theme")
  } catch {
    stored = null
  }
  const systemDark = matchMedia("(prefers-color-scheme: dark)").matches
  const dark = stored === "dark" || (stored !== "light" && systemDark)
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light")
}

export function currentTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"
}

export function setStoredTheme(theme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", theme)
  try {
    localStorage.setItem("theme", theme)
  } catch {
    /* Speicher gesperrt: Wahl gilt nur für diese Seite */
  }
}

/** Verdrahtet die Schaltflächen des Theme-Toggles. Gibt den Teardown zurück. */
export function initThemeToggle(): () => void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-theme-wahl]")]
  const sync = () => {
    const theme = currentTheme()
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.themeWahl === theme))
  }
  const onClick = (e: Event) => {
    const value = (e.currentTarget as HTMLElement).dataset.themeWahl
    if (value === "light" || value === "dark") {
      setStoredTheme(value)
      sync()
    }
  }
  for (const b of buttons) b.addEventListener("click", onClick)
  const observer = new MutationObserver(sync)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  sync()
  return () => {
    for (const b of buttons) b.removeEventListener("click", onClick)
    observer.disconnect()
  }
}
