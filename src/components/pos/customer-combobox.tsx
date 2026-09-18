"use client";

import * as React from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "cn";

type Customer = { id: string; name: string; documentNumber: string | null };

export function CustomerCombobox({
  customers,
  value,
  onChange,
}: {
  customers: Customer[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <User className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selected ? selected.name : "Cliente genérico"}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__generic__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check className={cn("size-4", value !== null && "opacity-0")} />
                Cliente genérico
              </CommandItem>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.documentNumber ?? ""}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value !== c.id && "opacity-0")} />
                  <span className="truncate">{c.name}</span>
                  {c.documentNumber && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {c.documentNumber}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
