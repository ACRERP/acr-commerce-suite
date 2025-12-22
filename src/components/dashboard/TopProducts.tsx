import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TopProduct {
  product_name: string;
  total_sold: number;
}

interface TopProductsProps {
  data: TopProduct[] | null | undefined;
  isLoading: boolean;
}

export function TopProducts({ data, isLoading }: TopProductsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!data || data.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto vendido ainda.</p>
        ) : (
          data.map((product, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-muted-foreground">
                {index + 1}
              </div>
              <div className="flex-grow">
                <p className="font-medium truncate">{product.product_name}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{product.total_sold} <span className="text-xs text-muted-foreground">unid.</span></p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
