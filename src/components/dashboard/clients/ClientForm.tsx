import { useEffect, useState } from 'react';
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
import { CPFCNPJInput } from '@/components/common/CPFCNPJInput';
import { CEPInput } from '@/components/common/CEPInput';
import { Client } from './ClientList';
import { validateCPFCNPJ, ValidationResult } from '@/lib/validation';
import { CEPAddress } from '@/lib/cep';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  cep: z.string().optional(),
}).refine((data) => {
  // If CPF/CNPJ is provided, it must be valid
  if (data.cpf_cnpj && data.cpf_cnpj.trim()) {
    const validation = validateCPFCNPJ(data.cpf_cnpj);
    return validation.isValid;
  }
  return true;
}, {
  message: 'CPF ou CNPJ inválido',
  path: ['cpf_cnpj']
});

interface ClientFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
  client?: Client | null;
}

export function ClientForm({ onSubmit, isLoading, client }: ClientFormProps) {
  const [cpfCnpjValidation, setCpfCnpjValidation] = useState<ValidationResult>({ isValid: true });
  const [cepAddress, setCepAddress] = useState<CEPAddress | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      cpf_cnpj: '',
      cep: '',
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        phone: client.phone || '',
        address: client.address || '',
        cpf_cnpj: client.cpf_cnpj || '',
        cep: '', // CEP is not stored in the client table, but could be extracted from address
      });
    }
  }, [client, form]);

  // Handle CEP address found
  const handleAddressFound = (address: CEPAddress) => {
    setCepAddress(address);
    
    // Auto-fill address fields
    const fullAddress = [
      address.logradouro,
      address.complemento,
      address.bairro,
      address.localidade,
      address.uf,
    ].filter(Boolean).join(', ');

    form.setValue('address', fullAddress);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="Ex: (11) 99999-8888" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpf_cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF ou CNPJ</FormLabel>
              <FormControl>
                <CPFCNPJInput
                  placeholder="Ex: 123.456.789-00 ou 12.345.678/0001-95"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  onBlur={() => {
                    field.onBlur();
                  }}
                  onValidationChange={setCpfCnpjValidation}
                  validateOnChange={true}
                  showValidationIcon={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP</FormLabel>
              <FormControl>
                <CEPInput
                  placeholder="Ex: 01310-100"
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  onBlur={() => {
                    field.onBlur();
                  }}
                  onAddressFound={handleAddressFound}
                  autoLookup={true}
                  showLookupButton={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço Completo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Rua das Flores, 123, Centro, São Paulo - SP" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
              {cepAddress && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  <div className="font-medium mb-1">Endereço preenchido automaticamente:</div>
                  <div>{cepAddress.logradouro}</div>
                  {cepAddress.complemento && <div>Complemento: {cepAddress.complemento}</div>}
                  <div>{cepAddress.bairro}</div>
                  <div>{cepAddress.localidade} - {cepAddress.uf}</div>
                </div>
              )}
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : (client ? 'Salvar Alterações' : 'Salvar Cliente')}
        </Button>
      </form>
    </Form>
  );
}
