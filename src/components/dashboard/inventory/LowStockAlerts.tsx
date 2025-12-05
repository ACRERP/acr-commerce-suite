import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/format';

export function LowStockAlerts() {
  const { data: products } = useProducts();
  const navigate = useNavigate();

  const lowStockProducts = products?.filter(product => 
    product.stock_quantity <= (product.minimum_stock_level || 0)
  ) || [];

  const criticalStockProducts = lowStockProducts.filter(product => 
    product.stock_quantity === 0
  );

  const warningStockProducts = lowStockProducts.filter(product => 
    product.stock_quantity > 0 && product.stock_quantity <= (product.minimum_stock_level || 0)
  );

  if (lowStockProducts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 text-green-300" />
            <p className="text-green-600 font-medium">Nenhum produto com estoque baixo</p>
            <p className="text-sm">Todos os produtos estão com estoque adequado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Sem Estoque</p>
                <p className="text-2xl font-bold text-red-700">{criticalStockProducts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-700">{warningStockProducts.length}</p>
              </div>
              <Package className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total de Alertas</p>
                <p className="text-2xl font-bold text-orange-700">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock Products */}
      {criticalStockProducts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Produtos Sem Estoque ({criticalStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{product.name}</h4>
                      <Badge variant="destructive">Sem Estoque</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Código: {product.code} | Estoque mínimo: {product.minimum_stock_level}
                    </p>
                    {product.price && (
                      <p className="text-sm text-muted-foreground">
                        Preço: {formatCurrency(product.price)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                    className="ml-4"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Gerenciar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Products */}
      {warningStockProducts.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-600">
              <Package className="h-5 w-5 mr-2" />
              Produtos com Estoque Baixo ({warningStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warningStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{product.name}</h4>
                      <Badge variant="secondary">Estoque Baixo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Código: {product.code} | Estoque atual: {product.stock_quantity} | Mínimo: {product.minimum_stock_level}
                    </p>
                    {product.price && (
                      <p className="text-sm text-muted-foreground">
                        Preço: {formatCurrency(product.price)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                    className="ml-4"
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Gerenciar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/inventory')}
              className="w-full justify-start"
            >
              <Package className="h-4 w-4 mr-2" />
              Gerenciar Estoque
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/products/new')}
              className="w-full justify-start"
            >
              <Package className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
