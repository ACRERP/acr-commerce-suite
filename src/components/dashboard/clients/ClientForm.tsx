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
import { User, Phone, MapPin, CreditCard, Home, Save } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().optional(),
  address: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  cep: z.string().optional(),
}).refine((data) => {
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
        cep: '',
      });
    }
  }, [client, form]);

  const handleAddressFound = (address: CEPAddress) => {
    setCepAddress(address);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome Completo */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Nome Completo *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: João da Silva"
                    {...field}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Telefone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  Telefone
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: (11) 99999-8888"
                    {...field}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CPF/CNPJ */}
          <FormField
            control={form.control}
            name="cpf_cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  CPF ou CNPJ
                </FormLabel>
                <FormControl>
                  <CPFCNPJInput
                    placeholder="Ex: 123.456.789-00"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={() => field.onBlur()}
                    onValidationChange={setCpfCnpjValidation}
                    validateOnChange={true}
                    showValidationIcon={true}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CEP */}
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  CEP
                </FormLabel>
                <FormControl>
                  <CEPInput
                    placeholder="Ex: 01310-100"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={() => field.onBlur()}
                    onAddressFound={handleAddressFound}
                    autoLookup={true}
                    showLookupButton={true}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Endereço Completo - Largura total */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Home className="w-4 h-4 text-indigo-600" />
                Endereço Completo
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Rua das Flores, 123, Centro, São Paulo - SP"
                  {...field}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </FormControl>
              <FormMessage />
              {cepAddress && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    Endereço preenchido automaticamente
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
                    <div>{cepAddress.logradouro}</div>
                    {cepAddress.complemento && <div>Complemento: {cepAddress.complemento}</div>}
                    <div>{cepAddress.bairro}</div>
                    <div>{cepAddress.localidade} - {cepAddress.uf}</div>
                  </div>
                </div>
              )}
            </FormItem>
          )}
        />

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {client ? 'Salvar Alterações' : 'Salvar Cliente'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
