/**
 * atmosphaere.js – Papierkorn und Lichtband für ptrckschrdtr.de
 * =============================================================
 * Eine Datei, keine Abhängigkeiten. Übernommen 1:1 aus dem Prototyp (Version 14).
 * Wer die Werte unten ändert, ändert die Farben. Bitte nur mit Absicht.
 *
 * REFERENZ, NICHT PRODUKTIONSCODE: Von Patrick am 2026-10-27 als "ganz grober Rahmen"
 * geliefert. Task 3 (Papierkorn) und Task 14 (Lichtband) porten diese Werte nach TypeScript.
 *
 * VERWENDUNG (Astro)
 * ------------------
 *   <main class="seite">                                   <!-- position: relative -->
 *     <div data-papierkorn aria-hidden="true"></div>       <!-- erstes Kind, unter allem -->
 *     <section class="einstieg">                          <!-- position: relative -->
 *       <canvas data-lichtband aria-hidden="true"></canvas>
 *       …Texte…
 *     </section>
 *     …
 *   </main>
 *
 *   <script>
 *     import { atmosphaere } from '../lib/atmosphaere.js';
 *     atmosphaere();   // findet [data-papierkorn] und [data-lichtband] selbst
 *   </script>
 *
 * Dunkler Modus: <html data-theme="dark"> oder, ohne data-theme, prefers-color-scheme.
 * Ein Wechsel von data-theme wird erkannt; Korn und Band ziehen sofort mit.
 * Reduzierte Bewegung: das Band wird einmal gezeichnet und steht, kein Einblenden.
 *
 * WAS „GENAU SO“ AUSMACHT
 * -----------------------
 * Lichtband (WebGL, Fallback Canvas 2D)
 *   - 4 Gauß-Flecken, Abfall exp(-2.6 · d² / r²), gerechnet in Fließkomma
 *   - Dithering ±1.5/255 beim Ausgeben, sonst entstehen Stufen (vor allem im Dunklen)
 *   - volle CSS-Auflösung, nicht halbe
 *   - Grundfläche: hell Weiß, dunkel Schwarz
 *   - Mischmodus: hell multiply bei 100 %, dunkel screen bei 50 %
 *   - Maske: oben 0 → 28 %, voll bis 60 %, aus bei 88 %; seitlich je 16 %
 *   - Palette hell   (RGBA): 250 199 219 .85 · 255 209 168 .9 · 237 173 107 .45 · 253 242 224 .9
 *   - Palette dunkel (RGBA): 196 104  92 .55 · 222 140  64 .6 · 140  82 112 .45 · 236 178 120 .4
 *   - Position: Zufallsstartwert je Besuch; x 8–92 %, y 30–58 %, Radius 22–52 % · 0.55 · max(B, H)
 *   - Driften: x ±5 % (sin, 0.00011/ms), y ±3 % (cos, 0.00009/ms), 25 Bilder/s, pausiert offscreen
 *   - Beim Scrollen zieht sich das Band zusammen: translateY bis −40 px, scaleY bis 0.55
 * Papierkorn (SVG feTurbulence als Kachel)
 *   - fractalNoise, baseFrequency 0.68, numOctaves 4, stitchTiles, Kachel 260 px
 *   - Farbmatrix: Farbe 0 (hell) bzw. 1 (dunkel), Alpha = 1.6 · R − 0.62
 *   - Deckkraft hell 17 %, dunkel 13 %
 *   - liegt absolut unter Raster und Inhalt und scrollt mit (nicht fixed, nicht obenauf)
 *
 * STOLPERFALLEN
 *   - Inhalt darüber ohne eigenen z-index/Stapelkontext lassen, sonst mischt das Band nicht mit
 *     dem Raster darunter (mix-blend-mode wirkt nur innerhalb desselben Stapelkontexts).
 *   - Die Seitenfläche bleibt surface/page (#F4F2F0 hell, #24211F dunkel); das Korn färbt sie nicht.
 *   - Kein CDN nötig, alles liegt in dieser Datei.
 *
 * TOKENS (CSS-Namen aus Figma, optional)
 *   --effekt-papierkorn-deckkraft   17 | 13   (Prozentzahl, wie in Figma)
 *   --effekt-lichtband-deckkraft   100 | 50
 *   Fehlen sie, gelten die Werte oben.
 */

