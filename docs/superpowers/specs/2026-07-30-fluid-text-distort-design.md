# Fluid Text Distort (Home Headings)

**Date:** 2026-07-30  
**Status:** Implemented — velocity brush (no swirl)  
**Scope:** Replace the current pixelation hover on Intro + Kontakt hero headings with a fluid UV warp. Fix clipping.

## Goal

On desktop (fine pointer), hovering `.intro-heading` and `.kontakt-heading` gently **warps the whole letterforms** (fills and edges) in a soft, fluid way around the cursor. No pixelation, no concentric “ripple rings.” Outside the influence zone the type stays sharp. Touch / `prefers-reduced-motion` / no WebGL keep normal DOM text.

## Non-goals

- Pixel / mosaic grid (`floor` UV snapping)
- Edge-only masking (fills must distort too)
- Concentric circular ripple pattern
- Effect on other headings (Über, blog, etc.)
- Full-screen postprocessing

## Visual behavior

- **Influence:** Local to the pointer with a soft falloff (proximity is fine; the *look* must not read as circular rings).
- **Warp:** UV displacement — organic sine/noise-based offset modulated by distance to the mouse and `uHover` (lerped enter/leave).
- **Direction:** Prefer directional / fluid push (offset along a varying field), not radial wave rings emanating from the cursor.
- **Coverage:** Entire glyph (interior + outline) samples the warped UVs.
- **Intensity:** Editorial, readable — distortion should feel premium, not broken.

## Clipping fix

Root cause: `.snap-section { overflow: hidden }` plus canvas tightly bound to the text box.

1. Expand the WebGL overlay with **padding** (~100px CSS) around the heading; draw the text texture inset by that padding so warped samples have room.
2. On `#section-intro` and `#section-kontakt` only: allow overflow so the padded overlay is not clipped (`overflow: visible`), without changing other snap sections’ clipping.

## Architecture (keep)

Existing pipeline stays:

- DOM heading for a11y / SEO (visually transparent when effect active)
- Offscreen 2D canvas → `THREE.CanvasTexture`
- Fullscreen plane + `ShaderMaterial` overlay
- Init only on homepage via `astro:page-load`
- Pause when off-screen / tab hidden; DPR capped at 2

## Shader change

Replace pixel uniforms (`uPixel` / floor snap) with displace uniforms, e.g.:

- `uTexture`, `uMouse`, `uHover`, `uRadius` (soft influence), `uStrength`, `uAspect`, optional `uTime` for subtle motion

Fragment: compute soft proximity weight → UV offset via sine/noise field (no concentric ring formula) → sample texture → preserve alpha.

## Files

| File | Change |
|------|--------|
| `src/scripts/pixelTextHover.ts` | Fluid displace shader; padding-aware texture + size; drop pixelation |
| `src/pages/index.astro` | Overflow visible on intro/kontakt; overlay/padding CSS if needed |

Optional rename later (`distortTextHover.ts`) — not required for this pass.

## Acceptance

1. Intro + Kontakt: hover warps fills and edges fluidly; leave fades out.
2. No visible pixel blocks; no ring-like ripple.
3. Distortion near edges is not hard-clipped by the section.
4. Theme toggle still recolors the texture correctly.
5. Reduced motion / touch: plain text, no canvas.
