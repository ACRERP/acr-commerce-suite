import { ChevronsUpDown, Building2, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function OrganizationSwitcher() {
    const { currentOrganization, organizations, switchOrganization, isLoading } = useOrganization();

    if (isLoading) return <div className="h-12 w-full animate-pulse bg-white/5 rounded-lg" />;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-between h-14 px-3 hover:bg-white/5 data-[state=open]:bg-white/5 text-left group transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform text-white font-bold text-sm">
                            {currentOrganization?.name?.substring(0, 2).toUpperCase() || "OR"}
                        </div>
                        <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-sm font-bold text-white truncate max-w-[140px]">
                                {currentOrganization?.name || "Selecione a Org"}
                            </span>
                            <span className="text-[10px] text-white/50 truncate">
                                {currentOrganization?.role || "Membro"} • {currentOrganization?.slug || "corp"}
                            </span>
                        </div>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50 text-white group-hover:opacity-100" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[240px] p-2 glass-window border-white/10 text-white">
                <DropdownMenuLabel className="text-xs font-bold text-white/40 uppercase tracking-widest px-2 py-1.5">
                    Organizações
                </DropdownMenuLabel>
                {organizations.map((org) => (
                    <DropdownMenuItem
                        key={org.id}
                        onClick={() => switchOrganization(org.id)}
                        className="flex items-center justify-between p-2 cursor-pointer focus:bg-white/10 focus:text-white rounded-lg group"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                {org.name.substring(0, 1)}
                            </div>
                            <span className="text-sm font-medium">{org.name}</span>
                        </div>
                        {currentOrganization?.id === org.id && (
                            <Check className="h-4 w-4 text-green-400" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/10 my-2" />
                <DropdownMenuItem className="p-2 cursor-pointer focus:bg-white/10 focus:text-white rounded-lg text-primary-400">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Criar Nova</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
