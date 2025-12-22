import * as React from "react"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    User,
    LayoutDashboard,
    ShoppingCart,
    Package,
    Wrench,
    Users,
    DollarSign,
    BarChart3,
    FileText,
    Truck,
    PlusCircle
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useNavigate } from "react-router-dom"

export function GlobalCommandPalette() {
    const [open, setOpen] = React.useState(false)
    const navigate = useNavigate()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Digite um comando ou busque..." />
            <CommandList>
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                <CommandGroup heading="Ações Rápidas">
                    <CommandItem onSelect={() => runCommand(() => navigate("/vendas"))}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Nova Venda (PDV)</span>
                        <CommandShortcut>F2</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/ordens-servico"))}>
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Nova Ordem de Serviço</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/clientes"))}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Novo Cliente</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Navegação">
                    <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/vendas"))}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Vendas</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/produtos"))}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Produtos</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/ordens-servico"))}>
                        <Wrench className="mr-2 h-4 w-4" />
                        <span>Ordens de Serviço</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/clientes"))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Clientes</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/financeiro"))}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span>Financeiro</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Outros">
                    <CommandItem onSelect={() => runCommand(() => navigate("/relatorios"))}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Relatórios</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/configuracoes"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
