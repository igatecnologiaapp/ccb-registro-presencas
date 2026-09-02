import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog-page";
import { usePrayerHouses, useSectors, type SectorRow } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_admin/setores")({
  head: () => ({
    meta: [
      { title: "Setores — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Cadastro dos setores da região, usados para agrupar as casas de oração e gerar os totais setoriais dos relatórios.",
      },
      { property: "og:title", content: "Setores — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Agrupe as casas de oração por setor para relatórios setoriais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SectorsRoute,
});

function SectorsRoute() {
  const { data, isLoading, isError } = useSectors();
  const houses = usePrayerHouses();

  const countBySector = new Map<string, number>();
  for (const h of houses.data ?? []) {
    if (h.sector_id) countBySector.set(h.sector_id, (countBySector.get(h.sector_id) ?? 0) + 1);
  }

  return (
    <CatalogPage<SectorRow>
      table="sectors"
      title="Setores"
      singular="Setor"
      description="Cada casa de oração pode pertencer a um setor. Os relatórios apresentam presentes, ausentes e percentuais por setor."
      rows={data}
      isLoading={isLoading}
      isError={isError}
      numberField={{
        field: "display_order",
        label: "Ordem de exibição",
        getValue: (row) => row.display_order,
      }}
      extra={{
        field: "code",
        label: "Código (opcional)",
        options: [],
        getValue: (row) => row.code,
        badge: (row) => {
          const total = countBySector.get(row.id) ?? 0;
          return `${total} ${total === 1 ? "casa de oração" : "casas de oração"}${row.code ? ` · ${row.code}` : ""}`;
        },
      }}
    />
  );
}
