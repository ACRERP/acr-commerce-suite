import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, User, Phone, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { clientService, Client } from "@/lib/clients/client-service";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ClientSearchProps {
    onSelect: (client: Client) => void;
    selectedClientId?: number;
}

export function ClientSearch({ onSelect, selectedClientId }: ClientSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Search query
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients-search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) return [];
            return await clientService.searchClients(debouncedQuery);
        },
        enabled: debouncedQuery.length >= 2,
    });

    // Get selected client for display
    const { data: selectedClient } = useQuery({
        queryKey: ['client', selectedClientId],
        queryFn: () => selectedClientId ? clientService.getClientById(selectedClientId) : null,
        enabled: !!selectedClientId,
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto py-3 px-4"
                >
                    {selectedClient ? (
                        <div className="flex items-start gap-3 text-left">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary-100 text-primary-700">
                                    {selectedClient.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium leading-none">{selectedClient.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedClient.phone || selectedClient.whatsapp || 'Sem telefone'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Buscar cliente por nome, CPF ou telefone...
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Digite nome, CPF, telefone..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Buscando...
                            </div>
                        )}
                        {!isLoading && query.length >= 2 && clients.length === 0 && (
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        )}
                        {!isLoading && query.length < 2 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Digite pelo menos 2 caracteres para buscar.
                            </div>
                        )}
                        <CommandGroup>
                            {clients.map((client) => (
                                <CommandItem
                                    key={client.id}
                                    value={client.id.toString()}
                                    onSelect={() => {
                                        onSelect(client);
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="flex-1">
                                            <p className="font-medium">{client.name}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                {(client.phone || client.whatsapp) && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {client.phone || client.whatsapp}
                                                    </span>
                                                )}
                                                {client.cpf_cnpj && (
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {client.cpf_cnpj}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedClientId === client.id && (
                                            <Check className="h-4 w-4 text-primary-600" />
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
