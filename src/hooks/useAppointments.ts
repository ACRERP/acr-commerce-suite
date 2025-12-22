import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, Appointment } from '@/lib/appointments/appointment-service';
import { useToast } from './use-toast';

export function useAppointments(startDate: string, endDate: string) {
    return useQuery({
        queryKey: ['appointments', startDate, endDate],
        queryFn: () => appointmentService.getAppointments(startDate, endDate),
    });
}

export function useCreateAppointment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (appointment: Appointment) => appointmentService.createAppointment(appointment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast({
                title: "Agendamento Criado!",
                description: "O horário foi reservado com sucesso.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar agendamento",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

export function useUpdateAppointment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, updates }: { id: number; updates: Partial<Appointment> }) => 
            appointmentService.updateAppointment(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast({
                title: "Agendamento Atualizado!",
                description: "As alterações foram salvas.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}

export function useDeleteAppointment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (id: number) => appointmentService.deleteAppointment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            toast({
                title: "Agendamento Excluído",
                description: "O registro foi removido com sucesso.",
            });
        },
    });
}
