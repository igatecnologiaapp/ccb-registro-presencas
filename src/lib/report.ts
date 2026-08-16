import type { AttendeeRow, EventRow, NamedRow, PrayerHouseRow } from "./data";

export type RankRow = { name: string; count: number; percent: number };

export type ReportData = {
  total: number;
  withInstrument: number;
  withoutInstrument: number;
  functionsUsed: number;
  functionRanking: RankRow[];
  instrumentRanking: RankRow[];
  presentHouses: RankRow[];
  absentHouses: string[];
};

export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export function nameMap(rows: { id: string; name: string }[]): Map<string, string> {
  return new Map(rows.map((r) => [r.id, r.name]));
}

function rank(counts: Map<string, number>, total: number): RankRow[] {
  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));
}

export function buildReport(
  attendees: AttendeeRow[],
  functions: NamedRow[],
  instruments: NamedRow[],
  prayerHouses: PrayerHouseRow[],
): ReportData {
  const functionNames = nameMap(functions);
  const instrumentNames = nameMap(instruments);
  const houseNames = nameMap(prayerHouses);

  const total = attendees.length;
  const withInstrument = attendees.filter((a) => a.instrument_id).length;

  const fnCounts = new Map<string, number>();
  const instCounts = new Map<string, number>();
  const houseCounts = new Map<string, number>();
  const presentHouseIds = new Set<string>();

  for (const a of attendees) {
    const fn = functionNames.get(a.function_id) ?? "—";
    fnCounts.set(fn, (fnCounts.get(fn) ?? 0) + 1);

    if (a.instrument_id) {
      const inst = instrumentNames.get(a.instrument_id) ?? "—";
      instCounts.set(inst, (instCounts.get(inst) ?? 0) + 1);
    }

    const house = houseNames.get(a.prayer_house_id) ?? "—";
    houseCounts.set(house, (houseCounts.get(house) ?? 0) + 1);
    presentHouseIds.add(a.prayer_house_id);
  }

  const absentHouses = prayerHouses
    .filter((h) => h.active && !presentHouseIds.has(h.id))
    .map((h) => h.name)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    total,
    withInstrument,
    withoutInstrument: total - withInstrument,
    functionsUsed: fnCounts.size,
    functionRanking: rank(fnCounts, total),
    instrumentRanking: rank(instCounts, withInstrument),
    presentHouses: rank(houseCounts, total),
    absentHouses,
  };
}

export function eventHeaderLines(event: EventRow): string[] {
  return [
    `Data: ${formatDate(event.date)}`,
    `Hora: ${formatTime(event.start_time)}`,
    `Local: ${event.location || "—"}`,
  ];
}
