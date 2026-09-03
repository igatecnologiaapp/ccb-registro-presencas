import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EmptyBlock, ErrorBlock, LoadingBlock, Panel } from "@/components/report-blocks";
import { SearchSelect } from "@/components/search-select";
import {
  useFunctionInstruments,
  useFunctions,
  useInstruments,
  useSetAllFunctionInstruments,
  useToggleFunctionInstrument,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/_admin/vinculos")({
  head: () => ({
    meta: [
      { title: "Vínculos Função × Instrumento — Reunião Técnica Musical" },
      {
        name: "description",
        content:
          "Defina quais instrumentos musicais cada função pode informar durante o registro de presença.",
      },
      { property: "og:title", content: "Vínculos Função × Instrumento" },
      {
        property: "og:description",
        content: "Configure os instrumentos permitidos para cada função.",
      },
    ],
  }),
  component: LinksRoute,
});

function LinksRoute() {
  const functions = useFunctions();
  const instruments = useInstruments();
  const links = useFunctionInstruments();
  const toggle = useToggleFunctionInstrument();
  const setAll = useSetAllFunctionInstruments();

  const [functionId, setFunctionId] = useState<string | null>(null);

  const activeFunctions = useMemo(
    () => (functions.data ?? []).filter((f) => f.active),
    [functions.data],
  );
  const activeInstruments = useMemo(
    () => (instruments.data ?? []).filter((i) => i.active),
    [instruments.data],
  );

  const currentFunctionId = functionId ?? activeFunctions[0]?.id ?? null;

  const linkByInstrument = useMemo(() => {
    const map = new Map<string, string>();
    for (const link of links.data ?? []) {
      if (link.function_id === currentFunctionId) map.set(link.instrument_id, link.id);
    }
    return map;
  }, [links.data, currentFunctionId]);

  const countByFunction = useMemo(() => {
    const map = new Map<string, number>();
    for (const link of links.data ?? []) {
      map.set(link.function_id, (map.get(link.function_id) ?? 0) + 1);
    }
    return map;
  }, [links.data]);

  const isLoading = functions.isLoading || instruments.isLoading || links.isLoading;
  const isError = functions.isError || instruments.isError || links.isError;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="doc-title text-xl">Vínculos Função × Instrumento</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Funções com ao menos um instrumento vinculado passam a exigir a escolha do instrumento no
          registro de presença. Funções sem vínculo não aceitam instrumento.
        </p>
      </header>

      {isLoading ? (
        <Panel title="Vínculos">
          <LoadingBlock />
        </Panel>
      ) : isError ? (
        <Panel title="Vínculos">
          <ErrorBlock />
        </Panel>
      ) : activeFunctions.length === 0 ? (
        <Panel title="Vínculos">
          <EmptyBlock label="Cadastre funções ativas para configurar os vínculos." />
        </Panel>
      ) : (
        <>
          <Panel title="Função" description="Selecione a função a configurar.">
            <div className="max-w-md space-y-2">
              <Label htmlFor="link-function">Função</Label>
              <SearchSelect
                id="link-function"
                options={activeFunctions.map((f) => ({
                  value: f.id,
                  label: `${f.name} (${countByFunction.get(f.id) ?? 0})`,
                }))}
                value={currentFunctionId}
                onChange={setFunctionId}
              />
            </div>
          </Panel>

          <Panel
            title="Instrumentos permitidos"
            description={`${linkByInstrument.size} de ${activeInstruments.length} instrumentos vinculados.`}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {linkByInstrument.size > 0 ? (
                  <Badge variant="secondary">Instrumento obrigatório</Badge>
                ) : (
                  <Badge variant="outline">Sem instrumento</Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setAll.isPending || !currentFunctionId}
                  onClick={async () => {
                    if (!currentFunctionId) return;
                    const missing = activeInstruments
                      .filter((i) => !linkByInstrument.has(i.id))
                      .map((i) => i.id);
                    try {
                      await setAll.mutateAsync({
                        functionId: currentFunctionId,
                        instrumentIds: missing,
                        select: true,
                      });
                      toast.success("Todos os instrumentos foram vinculados.");
                    } catch (error) {
                      toast.error((error as Error).message);
                    }
                  }}
                >
                  Selecionar todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setAll.isPending || linkByInstrument.size === 0}
                  onClick={async () => {
                    if (!currentFunctionId) return;
                    try {
                      await setAll.mutateAsync({
                        functionId: currentFunctionId,
                        instrumentIds: [],
                        select: false,
                      });
                      toast.success("Vínculos removidos desta função.");
                    } catch (error) {
                      toast.error((error as Error).message);
                    }
                  }}
                >
                  Limpar todos
                </Button>
              </div>
            }
          >
            {activeInstruments.length === 0 ? (
              <EmptyBlock label="Nenhum instrumento ativo cadastrado." />
            ) : (
              <div className="grid gap-1 sm:grid-cols-2">
                {activeInstruments.map((instrument) => {
                  const linkId = linkByInstrument.get(instrument.id) ?? null;
                  return (
                    <label
                      key={instrument.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 text-sm"
                    >
                      <Checkbox
                        checked={!!linkId}
                        onCheckedChange={async () => {
                          if (!currentFunctionId) return;
                          try {
                            await toggle.mutateAsync({
                              functionId: currentFunctionId,
                              instrumentId: instrument.id,
                              linkId,
                            });
                          } catch (error) {
                            toast.error((error as Error).message);
                          }
                        }}
                      />
                      <span className="truncate">{instrument.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
