# design/

`figma-variables.json` ist der Rohdump der Figma-Variablen, aus dem `npm run tokens` die Datei `src/styles/tokens.css` erzeugt (`scripts/export-tokens.mjs`).

## Herkunft

- Figma-Datei: `7EQ8Ujy720sQuGCWpLyADN`
- Ausgelesen mit dem Figma-MCP-Tool `use_figma`, ausschließlich lesend (keine Änderung an der Datei).
- Format: `FigmaDump` (siehe Kopf von `scripts/export-tokens.mjs`): `collections[].variables[].values[modeId]`.

## Collections

Exportiert (Variablenzahl / Modi):

| Collection | Variablen | Modi |
| --- | --- | --- |
| Theme | 44 | Light, Dark |
| Component | 786 | Default |
| Global | 316 | Value |
| Typography | 33 | Desktop Plus, Desktop, Tablet Landscape, Tablet Portrait, Mobile Landscape, Mobile Portrait |
| Icon | 1 | nur Default (Figma hat zusätzlich On-primary, On-secondary, On-danger, Muted; bewusst nicht exportiert) |
| Weight | 12 | Standard, Leicht, Kräftig |
| Spacing | 10 | Default, Compact |
| Layout | 10 | wie Typography |
| Motion | 56 | Standard, Reduziert |

Ausgeschlossen: `Slides` (15) und `Docs` (7). Sie haben kein `codeSyntax.WEB` (feste Ausschlussliste im Skript).

## Alias-Auflösung

Hat ein Modus-Wert den Typ `VARIABLE_ALIAS`, wird die Zielvariable per `figma.variables.getVariableByIdAsync` geladen und im Dump als `{ "alias": "--css-name-des-ziels" }` gespeichert. Der CSS-Name ist `codeSyntax.WEB` des Ziels ohne `var(` und `)`. Der Exporter erzeugt daraus `var(--css-name-des-ziels)`. Der Variablenname in Figma (`surface/page`) taucht im Dump nur im Feld `name` auf. `codeSyntaxWeb` jeder Variable bleibt der volle String `var(--…)`.

Werte: COLOR als `#RRGGBB` bzw. `rgba(r, g, b, a)` bei Alpha < 1, FLOAT auf 4 Nachkommastellen gerundet (Figma liefert Float32-Rauschen wie `1.100000023841858`), BOOLEAN als `true/false`, STRING unverändert.

## Extraktions-Snippet

Pro Collection ein `use_figma`-Aufruf (`NAMES` anpassen). Die Ausgabe ist ein kompakter Text (eine Zeile pro Variable: `Name|CSS-Name oder leer wenn abgeleitet|Typ|Wert je Modus`, Alias mit `@`-Präfix) samt Hash zur Prüfung der Übertragung. Das Tool-Ergebnis ist auf 48 KB begrenzt; `Component` (786 Variablen) wurde deshalb in drei Aufrufen mit `variableIds.slice(0, 262)`, `slice(262, 524)` und `slice(524, 2000)` gelesen.

