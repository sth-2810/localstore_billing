import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  useHealthCheck, 
  useListProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Package, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductInputUnitType, Product } from "@workspace/api-client-react/src/generated/api.schemas";

export default function SetupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: health } = useHealthCheck();
  const { data: products } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product form
  const [pName, setPName] = useState("");
  const [pBarcode, setPBarcode] = useState("");
  const [pPurchasePrice, setPPurchasePrice] = useState("");
  const [pSellingPrice, setPSellingPrice] = useState("");
  const [pMrp, setPMrp] = useState("");
  const [pUnit, setPUnit] = useState<ProductInputUnitType>("PCS");

  const openNewProduct = () => {
    setEditingProduct(null);
    setPName("");
    setPBarcode("");
    setPPurchasePrice("");
    setPSellingPrice("");
    setPMrp("");
    setPUnit("PCS");
    setProductDialogOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setPName(p.name);
    setPBarcode(p.barcode || "");
    setPPurchasePrice(p.purchasePrice?.toString() || "");
    setPSellingPrice(p.sellingPrice.toString());
    setPMrp(p.mrp.toString());
    setPUnit(p.unitType as ProductInputUnitType);
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!pName || !pSellingPrice || !pMrp) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: {
            name: pName,
            barcode: pBarcode || undefined,
            purchasePrice: pPurchasePrice ? parseFloat(pPurchasePrice) : undefined,
            sellingPrice: parseFloat(pSellingPrice),
            mrp: parseFloat(pMrp),
            unitType: pUnit as any
          }
        });
        toast({ title: "Product updated" });
      } else {
        await createProduct.mutateAsync({
          data: {
            name: pName,
            barcode: pBarcode || undefined,
            purchasePrice: pPurchasePrice ? parseFloat(pPurchasePrice) : undefined,
            sellingPrice: parseFloat(pSellingPrice),
            mrp: parseFloat(pMrp),
            unitType: pUnit
          }
        });
        toast({ title: "Product created" });
      }
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      setProductDialogOpen(false);
    } catch (err) {
      toast({ title: "Error saving product", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Delete this product?")) {
      try {
        await deleteProduct.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product deleted" });
      } catch (err) {
        toast({ title: "Error deleting", variant: "destructive" });
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to Rice and Oil Shop</h1>
        <div className="flex gap-2">
          {health?.status === "ok" ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Server OK</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Server Offline</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Printer Connected</span>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Products Database
            </CardTitle>
            <CardDescription>Manage your store inventory</CardDescription>
          </div>
          <Button onClick={openNewProduct} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="pl-6 font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{p.barcode || '-'}</TableCell>
                  <TableCell>₹{p.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">₹{p.mrp.toFixed(2)}</TableCell>
                  <TableCell>{p.unitType}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="icon" onClick={() => openEditProduct(p)} className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No products found. Add some to get started.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={pName} onChange={e => setPName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Barcode (Optional)</Label>
              <Input value={pBarcode} onChange={e => setPBarcode(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <Input type="number" step="0.01" value={pSellingPrice} onChange={e => setPSellingPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>MRP</Label>
                <Input type="number" step="0.01" value={pMrp} onChange={e => setPMrp(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price (Optional)</Label>
                <Input type="number" step="0.01" value={pPurchasePrice} onChange={e => setPPurchasePrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Unit Type</Label>
                <Select value={pUnit} onValueChange={(v: any) => setPUnit(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCS">PCS</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="Gram">Gram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProduct} disabled={createProduct.isPending || updateProduct.isPending}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
