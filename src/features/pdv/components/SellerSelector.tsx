import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Loader2 } from "lucide-react";
import { useState } from 'react';

interface SellerSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (id: string, name: string) => void;
}

export function SellerSelector({ open, onOpenChange, onSelect }: SellerSelectorProps) {
    const [search, setSearch] = useState("");

    const { data: sellers, isLoading } = useQuery({
        queryKey: ['sellers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email')
                .or('role.eq.admin,role.eq.seller,role.eq.manager');

            if (error) throw error;
            return data;
        },
        enabled: open
    });

    const filteredSellers = sellers?.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-primary text-white">
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Selecionar Vendedor (F9)
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Buscar vendedor..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-neutral-400">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                Carregando...
                            </div>
                        ) : filteredSellers?.length === 0 ? (
                            <div className="text-center py-8 text-neutral-400">
                                Nenhum vendedor encontrado.
                            </div>
                        ) : (
                            filteredSellers?.map(seller => (
                                <Button
                                    key={seller.id}
                                    variant="outline"
                                    className="w-full justify-start h-14 gap-3 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                    onClick={() => {
                                        onSelect(seller.id, seller.name || seller.email);
                                        onOpenChange(false);
                                    }}
                                >
                                    <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-primary/10 group-hover:text-primary">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-sm">{seller.name || seller.email}</span>
                                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{seller.email}</span>
                                    </div>
                                </Button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
