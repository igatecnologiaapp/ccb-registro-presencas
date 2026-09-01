import type {
  AttendeeRow,
  EventRow,
  InstrumentRow,
  NamedRow,
  PrayerHouseRow,
  SectorRow,
  TrainingAttendeeRow,
} from "./data";

export type RankRow = { name: string; count: number; percent: number };

export type InstrumentRankRow = RankRow & { instruments: number; shared: boolean };

export type SectorSummaryRow = {
  id: string | null;
  name: string;
  attendees: number;
  percent: number;
  present: number;
  absent: number;
  totalHouses: number;
  presentHouses: RankRow[];
  absentHouses: string[];
};

export type ReportData = {
  total: number;
  withInstrument: number;
  withoutInstrument: number;
  functionsUsed: number;
  totalInstruments: number;
  functionRanking: RankRow[];
  instrumentRanking: InstrumentRankRow[];
  presentHouses: RankRow[];
  absentHouses: string[];
  activeHouses: number;
  sectors: SectorSummaryRow[];
};

export type TrainingReportData = {
  total: number;
  functionRanking: RankRow[];
  presentHouses: RankRow[];
  absentHouses: string[];
  activeHouses: number;
  sectors: SectorSummaryRow[];
  averageAge: number;
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

export function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export function isValidCpf(value: string): boolean {
  const d = value.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digits = d.split("").map(Number);
  for (const round of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < round; i++) sum += digits[i]! * (round + 1 - i);
    let check = (sum * 10) % 11;
    if (check === 10) check = 0;
    if (check !== digits[round]) return false;
  }
  return true;
}

export function ageFrom(iso: string, reference = new Date()): number {
  const [y, m, d] = iso.split("-").map(Number);
  let age = reference.getFullYear() - (y ?? 0);
  const month = reference.getMonth() + 1;
  if (month < (m ?? 1) || (month === m && reference.getDate() < (d ?? 1))) age -= 1;
  return age;
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

function buildSectors(
  houses: PrayerHouseRow[],
  sectors: SectorRow[],
  countsByHouseId: Map<string, number>,
  total: number,
): SectorSummaryRow[] {
  const activeHouses = houses.filter((h) => h.active);
  const groups: SectorSummaryRow[] = [];
  const ordered: { id: string | null; name: string }[] = [
    ...sectors
      .filter((s) => s.active)
      .map((s) => ({ id: s.id as string | null, name: s.name })),
    { id: null, name: "Sem setor" },
  ];

  for (const group of ordered) {
    const list = activeHouses.filter((h) => (h.sector_id ?? null) === group.id);
    if (list.length === 0) continue;
    const present = list.filter((h) => (countsByHouseId.get(h.id) ?? 0) > 0);
    const attendees = list.reduce((acc, h) => acc + (countsByHouseId.get(h.id) ?? 0), 0);
    groups.push({
      id: group.id,
      name: group.name,
      attendees,
      percent: total > 0 ? (attendees / total) * 100 : 0,
      present: present.length,
      absent: list.length - present.length,
      totalHouses: list.length,
      presentHouses: present
        .map((h) => ({
          name: h.name,
          count: countsByHouseId.get(h.id) ?? 0,
          percent: total > 0 ? ((countsByHouseId.get(h.id) ?? 0) / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR")),
      absentHouses: list
        .filter((h) => (countsByHouseId.get(h.id) ?? 0) === 0)
        .map((h) => h.name)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    });
  }
  return groups;
}

export function buildReport(
  attendees: AttendeeRow[],
  functions: NamedRow[],
  instruments: InstrumentRow[],
  prayerHouses: PrayerHouseRow[],
  sectors: SectorRow[] = [],
): ReportData {
  const functionNames = nameMap(functions);
  const instrumentById = new Map(instruments.map((i) => [i.id, i]));
  const houseNames = nameMap(prayerHouses);

  const total = attendees.length;
  const withInstrument = attendees.filter((a) => a.instrument_id).length;

  const fnCounts = new Map<string, number>();
  const instCounts = new Map<string, number>();
  const houseCounts = new Map<string, number>();
  const countsByHouseId = new Map<string, number>();

  for (const a of attendees) {
    const fn = functionNames.get(a.function_id) ?? "—";
    fnCounts.set(fn, (fnCounts.get(fn) ?? 0) + 1);

    if (a.instrument_id) {
      const inst = instrumentById.get(a.instrument_id)?.name ?? "—";
      instCounts.set(inst, (instCounts.get(inst) ?? 0) + 1);
    }

    const house = houseNames.get(a.prayer_house_id) ?? "—";
    houseCounts.set(house, (houseCounts.get(house) ?? 0) + 1);
    countsByHouseId.set(a.prayer_house_id, (countsByHouseId.get(a.prayer_house_id) ?? 0) + 1);
  }

  const sharedNames = new Set(
    instruments.filter((i) => i.is_shared).map((i) => i.name),
  );

  const instrumentRanking: InstrumentRankRow[] = rank(instCounts, withInstrument).map((r) => ({
    ...r,
    shared: sharedNames.has(r.name),
    instruments: sharedNames.has(r.name) ? Math.min(1, r.count) : r.count,
  }));

  const totalInstruments = instrumentRanking.reduce((acc, r) => acc + r.instruments, 0);

  const absentHouses = prayerHouses
    .filter((h) => h.active && (countsByHouseId.get(h.id) ?? 0) === 0)
    .map((h) => h.name)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  return {
    total,
    withInstrument,
    withoutInstrument: total - withInstrument,
    functionsUsed: fnCounts.size,
    totalInstruments,
    functionRanking: rank(fnCounts, total),
    instrumentRanking,
    presentHouses: rank(houseCounts, total),
    absentHouses,
    activeHouses: prayerHouses.filter((h) => h.active).length,
    sectors: buildSectors(prayerHouses, sectors, countsByHouseId, total),
  };
}

export function buildTrainingReport(
  rows: TrainingAttendeeRow[],
  functions: NamedRow[],
  prayerHouses: PrayerHouseRow[],
  sectors: SectorRow[] = [],
): TrainingReportData {
  const functionNames = nameMap(functions);
  const houseNames = nameMap(prayerHouses);
  const total = rows.length;

  const fnCounts = new Map<string, number>();
  const houseCounts = new Map<string, number>();
  const countsByHouseId = new Map<string, number>();
  let ageSum = 0;

  for (const r of rows) {
    const fn = functionNames.get(r.function_id) ?? "—";
    fnCounts.set(fn, (fnCounts.get(fn) ?? 0) + 1);
    const house = houseNames.get(r.prayer_house_id) ?? "—";
    houseCounts.set(house, (houseCounts.get(house) ?? 0) + 1);
    countsByHouseId.set(r.prayer_house_id, (countsByHouseId.get(r.prayer_house_id) ?? 0) + 1);
    ageSum += ageFrom(r.birth_date);
  }

  return {
    total,
    functionRanking: rank(fnCounts, total),
    presentHouses: rank(houseCounts, total),
    absentHouses: prayerHouses
      .filter((h) => h.active && (countsByHouseId.get(h.id) ?? 0) === 0)
      .map((h) => h.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    activeHouses: prayerHouses.filter((h) => h.active).length,
    sectors: buildSectors(prayerHouses, sectors, countsByHouseId, total),
    averageAge: total > 0 ? ageSum / total : 0,
  };
}

export function eventHeaderLines(event: EventRow): string[] {
  return [
    `Data: ${formatDate(event.date)}`,
    `Hora: ${formatTime(event.start_time)}`,
    `Local: ${event.location || "—"}`,
  ];
}
