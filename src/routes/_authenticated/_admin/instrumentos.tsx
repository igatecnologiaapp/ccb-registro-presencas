import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CatalogPage } from "@/components/catalog-page";
import { useFunctionInstruments, useInstruments, type InstrumentRow } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_admin/instrumentos")({
  head: () => ({
    meta: [
      { title: "Cadastro de Instrumentos — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Cadastre e mantenha a lista de instrumentos musicais disponíveis para o registro de presenças.",
      },
      { property: "og:title", content: "Cadastro de Instrumentos — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Mantenha a lista de instrumentos musicais do sistema.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstrumentsRoute,
});

function InstrumentsRoute() {
  const { data, isLoading, isError } = useInstruments();
  const links = useFunctionInstruments();

  const countByInstrument = useMemo(() => {
    const map = new Map<string, number>();
    for (const link of links.data ?? []) {
      map.set(link.instrument_id, (map.get(link.instrument_id) ?? 0) + 1);
    }
    return map;
  }, [links.data]);

  return (
    <CatalogPage<InstrumentRow>
      table="instruments"
      title="Cadastro de Instrumentos"
      singular="Instrumento"
      description="Instrumentos musicais disponíveis para vínculo com as funções e para o registro de presenças. Um instrumento novo entra sem vínculos: defina as funções que podem utilizá-lo na tela Funções × Instrumentos."
      rows={data}
      isLoading={isLoading}
      isError={isError}
      badgeText={(row) => {
        const count = countByInstrument.get(row.id) ?? 0;
        const shared = row.is_shared ? " · compartilhado entre participantes" : "";
        return `${count === 0 ? "Nenhuma função vinculada" : count === 1 ? "1 função vinculada" : `${count} funções vinculadas`}${shared}`;
      }}
    />
  );
}
