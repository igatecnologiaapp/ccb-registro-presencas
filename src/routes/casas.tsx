import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog-page";
import { usePrayerHouses } from "@/lib/data";

export const Route = createFileRoute("/casas")({
  head: () => ({
    meta: [
      { title: "Casas de Oração — Reunião Técnica Musical" },
      {
        name: "description",
        content:
          "Cadastro das casas de oração consideradas no cálculo de presenças e ausências das reuniões técnicas musicais.",
      },
      { property: "og:title", content: "Casas de Oração — Reunião Técnica Musical" },
      {
        property: "og:description",
        content: "Cadastro das casas de oração usadas nos relatórios de presença.",
      },
    ],
  }),
  component: HousesRoute,
});

function HousesRoute() {
  const { data, isLoading, isError } = usePrayerHouses();
  return (
    <CatalogPage
      table="prayer_houses"
      title="Casas de Oração"
      singular="Casa de Oração"
      description="Todas as casas de oração ativas entram no cálculo de presentes e ausentes do relatório."
      rows={data}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
