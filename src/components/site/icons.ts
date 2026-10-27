// Icons aus Figma (Phosphor Regular), als Inline-SVG mit currentColor.
// Die exportierten Dateien tragen feste Farben; hier werden sie an die Textfarbe gebunden
// und die nicht referenzierten ids entfernt, damit die Seite keine doppelten ids hat.
import sun from "@/assets/icons/sun.svg?raw"
import moon from "@/assets/icons/moon.svg?raw"
import magnifyingGlass from "@/assets/icons/magnifying-glass.svg?raw"
import command from "@/assets/icons/command.svg?raw"

const prepare = (svg: string): string =>
  svg
    .replace(/#(?:6C645E|5F5853)/gi, "currentColor")
    .replace(/\sid="(?:Vector|Sun|Moon|MagnifyingGlass|Command)"/g, "")
    .replace(/<svg /, '<svg aria-hidden="true" focusable="false" ')

export const icons = {
  sun: prepare(sun),
  moon: prepare(moon),
  magnifyingGlass: prepare(magnifyingGlass),
  command: prepare(command),
}
