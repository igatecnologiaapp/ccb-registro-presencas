import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CatalogPage } from "@/components/catalog-page";
import { usePrayerHouses, useSectors, type PrayerHouseRow } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_admin/casas")({
  head: () => ({
    meta: [
      { title: "Casas de Oração — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Cadastro das casas de oração e seus setores, base do cálculo de presenças e ausências dos relatórios.",
      },
      { property: "og:title", content: "Casas de Oração — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Cadastro das casas de oração e vínculo com setores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HousesRoute,
});

function HousesRoute() {
  const { data, isLoading, isError } = usePrayerHouses();
  const sectors = useSectors();

  const sectorNames = useMemo(
    () => new Map((sectors.data ?? []).map((s) => [s.id, s.name])),
    [sectors.data],
  );

  return (
    <CatalogPage<PrayerHouseRow>
      table="prayer_houses"
      title="Casas de Oração"
      singular="Casa de Oração"
      description="Todas as casas de oração ativas entram no cálculo de presentes e ausentes do relatório. Vincule cada casa ao seu setor para obter os totais setoriais."
      rows={data}
      isLoading={isLoading}
      isError={isError}
      extra={{
        field: "sector_id",
        label: "Setor",
        placeholder: "Selecionar setor…",
        options: (sectors.data ?? [])
          .filter((s) => s.active)
          .map((s) => ({ value: s.id, label: s.name })),
        getValue: (row) => row.sector_id,
        badge: (row) =>
          row.sector_id ? `Setor: ${sectorNames.get(row.sector_id) ?? "—"}` : "Sem setor",
      }}
    />
  );
}
