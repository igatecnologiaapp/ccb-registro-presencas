import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/components/catalog-page";
import { useFunctions } from "@/lib/data";

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
    ],
  }),
  component: FunctionsRoute,
});

function FunctionsRoute() {
  const { data, isLoading, isError } = useFunctions();
  return (
    <CatalogPage
      table="functions"
      title="Cadastro de Funções"
      singular="Função"
      description="Funções utilizadas no registro de presença. Funções com instrumentos vinculados passam a exigir instrumento."
      rows={data}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
