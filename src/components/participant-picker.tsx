import { Check, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import type { ParticipantRow } from "@/lib/data";
import { formatPhone, normalizePersonName } from "@/lib/phone";
import { cn } from "@/lib/utils";

export function ParticipantPicker({
  participants,
  value,
  typedName,
  onNameChange,
  onSelect,
  onNew,
}: {
  participants: ParticipantRow[];
  value: string | null;
  typedName: string;
  onNameChange: (name: string) => void;
  onSelect: (participant: ParticipantRow) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const normalized = normalizePersonName(typedName);
    if (!normalized) return participants;
    return participants.filter((participant) => participant.normalized_name.includes(normalized));
  }, [participants, typedName]);

  return (
    <div className="flex min-w-0 gap-2">
      <Popover open={open && typedName.trim().length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            className="h-11 min-w-0 flex-1"
            value={typedName}
            placeholder="Nome completo (opcional)"
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              onNameChange(event.target.value);
              setOpen(true);
            }}
          />
        </PopoverAnchor>
        <PopoverContent className="w-[min(26rem,calc(100vw-2rem))] p-0" align="start">
          <Command shouldFilter={false}>
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