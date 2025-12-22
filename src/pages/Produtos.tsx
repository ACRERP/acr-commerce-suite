import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts, useCreateProduct, useDeleteProduct } from "@/hooks/useProducts";
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
import { Product, createBatch } from "@/lib/products";
import { QuickActionPopover } from "@/components/products/QuickActionPopover";
import { FeatureGuard } from "@/components/auth/Guards";
import { useBusinessProfile } from "@/contexts/BusinessProfileContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Hash, Layers } from "lucide-react";

interface ProdutosProps {
  openForm?: boolean;
  defaultTab?: string;
}

const Produtos = ({ openForm = false, defaultTab }: ProdutosProps) => {
  const { toast } = useToast();
  const { activeProfile } = useBusinessProfile();
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

  const [variations, setVariations] = useState<any[]>([]);
  const [newVariation, setNewVariation] = useState({ color: "", size: "" });

  const [batches, setBatches] = useState<any[]>([]);
  const [newBatch, setNewBatch] = useState({ number: "", expiry: "", quantity: "" });

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
        variations: variations.map(v => ({
          name: `${formData.name} - ${v.color} ${v.size}`.trim(),
          sku: `${formData.sku || 'SKU'}-${v.color}-${v.size}`,
          stock_quantity: Number(formData.stock) / variations.length || 0, // Split stock or handle individually
          attributes: { color: v.color, size: v.size }
        }))
      };

      const product = await createProductMutation.mutateAsync(payload);

      // Handle batches separately
      if (batches.length > 0) {
        await Promise.all(batches.map(batch =>
          createBatch({
            product_id: product.id,
            batch_number: batch.number,
            expiry_date: batch.expiry,
            quantity: Number(batch.quantity) || 0
          })
        ));
      }

      setIsModalOpen(false);
      setFormData({
        name: "", sku: "", price: "", cost: "", stock: "", description: "", min_stock: "5"
      });
      setVariations([]);
      setBatches([]);
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

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <MainLayout>
      <div className="w-full max-w-[95%] mx-auto px-4 py-8 space-y-8">

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
            <div className="relative w-full md:w-[600px]">
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

        {/* Top Pagination Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500 px-2 my-2">
          <div className="flex items-center gap-4">
            <span className="ml-2">Total: <strong className="text-neutral-900 dark:text-white">{filteredProducts.length}</strong> produtos</span>

            <div className="flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-700 pl-4">
              <span>Exibir</span>
              <select
                className="h-8 w-16 rounded-md border border-neutral-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-2">
            <span>Página {currentPage} de {totalPages || 1}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
                className="h-8"
              >
                Próxima
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
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Ações Rápidas</th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="w-10 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Carregando produtos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
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
                      {/* QUICK ACTION COLUMN */}
                      <td className="py-4 px-6 text-center">
                        <QuickActionPopover product={product} />
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
                  )))
                }
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-0 shadow-2xl glass-window glass-window-compact !p-0">
            <DialogHeader className="p-5 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80 text-white backdrop-blur-md border-b border-white/10">
              <DialogTitle className="flex items-center gap-2 text-lg font-black">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Box className="w-4 h-4 text-white" />
                </div>
                Novo Produto
              </DialogTitle>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-[2px] mt-0.5">Cadastre itens para o catálogo oficial</p>
            </DialogHeader>

            <div className="max-h-[75vh] overflow-y-auto px-6 py-5 bg-white/5 backdrop-blur-sm space-y-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Imagem */}
                <div className="col-span-12 md:col-span-3">
                  <div className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center bg-black/20 hover:bg-black/30 transition-all cursor-pointer group backdrop-blur-md overflow-hidden relative">
                    <div className="p-3 rounded-full bg-white/5 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-white/40" />
                    </div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Imagem</p>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Detalhes Prinicpais */}
                <div className="col-span-12 md:col-span-9 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Nome */}
                    <div className="col-span-2 space-y-1">
                      <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Nome do Produto</Label>
                      <Input
                        placeholder="Ex: Smartphone Samsung Galaxy..."
                        className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 transition-all input-compact font-bold"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    {/* SKU/Código */}
                    <div className="col-span-1 space-y-1">
                      <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">SKU/EAN</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Gerar..."
                          className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 font-mono text-[11px] input-compact"
                          value={formData.sku}
                          onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-10 w-10 shrink-0 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                          onClick={handleGenerateCode}
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Preço */}
                    <div className="col-span-1 space-y-1">
                      <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Preço Venda</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                        <Input
                          type="number"
                          placeholder="0,00"
                          className="h-10 pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/20 input-compact font-bold"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Estoque */}
                <div className="col-span-1 space-y-1">
                  <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Estoque</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="h-10 bg-black/20 border-white/10 text-white placeholder:text-white/20 input-compact font-bold"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>

                {/* Custo */}
                <div className="col-span-1 space-y-1">
                  <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Custo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] font-black">R$</span>
                    <Input
                      type="number"
                      placeholder="0,00"
                      className="h-10 pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/20 input-compact font-bold"
                      value={formData.cost}
                      onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div className="col-span-2 space-y-1">
                  <Label className="uppercase text-[9px] font-black text-white/40 tracking-[2px] ml-1">Descrição</Label>
                  <Textarea
                    placeholder="..."
                    className="min-h-[60px] bg-black/20 border-white/10 text-white placeholder:text-white/20 text-xs rounded-xl focus:bg-black/40 transition-all font-medium"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Seções Especializadas via FeatureGuard */}
              <div className="col-span-2 space-y-6 pt-4 border-t border-white/10">
                {/* Grade de Variantes (Moda/Beleza) */}
                <FeatureGuard feature={['variants_grid', 'color_variation']}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white/60">
                      <Layers className="w-4 h-4" />
                      <h4 className="font-black uppercase text-[10px] tracking-widest">Grade de Variantes</h4>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Configure tamanhos, cores ou modelos.</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Cor"
                          className="h-9 bg-black/20 border-white/10 text-white text-xs"
                          value={newVariation.color}
                          onChange={e => setNewVariation({ ...newVariation, color: e.target.value })}
                        />
                        <Input
                          placeholder="Tam"
                          className="h-9 bg-black/20 border-white/10 text-white text-xs"
                          value={newVariation.size}
                          onChange={e => setNewVariation({ ...newVariation, size: e.target.value })}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 bg-white/10 border-white/10 text-white hover:bg-white/20"
                          onClick={() => {
                            if (newVariation.color || newVariation.size) {
                              setVariations([...variations, newVariation]);
                              setNewVariation({ color: "", size: "" });
                            }
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>

                      {variations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {variations.map((v, i) => (
                            <Badge key={i} variant="secondary" className="flex gap-1 items-center px-2 py-1 bg-white/10 text-white border-white/5">
                              {v.color} {v.size}
                              <Trash2
                                className="w-3 h-3 cursor-pointer hover:text-red-400"
                                onClick={() => setVariations(variations.filter((_, idx) => idx !== i))}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </FeatureGuard>

                {/* Controle de Lotes (Farmácia) */}
                <FeatureGuard feature="batch_control">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-white/60">
                      <Hash className="w-4 h-4" />
                      <h4 className="font-black uppercase text-[10px] tracking-widest">Controle de Lotes</h4>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-white/30 uppercase">Nº do Lote</Label>
                          <Input
                            placeholder="LOTE123X"
                            className="bg-black/20 h-9 border-white/10 text-white text-xs"
                            value={newBatch.number}
                            onChange={e => setNewBatch({ ...newBatch, number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-white/30 uppercase">Validade</Label>
                          <Input
                            type="date"
                            className="bg-black/20 h-9 border-white/10 text-white text-xs"
                            value={newBatch.expiry}
                            onChange={e => setNewBatch({ ...newBatch, expiry: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <Input
                            placeholder="Qtd"
                            type="number"
                            className="bg-black/20 h-9 w-20 border-white/10 text-white text-xs"
                            value={newBatch.quantity}
                            onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 flex-1 bg-white/10 border-white/10 text-white hover:bg-white/20"
                            onClick={() => {
                              if (newBatch.number && newBatch.expiry) {
                                setBatches([...batches, newBatch]);
                                setNewBatch({ number: "", expiry: "", quantity: "" });
                              }
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Registrar Lote
                          </Button>
                        </div>
                      </div>

                      {batches.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {batches.map((b, i) => (
                            <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 text-[10px] text-white/70">
                              <span>Lote: <strong>{b.number}</strong> (Val: {b.expiry})</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] border-white/10">{b.quantity} un</Badge>
                                <Trash2
                                  className="w-3 h-3 cursor-pointer hover:text-red-400"
                                  onClick={() => setBatches(batches.filter((_, idx) => idx !== i))}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </FeatureGuard>
              </div>
            </div>

            <DialogFooter className="p-5 bg-black/20 dark:bg-black/40 border-t border-white/5 flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="h-11 text-white/50 hover:text-white hover:bg-white/5">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="h-11 px-8 btn-primary hover-lift shadow-lg shadow-primary-500/20 text-xs font-black uppercase tracking-wider"
                disabled={createProductMutation.isPending}
              >
                {createProductMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Salvar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
};

export default Produtos;
