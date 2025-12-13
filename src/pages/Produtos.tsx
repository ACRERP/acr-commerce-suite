import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Package,
  Filter,
  MoreHorizontal,
  Download,
  Box,
  AlertTriangle,
  TrendingUp,
  Tag,
  Wand2,
  Check,
  Upload,
  Loader2,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { generateEAN13 } from "@/lib/product-utils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { ImportProductsDialog } from '@/components/products/ImportProductsDialog';
import { useProducts, useCreateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { Product } from "@/lib/products";

interface ProdutosProps {
  openForm?: boolean;
}

const Produtos = ({ openForm = false }: ProdutosProps) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(openForm);
  const [generatedCode, setGeneratedCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Queries & Mutations
  const { data: products = [], isLoading, error: queryError } = useProducts();
  const createProductMutation = useCreateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",      // sale_price
    cost: "",       // cost_price
    stock: "",      // stock_quantity
    description: "",
    min_stock: "5"  // minimum_stock_level
  });

  const handleExport = () => {
    const dataToExport = products;

    const exportData = dataToExport.map(p => ({
      'Código': p.sku || p.code || '',
      'Nome': p.name,
      'Categoria': p.category || '',
      'Preço': p.sale_price || 0,
      'Estoque': p.stock_quantity || 0,
      'Custo': p.cost_price || 0
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");

    // Save file
    XLSX.writeFile(wb, `produtos_acr_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({ title: "Exportado!", description: "Planilha baixada com sucesso.", className: "bg-green-500 text-white" });
  };

  useEffect(() => {
    if (openForm) setIsModalOpen(true);
  }, [openForm]);

  const handleGenerateCode = () => {
    const ean = generateEAN13();
    setFormData(prev => ({ ...prev, sku: ean }));
    setGeneratedCode(ean);

    toast({
      title: "Código Gerado! 🏷️",
      description: `EAN-13 válido gerado: ${ean}`,
      duration: 3000,
    });
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        code: formData.sku || generatedCode || `SKU-${Date.now()}`,
        sku: formData.sku,
        description: formData.description,
        unit: 'UN', // Default
        stock_quantity: Number(formData.stock) || 0,
        minimum_stock_level: Number(formData.min_stock) || 5,
        sale_price: Number(formData.price) || 0,
        cost_price: Number(formData.cost) || 0,
        // category_id: null // TODO: Add category selector
      };

      await createProductMutation.mutateAsync(payload);

      setIsModalOpen(false);
      setFormData({
        name: "", sku: "", price: "", cost: "", stock: "", description: "", min_stock: "5"
      });
    } catch (e) {
      // Error handling is done in mutation hook
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await deleteProductMutation.mutateAsync(id);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="container-premium py-8 space-y-8">

        <ImportProductsDialog
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
        />

        {/* Header Section Premium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-50 dark:to-neutral-400 tracking-tight mb-2">
              Catálogo de Produtos
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Gestão de inventário, preços e organização
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="btn-secondary gap-2 hover-lift" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4" />
              Importar
            </Button>
            <Button variant="outline" className="btn-secondary gap-2 hover-lift" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              className="btn-primary hover-lift gap-2 shadow-lg shadow-primary-500/20"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Stats Grid Premium - REAL DATA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Total de SKUs</p>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {isLoading ? <Loader2 className="animate-spin" /> : products.length}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Estoque Baixo</p>
                <h3 className="text-3xl font-bold text-orange-600">
                  {isLoading ? "..." : products.filter(p => p.stock_quantity <= (p.minimum_stock_level || 5)).length}
                </h3>
                <p className="text-xs text-orange-600/80 mt-1 font-medium">Requer reposição</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card-premium hover-lift group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 dark:bg-green-900/30 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Valor do Estoque</p>
                <h3 className="text-3xl font-bold text-green-600">
                  {isLoading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(products.reduce((acc, p) => acc + ((p.sale_price || 0) * (p.stock_quantity || 0)), 0))}
                </h3>
                <p className="text-xs text-green-600/80 mt-1 font-medium">Preço de Venda</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search - Styled Premium */}
        <div className="card-premium p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nome, SKU, categoria..."
                className="pl-10 h-10 bg-neutral-50 border-neutral-200 focus:bg-white transition-all hover:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none hover:bg-neutral-50">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table Card Premium */}
        <div className="card-premium p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Produto</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Categoria</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Estoque</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Preço Venda</th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="w-10 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors duration-300">
                            {product.category === 'Celulares' || product.category === 'Tablets' ? <Package className="w-6 h-6" /> : <Box className="w-6 h-6" />}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100 block">{product.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-neutral-500 font-mono tracking-wide">{product.sku || product.code}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-neutral-400" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{product.category || 'Geral'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-bold inline-flex items-center px-2 py-0.5 rounded text-sm ${product.stock_quantity === 0 ? 'bg-red-50 text-red-600' :
                          product.stock_quantity < (product.minimum_stock_level || 5) ? 'bg-orange-50 text-orange-600' :
                            'text-neutral-700'
                          }`}>
                          {product.stock_quantity} un
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-neutral-900 dark:text-neutral-100 text-base">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(product.sale_price || 0)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {product.stock_quantity === 0 ? (
                          <Badge variant="destructive" className="shadow-none">Esgotado</Badge>
                        ) : product.stock_quantity < (product.minimum_stock_level || 5) ? (
                          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 shadow-none">Baixo</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 shadow-none">Ativo</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(product.sku || product.code)}
                            >
                              Copiar SKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Editar Produto</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(product.id)}
                            >
                              Excluir Produto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Box className="w-6 h-6 text-primary-600" />
                Novo Produto
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-12 gap-8 py-6">
              {/* Coluna da Imagem */}
              <div className="col-span-12 md:col-span-4 space-y-4">
                <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl aspect-square flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 transition-colors cursor-pointer group">
                  <div className="p-4 rounded-full bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">Carregar Imagem</p>
                  <p className="text-xs text-neutral-400">PNG, JPG até 5MB</p>
                </div>
              </div>

              {/* Coluna do Formulário */}
              <div className="col-span-12 md:col-span-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">

                  {/* Nome */}
                  <div className="col-span-2 space-y-2">
                    <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Nome do Produto</Label>
                    <Input
                      placeholder="Ex: Smartphone Samsung Galaxy..."
                      className="h-11 bg-neutral-50 border-neutral-200 focus:bg-white transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* SKU/Código */}
                  <div className="col-span-1 space-y-2">
                    <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Código (SKU/EAN)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Gerar ou digitar..."
                        className="h-11 bg-neutral-50 border-neutral-200 font-mono"
                        value={formData.sku}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-11 w-11 shrink-0"
                        onClick={handleGenerateCode}
                        title="Gerar EAN-13"
                      >
                        <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      </Button>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="col-span-1 space-y-2">
                    <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Preço de Venda</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">R$</span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        className="h-11 pl-9 bg-neutral-50 border-neutral-200 font-medium"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Estoque */}
                  <div className="col-span-1 space-y-2">
                    <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Estoque Inicial</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-11 bg-neutral-50 border-neutral-200"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  {/* Custo */}
                  <div className="col-span-1 space-y-2">
                    <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Preço de Custo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">R$</span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        className="h-11 pl-9 bg-neutral-50 border-neutral-200"
                        value={formData.cost}
                        onChange={e => setFormData({ ...formData, cost: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="col-span-2 space-y-2">
                    <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Descrição Detalhada</Label>
                    <Textarea
                      placeholder="Características, peso, dimensões..."
                      className="min-h-[100px] bg-neutral-50 border-neutral-200 resize-none"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="col-span-12 pt-6 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex justify-between gap-3 -mx-6 -mb-6 px-6 pb-6 mt-6 rounded-b-lg">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-11">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="h-11 px-8 btn-primary hover-lift shadow-lg shadow-primary-500/20"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Salvar Produto
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
};

export default Produtos;
