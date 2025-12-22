import { SalesHistoryList } from '@/components/dashboard/sales/SalesHistoryList';

export function SalesHistoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Vendas</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as vendas realizadas no sistema.
        </p>
      </div>
      <SalesHistoryList />
    </div>
  );
}
