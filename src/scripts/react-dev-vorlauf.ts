/**
 * Nur im Dev-Server: @vitejs/plugin-react verlangt vor jedem React-Modul seinen „Preamble“ (window.$RefreshReg$).
 * Astro bringt ihn nur zusammen mit Inseln mit; der Gradient-Generator wird ohne Insel hydriert (CSP, siehe
 * gradient-generator-start.ts). Muss deshalb vor der Komponente importiert werden. Im Build entfällt alles
 * (import.meta.env.DEV ist dort false). Fast Refresh fehlt damit für den Generator, Änderungen laden die Seite neu.
 */
if (import.meta.env.DEV) {
  const w = window as unknown as { $RefreshReg$?: () => void; $RefreshSig$?: () => (type: unknown) => unknown }
  w.$RefreshReg$ ??= () => {}
  w.$RefreshSig$ ??= () => (type) => type
}

export {}