const PALETTE = {
  hell: [[250, 199, 219, 0.85], [255, 209, 168, 0.9], [237, 173, 107, 0.45], [253, 242, 224, 0.9]],
  dunkel: [[196, 104, 92, 0.55], [222, 140, 64, 0.6], [140, 82, 112, 0.45], [236, 178, 120, 0.4]],
};

const CSS = `
[data-papierkorn]{position:absolute;inset:0;pointer-events:none;background-repeat:repeat;background-size:260px;
  opacity:calc(var(--effekt-papierkorn-deckkraft,17) / 100)}
[data-lichtband]{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;
  mix-blend-mode:multiply;--atmo-licht:calc(var(--effekt-lichtband-deckkraft,100) / 100);opacity:0;
  animation:atmo-licht-ein 1.6s ease .1s forwards;transform-origin:50% 50%;
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 28%,#000 60%,transparent 88%),linear-gradient(to right,transparent 0%,#000 16%,#000 84%,transparent 100%);
  -webkit-mask-composite:source-in;
  mask-image:linear-gradient(to bottom,transparent 0%,#000 28%,#000 60%,transparent 88%),linear-gradient(to right,transparent 0%,#000 16%,#000 84%,transparent 100%);
  mask-composite:intersect}
@keyframes atmo-licht-ein{to{opacity:var(--atmo-licht)}}
:root[data-theme=dark] [data-papierkorn]{opacity:calc(var(--effekt-papierkorn-deckkraft,13) / 100)}
:root[data-theme=dark] [data-lichtband]{mix-blend-mode:screen;--atmo-licht:calc(var(--effekt-lichtband-deckkraft,50) / 100)}
@media (prefers-color-scheme:dark){
  :root:not([data-theme=light]) [data-papierkorn]{opacity:calc(var(--effekt-papierkorn-deckkraft,13) / 100)}
  :root:not([data-theme=light]) [data-lichtband]{mix-blend-mode:screen;--atmo-licht:calc(var(--effekt-lichtband-deckkraft,50) / 100)}
}
@media (prefers-reduced-motion:reduce){[data-lichtband]{animation:none;opacity:var(--atmo-licht)}}
`;

const istDunkel = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};
const reduziert = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let stilDa = false;
function stil() {
  if (stilDa) return;
  const s = document.createElement('style');
  s.dataset.atmosphaere = '';
  s.textContent = CSS;
  document.head.appendChild(s);
  stilDa = true;
}

/** Bei jedem Themewechsel (data-theme oder System) aufrufen lassen. */
function beiThemewechsel(fn) {
  new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', fn);
}

/** SVG-Kachel des Papierkorns. farbe: 0 = dunkle Fasern (hell), 1 = helle Fasern (dunkel). */
export function kornBild(farbe, seed = 1) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='k' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.68' numOctaves='4' seed='${Math.floor(seed)}' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 ${farbe} 0 0 0 0 ${farbe} 0 0 0 0 ${farbe} 1.6 0 0 0 -.62'/></filter><rect width='100%' height='100%' filter='url(#k)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Papierkorn auf ein Element legen (das Element füllt seinen Elternknoten). */
export function papierkorn(el, { seed = Math.random() * 1000 } = {}) {
  stil();
  const setzen = () => { el.style.backgroundImage = kornBild(istDunkel() ? 1 : 0, seed); };
  setzen();
  beiThemewechsel(setzen);
  return { aktualisieren: setzen };
}

