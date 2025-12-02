import { Progress } from "@/components/ui/progress";

const products = [
  { name: "Smartphone Galaxy A54", sales: 156, revenue: 62400, progress: 100 },
  { name: "Notebook Dell Inspiron", sales: 89, revenue: 445000, progress: 72 },
  { name: "Fone Bluetooth JBL", sales: 234, revenue: 35100, progress: 85 },
  { name: "Tablet iPad Air", sales: 67, revenue: 268000, progress: 54 },
  { name: "Smart TV 55\" LG", sales: 45, revenue: 157500, progress: 38 },
];

export function TopProducts() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Produtos Mais Vendidos</h3>
        <span className="text-xs text-muted-foreground">Últimos 30 dias</span>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div
            key={product.name}
            className="space-y-2 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                {product.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {product.sales} vendas
              </span>
            </div>
            <Progress value={product.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(product.revenue)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
