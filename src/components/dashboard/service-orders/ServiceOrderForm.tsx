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
import { ServiceOrderItemsManager, ServiceOrderItem } from './ServiceOrderItemsManager';
import { ImageUpload } from './ImageUpload';
import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  client_id: z.number().min(1, 'É obrigatório selecionar um cliente.'),
  device_type: z.string().min(1, 'O tipo do aparelho é obrigatório.'),
  device_brand: z.string().optional(),
  device_model: z.string().optional(),
  serial_number: z.string().optional(),
  reported_issue: z.string().min(5, 'Descreva o defeito com mais detalhes.'),
  condition: z.string().optional(),
  technician_notes: z.string().optional(),
  accessories_included: z.string().optional(),
  power_on: z.boolean().default(false),
  has_password: z.boolean().default(false),
  password_details: z.string().optional(),
  status: z.string().default('aberta'),
  device_powers_on: z.boolean().default(false),
  device_vibrates: z.boolean().default(false),
  intake_analysis: z.string().optional(),
  output_analysis: z.string().optional(),
});

interface ServiceOrderFormProps {
  onSubmit: (values: any) => void;
  isLoading: boolean;
  serviceOrder?: ServiceOrder | null;
}

export function ServiceOrderForm({ onSubmit, isLoading, serviceOrder }: ServiceOrderFormProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<ServiceOrderItem[]>([]);
  const [intakePhotos, setIntakePhotos] = useState<string[]>([]);
  const [outputPhotos, setOutputPhotos] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: 0,
      device_type: '',
      device_brand: '',
      device_model: '',
      serial_number: '',
      reported_issue: '',
      condition: '',
      technician_notes: '',
      accessories_included: '',
      power_on: false,
      has_password: false,
      password_details: '',
      status: 'aberta',
      device_powers_on: false,
      device_vibrates: false,
      intake_analysis: '',
      output_analysis: '',
    },
  });

  useEffect(() => {
    if (serviceOrder) {
      form.reset({
        client_id: serviceOrder.client_id,
        device_type: serviceOrder.device_type || '',
        device_brand: serviceOrder.device_brand || '',
        device_model: serviceOrder.device_model || '',
        serial_number: serviceOrder.serial_number || '',
        reported_issue: serviceOrder.reported_issue || '',
        condition: serviceOrder.condition || '',
        technician_notes: serviceOrder.technician_notes || '',
        accessories_included: serviceOrder.accessories_included || '',
        power_on: serviceOrder.power_on || false,
        has_password: serviceOrder.has_password || false,
        password_details: serviceOrder.password_details || '',
        status: serviceOrder.status || 'aberta',
        device_powers_on: serviceOrder.device_powers_on || false,
        device_vibrates: serviceOrder.device_vibrates || false,
        intake_analysis: serviceOrder.intake_analysis || '',
        output_analysis: serviceOrder.output_analysis || '',
      });
      if (serviceOrder.clients) {
        setSelectedClient(serviceOrder.clients as unknown as Client);
      }
      setIntakePhotos(serviceOrder.intake_photos || []);
      setOutputPhotos(serviceOrder.output_photos || []);
    }
  }, [serviceOrder, form]);

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    form.setValue('client_id', client?.id || 0);
  };

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const totalServices = items.filter(i => i.item_type === 'service').reduce((acc, i) => acc + i.total_price, 0);
    const totalParts = items.filter(i => i.item_type === 'part').reduce((acc, i) => acc + i.total_price, 0);

    const finalData = {
      ...values,
      items,
      intake_photos: intakePhotos,
      output_photos: outputPhotos,
      total_services: totalServices,
      total_parts: totalParts,
      final_value: totalServices + totalParts
    };

    onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <Accordion type="multiple" defaultValue={["general", "checklist", "items", "financial"]} className="w-full">

          {/* Dados Gerais */}
          <AccordionItem value="general">
            <AccordionTrigger className="text-base font-semibold">
              📋 Dados Gerais
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="client_id"
                render={() => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <ClientSearch onClientSelect={handleClientSelect} defaultClient={selectedClient} />
                    {selectedClient && (
                      <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex justify-between items-center">
                        <div>
                          <span className="font-bold">{selectedClient.name}</span><br />
                          <span className="text-xs">{selectedClient.phone || 'Sem telefone'}</span>
                        </div>
                        <Badge variant="secondary">{selectedClient.cpf_cnpj || 'Sem CPF/CNPJ'}</Badge>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="device_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Aparelho *</FormLabel>
                    <FormControl><Input placeholder="Ex: Celular" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="device_brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl><Input placeholder="Ex: Apple" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="device_model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl><Input placeholder="Ex: iPhone 15 Pro Max" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="reported_issue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Defeito Relatado *</FormLabel>
                  <FormControl><Textarea className="min-h-[100px]" placeholder="Descrição detalhada do problema..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="condition" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Físico do Aparelho</FormLabel>
                  <FormControl><Input placeholder="Ex: Tela riscada, marca de uso na lateral..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </AccordionContent>
          </AccordionItem>

          {/* Checklist de Entrada */}
          <AccordionItem value="checklist">
            <AccordionTrigger className="text-base font-semibold">
              ✅ Checklist de Entrada
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="device_powers_on" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Aparelho Liga?</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="device_vibrates" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Vibra?</FormLabel>
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="power_on" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Liga na Tomada?</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="has_password" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal">Possui Senha?</FormLabel>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="password_details" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha (se houver)</FormLabel>
                  <FormControl><Input placeholder="123456" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="intake_analysis" render={({ field }) => (
                <FormItem>
                  <FormLabel>Análise de Entrada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a condição do aparelho ao chegar (arranhões, trincas, etc.)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <ImageUpload
                images={intakePhotos}
                onImagesChange={setIntakePhotos}
                label="Fotos de Entrada"
                maxImages={5}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Peças e Serviços */}
          <AccordionItem value="items">
            <AccordionTrigger className="text-base font-semibold">
              🔧 Peças e Serviços
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <ServiceOrderItemsManager items={items} onItemsChange={setItems} />
            </AccordionContent>
          </AccordionItem>

          {/* Resumo Financeiro */}
          <AccordionItem value="financial">
            <AccordionTrigger className="text-base font-semibold">
              💰 Resumo Financeiro
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="p-6 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Resumo da Ordem de Serviço</h3>
                <div className="max-w-xs mx-auto space-y-2">
                  <div className="flex justify-between">
                    <span>Serviços:</span>
                    <span className="font-bold">R$ {items.filter(i => i.item_type === 'service').reduce((acc, i) => acc + i.total_price, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peças:</span>
                    <span className="font-bold">R$ {items.filter(i => i.item_type === 'part').reduce((acc, i) => acc + i.total_price, 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-lg text-primary">
                    <span>Total Geral:</span>
                    <span className="font-bold">R$ {items.reduce((acc, i) => acc + i.total_price, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg">
          {isLoading ? 'Salvando...' : (serviceOrder ? 'Salvar Alterações' : 'Criar Ordem de Serviço')}
        </Button>
      </form>
    </Form>
  );
}