/** Lichtband in ein <canvas> zeichnen. */
export function lichtband(cv, { seed = Math.random() * 1000, scrollZusammenziehen = true } = {}) {
  stil();
  const rnd = (i) => { const x = Math.sin(seed + i * 127.1) * 43758.5453; return x - Math.floor(x); };
  const flecken = PALETTE.hell.map((_, i) => ({ i, x: 0.08 + 0.84 * rnd(i * 3 + 1), y: 0.44 + (rnd(i * 3 + 2) - 0.5) * 0.28, r: 0.22 + 0.3 * rnd(i * 3 + 3), ph: rnd(i + 9) * 6.28 }));
  const lage = (f, t, w, h) => [(f.x + Math.sin(t * 0.00011 + f.ph) * 0.05) * w, (f.y + Math.cos(t * 0.00009 + f.ph) * 0.03) * h, f.r * Math.max(w, h) * 0.55];

  let zeichnen;
  const gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  if (gl) {
    const sh = (typ, src) => { const s = gl.createShader(typ); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `precision highp float;
uniform vec2 res;uniform vec3 base;uniform vec4 pos[4];uniform vec4 col[4];uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 p=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y);vec3 c=base;
for(int i=0;i<4;i++){vec2 d=p-pos[i].xy;float q=dot(d,d)/(pos[i].z*pos[i].z);float a=col[i].a*exp(-2.6*q);c=mix(c,col[i].rgb,a);}
float n=h(p+fract(t*.001)*61.)+h(p*1.37+17.)-1.;c+=n*(1.5/255.);
gl_FragColor=vec4(c,1.);}`));
    gl.linkProgram(pr); gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n);
    zeichnen = (t) => {
      const w = cv.width, h = cv.height, dk = istDunkel(), fs = dk ? PALETTE.dunkel : PALETTE.hell;
      gl.viewport(0, 0, w, h); gl.uniform2f(U('res'), w, h); gl.uniform1f(U('t'), t);
      gl.uniform3f(U('base'), dk ? 0 : 1, dk ? 0 : 1, dk ? 0 : 1);
      const P = [], C = [];
      flecken.forEach((f) => { const [x, y, r] = lage(f, t, w, h); P.push(x, y, r, 0); const c = fs[f.i]; C.push(c[0] / 255, c[1] / 255, c[2] / 255, c[3]); });
      gl.uniform4fv(U('pos'), P); gl.uniform4fv(U('col'), C); gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
  } else {
    const ctx = cv.getContext('2d');
    zeichnen = (t) => {
      const w = cv.width, h = cv.height, dk = istDunkel(), fs = dk ? PALETTE.dunkel : PALETTE.hell;
      ctx.fillStyle = dk ? '#000' : '#fff'; ctx.fillRect(0, 0, w, h);
      flecken.forEach((f) => {
        const [x, y, r] = lage(f, t, w, h), c = fs[f.i];
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.3);
        [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((s) => g.addColorStop(s, `rgba(${c[0]},${c[1]},${c[2]},${(c[3] * Math.exp(-2.6 * s * s * 1.69)).toFixed(3)})`));
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
    };
  }

  const groesse = () => { const r = cv.getBoundingClientRect(); cv.width = Math.max(64, Math.round(r.width)); cv.height = Math.max(32, Math.round(r.height)); zeichnen(performance.now()); };
  groesse();
  addEventListener('resize', groesse);
  beiThemewechsel(() => zeichnen(performance.now()));

  let sichtbar = true;
  new IntersectionObserver((e) => { sichtbar = e[0].isIntersecting; }).observe(cv);
  if (!reduziert()) {
    let zuletzt = 0;
    const schleife = (t) => { if (sichtbar && t - zuletzt > 40) { zeichnen(t); zuletzt = t; } requestAnimationFrame(schleife); };
    requestAnimationFrame(schleife);
    if (scrollZusammenziehen) {
      const huelle = cv.parentElement;
      const beimScrollen = () => { const q = Math.min(1, Math.max(0, scrollY / (huelle.offsetHeight || 1))); cv.style.transform = `translateY(${q * -40}px) scaleY(${1 - q * 0.45})`; };
      addEventListener('scroll', beimScrollen, { passive: true }); beimScrollen();
    }
  }
  return { zeichnen: () => zeichnen(performance.now()) };
}

/** Alles auf einmal: [data-papierkorn] und [data-lichtband] finden und starten. Gleicher Startwert für beide. */
export function atmosphaere({ seed = Math.random() * 1000 } = {}) {
  document.querySelectorAll('[data-papierkorn]').forEach((el) => papierkorn(el, { seed }));
  document.querySelectorAll('canvas[data-lichtband]').forEach((cv) => lichtband(cv, { seed }));
}
