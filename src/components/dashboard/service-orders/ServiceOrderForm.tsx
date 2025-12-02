import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ClientSearch } from '../sales/ClientSearch';
import { Client } from '../clients/ClientList';
import { ServiceOrder } from './ServiceOrderList';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  client_id: z.number().min(1, 'É obrigatório selecionar um cliente.'),
  device_type: z.string().min(1, 'O tipo do aparelho é obrigatório.'),
  device_brand: z.string().optional(),
  device_model: z.string().optional(),
  serial_number: z.string().optional(),
  reported_issue: z.string().min(5, 'Descreva o defeito com mais detalhes.'),
  technician_notes: z.string().optional(),
  accessories_included: z.string().optional(),
  power_on: z.boolean().default(false),
  has_password: z.boolean().default(false),
  password_details: z.string().optional(),
});

interface ServiceOrderFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  serviceOrder?: ServiceOrder | null;
}

export function ServiceOrderForm({ onSubmit, isLoading, serviceOrder }: ServiceOrderFormProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: 0,
      device_type: '',
      reported_issue: '',
      power_on: false,
      has_password: false,
    },
  });

  useEffect(() => {
    if (serviceOrder) {
      // Preenche o formulário com os dados da OS
      form.reset({
        client_id: serviceOrder.client_id,
        device_type: serviceOrder.device_type,
        device_brand: serviceOrder.device_brand || '',
        device_model: serviceOrder.device_model || '',
        serial_number: serviceOrder.serial_number || '',
        reported_issue: serviceOrder.reported_issue,
        technician_notes: serviceOrder.technician_notes || '',
        accessories_included: serviceOrder.accessories_included || '',
        power_on: serviceOrder.power_on,
        has_password: serviceOrder.has_password,
        password_details: serviceOrder.password_details || '',
      });

      // Preenche o componente de busca de cliente
      if (serviceOrder.clients && serviceOrder.clients.length > 0) {
        setSelectedClient(serviceOrder.clients[0] as Client);
      }
    } else {
      // Limpa o formulário para uma nova OS
      form.reset({
        client_id: 0,
        device_type: '',
        device_brand: '',
        device_model: '',
        serial_number: '',
        reported_issue: '',
        technician_notes: '',
        accessories_included: '',
        power_on: false,
        has_password: false,
        password_details: '',
      });
      setSelectedClient(null);
    }
  }, [serviceOrder, form]);

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    form.setValue('client_id', client?.id || 0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="client_id"
          render={() => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <ClientSearch onClientSelect={handleClientSelect} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="device_type" render={({ field }) => (<FormItem><FormLabel>Tipo de Aparelho</FormLabel><FormControl><Input placeholder="Ex: Celular" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="device_brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ex: Apple" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <FormField control={form.control} name="device_model" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ex: iPhone 15 Pro Max" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="reported_issue" render={({ field }) => (<FormItem><FormLabel>Defeito Relatado</FormLabel><FormControl><Textarea placeholder="Cliente relatou que o aparelho não liga..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        
        <div className="space-y-2">
            <FormLabel>Checklist de Entrada</FormLabel>
            <div className="flex items-center space-x-2"><FormField control={form.control} name="power_on" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Aparelho liga?</FormLabel></FormItem>)} /></div>
            <div className="flex items-center space-x-2"><FormField control={form.control} name="has_password" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Possui senha?</FormLabel></FormItem>)} /></div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Salvando...' : (serviceOrder ? 'Salvar Alterações' : 'Criar Ordem de Serviço')}
        </Button>
      </form>
    </Form>
  );
}
