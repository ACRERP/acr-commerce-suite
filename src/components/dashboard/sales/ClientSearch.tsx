import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Client } from '../clients/ClientList';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function searchClients(searchTerm: string) {
  if (!searchTerm) return [];
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .limit(5);
  if (error) throw new Error(error.message);
  return data;
}

interface ClientSearchProps {
  onClientSelect: (client: Client | null) => void;
}

export function ClientSearch({ onClientSelect }: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useQuery<Client[], Error>({
    queryKey: ['clientSearch', searchTerm],
    queryFn: () => searchClients(searchTerm),
    enabled: searchTerm.length > 1 && !selectedClient,
  });

  const handleSelect = (client: Client) => {
    setSelectedClient(client);
    onClientSelect(client);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedClient(null);
    onClientSelect(null);
  };

  if (selectedClient) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{selectedClient.name}</p>
              <p className="text-sm text-muted-foreground">{selectedClient.cpf_cnpj}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear}>Alterar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Digite o nome ou CPF/CNPJ do cliente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
          <ScrollArea className="h-auto max-h-48">
            {isLoading && <div className="p-4 text-sm text-muted-foreground">Buscando...</div>}
            {clients && clients.length === 0 && !isLoading && (
              <div className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
            )}
            {clients?.map((client) => (
              <div
                key={client.id}
                className="p-2 hover:bg-muted cursor-pointer"
                onClick={() => handleSelect(client)}
              >
                {client.name}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