```js
const NAMES = ['Typography', 'Icon', 'Weight', 'Spacing', 'Layout', 'Motion', 'Theme']; // je Aufruf anpassen
const A = 0, B = 2000; // Slice-Fenster (nur für Component relevant)
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const cache = {};
async function gv(id) { if (!cache[id]) cache[id] = await figma.variables.getVariableByIdAsync(id); return cache[id]; }
const h = n => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
const r4 = n => Math.round(n * 1e4) / 1e4;
function hash(s) { let x = 5381; for (let i = 0; i < s.length; i++) { x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; } return x.toString(16); }
const res = {};
for (const NAME of NAMES) {
  const c = cols.find(x => x.name === NAME);
  const lines = [];
  for (const id of c.variableIds.slice(A, B)) {
    const v = await gv(id);
    const css = v.codeSyntax && v.codeSyntax.WEB ? v.codeSyntax.WEB.replace(/^var\(/, '').replace(/\)$/, '') : '!!NONE';
    const der = '--' + NAME.toLowerCase() + '-' + v.name.replace(/\//g, '-');
    const vals = [];
    for (const m of c.modes) {
      const val = v.valuesByMode[m.modeId];
      if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS') {
        const t = await gv(val.id); const w = t.codeSyntax && t.codeSyntax.WEB;
        vals.push('@' + (w ? w.replace(/^var\(/, '').replace(/\)$/, '') : ('!!' + t.name)));
      } else if (v.resolvedType === 'COLOR') {
        const bad = [val.r, val.g, val.b].some(x => Number.isNaN(x));
        vals.push(bad ? '!NaN' : (val.a !== undefined && val.a < 1)
          ? `rgba(${Math.round(val.r * 255)}, ${Math.round(val.g * 255)}, ${Math.round(val.b * 255)}, ${r4(val.a)})`
          : `#${h(val.r)}${h(val.g)}${h(val.b)}`);
      } else if (v.resolvedType === 'FLOAT') vals.push(String(r4(val)));
      else if (v.resolvedType === 'BOOLEAN') vals.push(val ? 't' : 'f');
      else vals.push(String(val));
    }
    lines.push([v.name, css === der ? '' : css, v.resolvedType[0], ...vals].join('|'));
  }
  const body = lines.join('\n');
  res[NAME] = { modes: c.modes.map(m => m.modeId + '=' + m.name).join(';'), total: c.variableIds.length, n: lines.length, hash: hash(body), body };
}
return res;
```

Weiterverarbeitung: Der Text wird je Collection in eine Datei übernommen, der Hash mit derselben `hash`-Funktion in Node geprüft (alle 11 Teile stimmten), dann pro Zeile zu `{ name, codeSyntaxWeb: "var(<css>)", type, values }` expandiert (leerer CSS-Name wird zu `--<collection-klein>-<name mit - statt />`). Der Dump ist mit `JSON.stringify(dump, null, 1)` geschrieben. Für Icon wird nur der Modus Default übernommen. Die Prüfung ist, dass die Variablenzahl je Collection der Tabelle oben entspricht (auch im Test `Dump: Variablenzahl je Collection stimmt …`).

## NaN-Farben

Figma liefert für drei Farbvariablen r/g/b = NaN (kein Wert gesetzt). Im Dump stehen sie als `transparent`:

- `--theme-image-tint` (Theme, beide Modi)
- `--search-trigger-background-hover` (Component)
- `--schriftfeld-flaeche` (Component)

Sie brauchen einen echten Wert in Figma; danach Dump neu erzeugen.

## Bekannte Datenfehler in Figma

- **Doppeltes codeSyntax:** Theme `text/primary` und `text/secondary` haben beide `var(--theme-text-on-danger)`. Der Exporter behält die erste Variable (`text/on-danger`), lässt die beiden anderen aus und schreibt je einen `/* WARNUNG … */`-Kommentar oben in `tokens.css` (und eine Warnung auf stderr). `--theme-text-primary` und `--theme-text-secondary` existieren deshalb nicht.
- **Fehlendes Präfix:** Theme `border/raster` hat `var(--border-raster)` statt `--theme-border-raster`; der Name wird so übernommen.
- **Motion Reduziert:** `--motion-lichtband-bildintervall` bleibt unter `Reduziert` bei 40ms (`--dauer-40`), so ist es in Figma gesetzt (Absicht). Alle anderen Motion-Dauern zeigen dort auf `--dauer-0` (0ms).
- **Gemischte Alias-Ziele:** Typography verweist teils auf `--global-font-size-N`, teils auf `--font-size-N` (beide existieren).
- **Doppelt vorhandene Variable:** `icon/color` (`--icon-color`) gibt es in Icon und Component mit demselben Default-Alias; der Exporter gibt sie einmal aus.
