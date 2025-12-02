import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, Filter } from "lucide-react";

const mockProducts = [
  { id: 1, name: "Smartphone Galaxy A54", sku: "SKU-001", stock: 45, price: 1899.99, category: "Celulares" },
  { id: 2, name: "Notebook Dell Inspiron", sku: "SKU-002", stock: 12, price: 4599.99, category: "Notebooks" },
  { id: 3, name: "Fone Bluetooth JBL", sku: "SKU-003", stock: 78, price: 299.99, category: "Áudio" },
  { id: 4, name: "Tablet iPad Air", sku: "SKU-004", stock: 8, price: 5999.99, category: "Tablets" },
  { id: 5, name: "Smart TV 55\" LG", sku: "SKU-005", stock: 15, price: 3499.99, category: "TVs" },
];

const Produtos = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu catálogo e estoque
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar produtos..." className="pl-9" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        <div className="stat-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Produto</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SKU</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Categoria</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Estoque</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Preço</th>
              </tr>
            </thead>
            <tbody>
              {mockProducts.map((product, index) => (
                <tr
                  key={product.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{product.sku}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full bg-secondary text-xs font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={product.stock < 10 ? "text-destructive font-medium" : ""}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Produtos;
