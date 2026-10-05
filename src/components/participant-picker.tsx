import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ParticipantRow } from "@/lib/data";
import { formatPhone, normalizePersonName } from "@/lib/phone";
import { cn } from "@/lib/utils";

export function ParticipantPicker({
  participants,
  value,
  typedName,
  onSelect,
  onNew,
}: {
  participants: ParticipantRow[];
  value: string | null;
  typedName: string;
  onSelect: (participant: ParticipantRow) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = participants.find((participant) => participant.id === value) ?? null;
  const matches = useMemo(() => {
    const normalized = normalizePersonName(typedName);
    if (!normalized) return participants;
    return participants.filter((participant) => participant.normalized_name.includes(normalized));
  }, [participants, typedName]);

  return (
    <div className="flex min-w-0 gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 min-w-0 flex-1 justify-between font-normal"
          >
            <span className="truncate">{selected?.name || typedName || "Pesquisar participante…"}</span>
            <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(26rem,calc(100vw-2rem))] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Digite o nome…" />
            <CommandList>
              <CommandEmpty>Nenhum participante encontrado.</CommandEmpty>
              <CommandGroup>
                {matches.map((participant) => (
                  <CommandItem
                    key={participant.id}
                    value={participant.id}
                    onSelect={() => {
                      onSelect(participant);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("size-4", value === participant.id ? "opacity-100" : "opacity-0")}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{participant.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {participant.phone ? formatPhone(participant.phone) : "Sem telefone"}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button type="button" variant="outline" className="h-11 shrink-0" onClick={onNew}>
        <Plus className="size-4" />
        <span className="max-sm:sr-only">Novo</span>
      </Button>
    </div>
  );
}