/**
 * Suche mit nativem <dialog>: ⌘K / Strg+K öffnet, Escape schließt, der Fokus kehrt zurück.
 * Index und Trefferlogik wie die bisherige SearchPalette (Titel + Beschreibung, Kleinschreibung,
 * Gruppen Seiten / Projekte / Blog, Pfeiltasten, Enter öffnet den markierten Treffer).
 */

export interface SuchEintrag {
  title: string
  href: string
  description?: string
}

export interface SuchGruppe {
  label: string
  items: SuchEintrag[]
}

export interface SuchIndex {
  staticPages: SuchEintrag[]
  projects: SuchEintrag[]
  posts: SuchEintrag[]
}

export function passt(item: SuchEintrag, query: string): boolean {
  return `${item.title} ${item.description ?? ""}`.toLowerCase().includes(query)
}

export function gruppen(index: SuchIndex, rohQuery: string): SuchGruppe[] {
  const q = rohQuery.trim().toLowerCase()
  const filter = (items: SuchEintrag[]) => (q ? items.filter((i) => passt(i, q)) : items)
  return [
    { label: "Seiten", items: filter(index.staticPages) },
    { label: "Projekte", items: filter(index.projects) },
    { label: "Blog", items: filter(index.posts) },
  ].filter((g) => g.items.length > 0)
}

export function initSuche(): () => void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-suche]")
  const trigger = document.querySelector<HTMLElement>("[data-suche-trigger]")
  const daten = document.querySelector<HTMLScriptElement>("[data-suche-daten]")
  if (!dialog || !trigger || !daten) return () => {}
  const input = dialog.querySelector<HTMLInputElement>("[data-suche-eingabe]")!
  const liste = dialog.querySelector<HTMLElement>("[data-suche-treffer]")!

  const index: SuchIndex = JSON.parse(daten.textContent ?? "{}")
  let aktiv = 0
  let treffer: SuchEintrag[] = []
  let opener: HTMLElement | null = null

  function render() {
    const gs = gruppen(index, input.value)
    treffer = gs.flatMap((g) => g.items)
    aktiv = Math.min(aktiv, Math.max(0, treffer.length - 1))
    liste.replaceChildren()
    if (treffer.length === 0) {
      const p = document.createElement("p")
      p.className = "suche-leer text-small"
      p.textContent = "Keine Treffer."
      liste.append(p)
      input.removeAttribute("aria-activedescendant")
      return
    }
    let nr = -1
    for (const g of gs) {
      const gruppe = document.createElement("div")
      gruppe.className = "suche-gruppe"
      gruppe.setAttribute("role", "group")
      gruppe.setAttribute("aria-label", g.label)
      const kopf = document.createElement("p")
      kopf.className = "suche-gruppenkopf text-label"
      kopf.setAttribute("aria-hidden", "true")
      kopf.textContent = g.label
      gruppe.append(kopf)
      for (const item of g.items) {
        nr += 1
        const i = nr
        const a = document.createElement("a")
        a.className = "suche-treffer"
        a.id = `suche-treffer-${i}`
        a.href = item.href
        a.setAttribute("role", "option")
        a.setAttribute("aria-selected", String(i === aktiv))
        const titel = document.createElement("span")
        titel.className = "text-body"
        titel.textContent = item.title
        a.append(titel)
        if (item.description) {
          const d = document.createElement("span")
          d.className = "suche-beschreibung text-small"
          d.textContent = item.description
          a.append(d)
        }
        a.addEventListener("mouseenter", () => markiere(i))
        a.addEventListener("click", () => dialog!.close())
        gruppe.append(a)
      }
      liste.append(gruppe)
    }
    input.setAttribute("aria-activedescendant", `suche-treffer-${aktiv}`)
  }

  function markiere(i: number) {
    aktiv = i
    liste.querySelectorAll<HTMLElement>("[role=option]").forEach((el, n) => {
      el.setAttribute("aria-selected", String(n === i))
    })
    input.setAttribute("aria-activedescendant", `suche-treffer-${i}`)
    document.getElementById(`suche-treffer-${i}`)?.scrollIntoView({ block: "nearest" })
  }

  function oeffnen() {
    if (dialog!.open) return
    const el = document.activeElement
    opener = el instanceof HTMLElement && el !== document.body ? el : trigger
    input.value = ""
    aktiv = 0
    render()
    dialog!.showModal()
    input.focus()
    trigger!.setAttribute("aria-expanded", "true")
  }

  function schliessen() {
    if (dialog!.open) dialog!.close()
  }

  const onClose = () => {
    trigger.setAttribute("aria-expanded", "false")
    const ziel = opener && opener.isConnected ? opener : trigger
    ziel.focus()
    opener = null
  }

  const onDocKey = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (dialog.open) schliessen()
      else oeffnen()
    }
  }

  const onInputKey = (e: KeyboardEvent) => {
    if (treffer.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      markiere(Math.min(aktiv + 1, treffer.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      markiere(Math.max(aktiv - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      document.getElementById(`suche-treffer-${aktiv}`)?.click()
    }
  }

  const onInput = () => {
    aktiv = 0
    render()
  }
  const onTrigger = () => oeffnen()
  const onBackdrop = (e: MouseEvent) => {
    if (e.target === dialog) schliessen()
  }

  document.addEventListener("keydown", onDocKey)
  trigger.addEventListener("click", onTrigger)
  input.addEventListener("keydown", onInputKey)
  input.addEventListener("input", onInput)
  dialog.addEventListener("close", onClose)
  dialog.addEventListener("click", onBackdrop)

  return () => {
    document.removeEventListener("keydown", onDocKey)
    trigger.removeEventListener("click", onTrigger)
    input.removeEventListener("keydown", onInputKey)
    input.removeEventListener("input", onInput)
    dialog.removeEventListener("close", onClose)
    dialog.removeEventListener("click", onBackdrop)
    if (dialog.open) dialog.close()
  }
}
