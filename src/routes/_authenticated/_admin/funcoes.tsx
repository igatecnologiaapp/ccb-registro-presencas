import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CatalogPage } from "@/components/catalog-page";
import { useFunctionInstruments, useFunctions, type NamedRow } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_admin/funcoes")({
  head: () => ({
    meta: [
      { title: "Cadastro de Funções — Registros de Presenças CCB" },
      {
        name: "description",
        content:
          "Cadastre, edite e ative funções utilizadas no registro de presenças das reuniões técnicas musicais.",
      },
      { property: "og:title", content: "Cadastro de Funções — Registros de Presenças CCB" },
      {
        property: "og:description",
        content: "Administre as funções utilizadas no registro de presenças.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FunctionsRoute,
});

function FunctionsRoute() {
  const { data, isLoading, isError } = useFunctions();
  const links = useFunctionInstruments();

  const countByFunction = useMemo(() => {
    const map = new Map<string, number>();
    for (const link of links.data ?? []) {
      map.set(link.function_id, (map.get(link.function_id) ?? 0) + 1);
    }
    return map;
  }, [links.data]);

  return (
    <CatalogPage<NamedRow>
      table="functions"
      title="Cadastro de Funções"
      singular="Função"
      description="Funções utilizadas no registro de presença. Funções com instrumentos vinculados passam a exigir instrumento."
      rows={data}
      isLoading={isLoading}
      isError={isError}
      badgeText={(row) => {
        const count = countByFunction.get(row.id) ?? 0;
        return count === 0
          ? "Sem instrumento (não exige instrumento no registro)"
          : count === 1
            ? "1 instrumento vinculado"
            : `${count} instrumentos vinculados`;
      }}
    />
  );
}
