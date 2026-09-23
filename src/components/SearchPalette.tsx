import * as React from "react"
import { createPortal } from "react-dom"
import { CornerDownLeft, FileText, FolderOpen, Home, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

export interface SearchItem {
  title: string
  href: string
  description?: string
}

interface SearchPaletteProps {
  staticPages: SearchItem[]
  projects: SearchItem[]
  posts: SearchItem[]
}

interface SearchGroup {
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: SearchItem[]
}

function matchesQuery(item: SearchItem, query: string): boolean {
  const haystack = `${item.title} ${item.description ?? ""}`.toLowerCase()
  return haystack.includes(query)
}

export default function SearchPalette({
  staticPages,
  projects,
  posts,
}: SearchPaletteProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [mounted, setMounted] = React.useState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const itemRefs = React.useRef<Array<HTMLAnchorElement | null>>([])

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setQuery("")
      setActiveIndex(0)
    }
  }

  const groups = React.useMemo<SearchGroup[]>(() => {
    const q = query.trim().toLowerCase()
    const filter = (items: SearchItem[]) =>
      q ? items.filter((item) => matchesQuery(item, q)) : items

    return [
      { label: "Seiten", icon: Home, items: filter(staticPages) },
      { label: "Projekte", icon: FolderOpen, items: filter(projects) },
      { label: "Blog", icon: FileText, items: filter(posts) },
    ].filter((group) => group.items.length > 0)
  }, [query, staticPages, projects, posts])

  const flatItems = React.useMemo(
    () => groups.flatMap((group) => group.items),
    [groups]
  )

  // Hält activeIndex gültig, ohne es per Effect nachträglich zu korrigieren,
  // wenn die gefilterte Liste (durch Tippen) kleiner wird.
  const clampedActiveIndex = React.useMemo(
    () => Math.min(activeIndex, Math.max(0, flatItems.length - 1)),
    [activeIndex, flatItems.length]
  )

  React.useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, flatItems.length)
  }, [flatItems.length])

  React.useEffect(() => {
    itemRefs.current[clampedActiveIndex]?.scrollIntoView({ block: "nearest" })
  }, [clampedActiveIndex])

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (flatItems.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(Math.min(clampedActiveIndex + 1, flatItems.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(Math.max(clampedActiveIndex - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      itemRefs.current[clampedActiveIndex]?.click()
    }
  }

  let flatIndex = -1

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-cursor="button"
        className="hidden items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
      >
        <Search className="size-3.5" aria-hidden="true" />
        Search
        <Kbd>⌘K</Kbd>
      </button>

      {mounted &&
        createPortal(
          <button
            type="button"
            onClick={() => setOpen(true)}
            data-cursor="button"
            aria-label="Suche öffnen"
            className="fixed top-[1.375rem] right-[calc(1.25rem+44px+0.5rem)] z-[70] flex size-11 items-center justify-center rounded-full bg-background/55 text-foreground backdrop-blur-[12px] backdrop-saturate-[1.6] sm:hidden"
          >
            <Search className="size-4.5" aria-hidden="true" />
          </button>,
          document.body
        )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md gap-0 p-0"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <DialogTitle className="sr-only">Suche</DialogTitle>
          <DialogDescription className="sr-only">
            Seiten, Projekte und Blogartikel durchsuchen
          </DialogDescription>

          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Seiten, Projekte, Blog durchsuchen…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Suche"
              role="combobox"
              aria-expanded="true"
              aria-controls="search-palette-results"
              aria-activedescendant={
                flatItems[clampedActiveIndex]
                  ? `search-result-${clampedActiveIndex}`
                  : undefined
              }
            />
          </div>

          <div
            id="search-palette-results"
            role="listbox"
            className="max-h-80 overflow-y-auto p-2"
          >
            {flatItems.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Keine Treffer.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.label} className="mb-2 last:mb-0">
                  <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    flatIndex += 1
                    const index = flatIndex
                    const isActive = index === clampedActiveIndex
                    return (
                      <a
                        key={item.href}
                        ref={(el) => {
                          itemRefs.current[index] = el
                        }}
                        id={`search-result-${index}`}
                        role="option"
                        aria-selected={isActive}
                        href={item.href}
                        data-cursor="link"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex flex-col gap-0.5 rounded-md px-2 py-2 text-sm no-underline transition-colors",
                          isActive
                            ? "bg-muted text-foreground"
                            : "text-foreground/90"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <group.icon className="size-3.5 shrink-0 text-muted-foreground" />
                          {item.title}
                        </span>
                        {item.description && (
                          <span className="truncate pl-6 text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </a>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="size-3" />
              </Kbd>
              Auswählen
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd>
              Schließen
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
