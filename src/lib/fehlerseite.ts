// 404: die jüngsten veröffentlichten Beiträge für den Block „Zuletzt geschrieben“. Weniger Beiträge sind kein Fehler.
import { veroeffentlichte } from "./blog.ts"

/** Die `anzahl` jüngsten veröffentlichten Beiträge (Entwürfe ausgenommen); leere Liste, wenn keiner da ist. */
export function zuletztGeschrieben<T extends { id: string; data: { date: Date; draft: boolean } }>(
  beitraege: readonly T[],
  anzahl = 2
): T[] {
  return veroeffentlichte(beitraege).slice(0, Math.max(0, anzahl))
}
