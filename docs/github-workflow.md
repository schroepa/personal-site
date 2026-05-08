# GitHub Workflow — ptrckschrdtr.de

Änderungen kommen automatisch auf die Live-Site sobald sie auf GitHub landen.  
Vercel baut nach jedem Push automatisch neu — dauert ~1 Minute.

---

## Weg 1 — VS Code (empfohlen, kein Terminal nötig)

### Schritt 1: Änderungen speichern
Dateien in VS Code normal speichern (`⌘S`).  
Im linken Panel erscheint ein blauer Kreis mit Zahl beim **Source Control**-Icon (Ast-Symbol, dritte Ikone von oben).

### Schritt 2: Änderungen stagen
Im Source Control Panel siehst du alle geänderten Dateien unter **Changes**.

- **Alle Dateien stagen:** Auf das `+`-Symbol neben **Changes** klicken
- **Einzelne Datei stagen:** Mit der Maus über die Datei fahren → `+` klicken

Gestagte Dateien wandern in **Staged Changes**.

### Schritt 3: Commit-Nachricht schreiben
Im Textfeld oben im Panel eine kurze Beschreibung eingeben:

```
content: neuer Blog-Post über XY
fix: Tippfehler in Impressum korrigiert
feat: neues Projekt hinzugefügt
```

### Schritt 4: Committen und pushen
Auf den Button **Commit** klicken — danach auf **Sync Changes** (erscheint direkt danach).  
Fertig. Vercel deployed automatisch.

---

## Weg 2 — Terminal

Das Terminal in VS Code öffnen: `` ⌃` `` oder Menü → Terminal → New Terminal.

```bash
# Ins Projektverzeichnis wechseln (einmalig)
cd personal-site-ptrckschrdtr

# Status prüfen — welche Dateien haben sich geändert?
git status

# Alle Änderungen stagen
git add -A

# Oder nur bestimmte Dateien/Ordner stagen
git add src/content/blog/mein-post.md
git add public/images/blog/

# Committen mit Nachricht
git commit -m "content: neuer Blog-Post"

# Auf GitHub pushen → Vercel deployt automatisch
git push origin main
```

---

## Häufige Szenarien

### Neuen Blog-Post veröffentlichen
```bash
git add src/content/blog/dateiname.md
git commit -m "content: Post über XY"
git push origin main
```

### Blog-Post mit Cover-Bild
```bash
git add src/content/blog/dateiname.md
git add public/images/blog/bild.png
git commit -m "content: Post über XY mit Cover"
git push origin main
```

### Neues Projekt hinzufügen
```bash
git add src/content/projects/projektname.md
git add public/images/projects/  # falls Bilder vorhanden
git commit -m "content: neues Projekt hinzugefügt"
git push origin main
```

### Impressum / Datenschutz aktualisieren
```bash
git add src/pages/impressum.astro
git add src/pages/datenschutz.astro
git commit -m "fix: Impressum aktualisiert"
git push origin main
```

---

## Commit-Nachrichten — Kurzreferenz

| Präfix | Wann |
|--------|------|
| `content:` | Neue oder geänderte Inhalte (Posts, Projekte, Bilder) |
| `fix:` | Fehler oder Tippfehler behoben |
| `feat:` | Neue Funktion oder Seite |
| `style:` | Nur visuelle Änderungen, kein Code |

---

## Deployments prüfen

Live-Status: **vercel.com/dashboard** → Projekt auswählen  
Oder direkt: Nach dem Push oben im VS Code Terminal auf den Link klicken den Vercel per Webhook zurückschickt.

Live-URL: **ptrckschrdtr.de**

---

## Was passiert nach dem Push?

```
Push zu GitHub
    ↓
Vercel erkennt neuen Commit (~5 Sekunden)
    ↓
Build startet: npm run build (~30-60 Sekunden)
    ↓
Neue Version live auf ptrckschrdtr.de
```

Bei Build-Fehlern bekommst du eine E-Mail von Vercel mit dem Fehler-Log.
