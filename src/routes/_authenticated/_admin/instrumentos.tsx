import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog-page";
import { useInstruments } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_admin/instrumentos")({
  head: () => ({
    meta: [
      { title: "Cadastro de Instrumentos — Reunião Técnica Musical" },
      {
        name: "description",
        content:
          "Cadastre e mantenha a lista de instrumentos musicais disponíveis para o registro de presenças.",
      },
      { property: "og:title", content: "Cadastro de Instrumentos — Reunião Técnica Musical" },
      {
        property: "og:description",
        content: "Mantenha a lista de instrumentos musicais do sistema.",
      },
    ],
  }),
  component: InstrumentsRoute,
});

function InstrumentsRoute() {
  const { data, isLoading, isError } = useInstruments();
  return (
    <CatalogPage
      table="instruments"
      title="Cadastro de Instrumentos"
      singular="Instrumento"
      description="Instrumentos musicais disponíveis para vínculo com as funções e para o registro de presenças."
      rows={data}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
