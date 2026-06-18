import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarcodeScannerModal } from "@/components/barcode-scanner-modal";
import { getGetBillStatsQueryKey, getProductByBarcode, useCreateBill, useGetBillStats, useListProducts } from "@workspace/api-client-react";
import { Camera, Plus, Trash2, Printer, ShoppingCart, ShoppingBag, CheckCircle2 } from "lucide-react";
import type { BillItem, Bill, Product } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";

export default function BillingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<BillItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Saved bill shown in receipt dialog
  const [savedBill, setSavedBill] = useState<Bill | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [barcode, setBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [unitType, setUnitType] = useState("PCS");
  const [quantity, setQuantity] = useState("1");

  const createBill = useCreateBill();
  const { data: stats } = useGetBillStats();
  const { data: allProducts = [] } = useListProducts();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const productNameRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        productNameRef.current && !productNameRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nameSuggestions = productName.trim().length >= 1
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(productName.trim().toLowerCase())
      ).slice(0, 8)
    : [];

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pending = localStorage.getItem("pendingProduct");
    if (pending) {
      try {
        const product: Product = JSON.parse(pending);
        fillProduct(product);
        localStorage.removeItem("pendingProduct");
      } catch (_e) {}
    }
  }, []);

  const fillProduct = (product: Product) => {
    setBarcode(product.barcode || "");
    setProductName(product.name);
    setSellingPrice(product.sellingPrice.toString());
    setMrp(product.mrp.toString());
    setUnitType(product.unitType);
    setQuantity("1");
  };

  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && barcode.trim()) {
      e.preventDefault();
      try {
        const product = await getProductByBarcode(barcode.trim());
        if (product) {
          fillProduct(product);
        } else {
          toast({ title: "Not found", description: "Fill details manually.", variant: "default" });
        }
      } catch (_err) {
        toast({ title: "Not found", description: "Fill details manually.", variant: "default" });
      }
    }
  };

  const handleAddItem = (e?: React.KeyboardEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productName || !sellingPrice || !quantity) {
      toast({ title: "Missing fields", description: "Name, Selling Price, and Qty are required.", variant: "destructive" });
      return;
    }
    const qtyNum = parseFloat(quantity);
    const spNum = parseFloat(sellingPrice);
    if (isNaN(qtyNum) || qtyNum <= 0 || isNaN(spNum) || spNum < 0) {
      toast({ title: "Invalid values", description: "Check price and quantity.", variant: "destructive" });
      return;
    }
    const newItem: BillItem = {
      barcode: barcode || null,
      productName,
      quantity: qtyNum,
      unitType,
      sellingPrice: spNum,
      total: qtyNum * spNum,
    };
    setItems((prev) => [...prev, newItem]);
    setBarcode("");
    setProductName("");
    setSellingPrice("");
    setMrp("");
    setUnitType("PCS");
    setQuantity("1");
    barcodeInputRef.current?.focus();
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQty = (index: number, newQty: string) => {
    const qtyNum = parseFloat(newQty);
    if (isNaN(qtyNum) || qtyNum < 0) return;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: qtyNum, total: qtyNum * next[index].sellingPrice };
      return next;
    });
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSaveBill = async () => {
    if (items.length === 0) {
      toast({ title: "Empty bill", description: "Add some items first.", variant: "destructive" });
      return;
    }
    try {
      const bill = await createBill.mutateAsync({ data: { items, grandTotal } });
      // Refresh stats
      queryClient.invalidateQueries({ queryKey: getGetBillStatsQueryKey() });
      // Show receipt dialog — do NOT clear items yet
      setSavedBill(bill);
      setReceiptOpen(true);
    } catch (_err) {
      toast({ title: "Error saving bill", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleCloseReceipt = () => {
    setReceiptOpen(false);
    setSavedBill(null);
    // Now clear items for next bill
    setItems([]);
    barcodeInputRef.current?.focus();
  };

  const handlePrint = () => {
    if (!savedBill) return;

    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Bill #${savedBill.billNumber} - My Shop</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; background: #fff; padding: 24px 32px; }
    .center { text-align: center; }
    .shop-name { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #444; margin-bottom: 2px; }
    .divider { border-top: 1px dashed #000; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { font-size: 11px; text-align: left; padding: 4px 0; border-bottom: 1px solid #000; }
    th.right, td.right { text-align: right; }
    td { font-size: 12px; padding: 5px 0; border-bottom: 1px dotted #ccc; vertical-align: top; }
    .total-row td { border-top: 2px solid #000; border-bottom: none; font-weight: bold; font-size: 14px; padding-top: 8px; }
    .thankyou { text-align: center; margin-top: 20px; font-size: 11px; color: #555; }
    @media print {
      body { padding: 10px 16px; }
      @page { margin: 0.5cm; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="shop-name">My Shop</div>
    <div class="meta">Bill #${savedBill.billNumber}</div>
    <div class="meta">${new Date().toLocaleString("en-IN")}</div>
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th style="width:42%">Item</th>
        <th class="right" style="width:18%">Qty</th>
        <th class="right" style="width:18%">Price</th>
        <th class="right" style="width:22%">Total</th>
      </tr>
    </thead>
    <tbody>
      ${savedBill.items.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td class="right">${item.quantity} ${item.unitType}</td>
        <td class="right">&#8377;${item.sellingPrice.toFixed(2)}</td>
        <td class="right">&#8377;${item.total.toFixed(2)}</td>
      </tr>`).join("")}
      <tr class="total-row">
        <td colspan="3">Grand Total</td>
        <td class="right">&#8377;${savedBill.grandTotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  <div class="thankyou">Thank you for shopping with us!</div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>
</body>
</html>`;

    const popup = window.open("", "_blank", "width=400,height=600,scrollbars=yes");
    if (popup) {
      popup.document.write(receiptHtml);
      popup.document.close();
    }
  };

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      {/* Main side-by-side layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Counter Terminal ── */}
        <div className="w-[48%] min-w-0 flex flex-col border-r border-border bg-background overflow-y-auto">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Counter Terminal</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScannerOpen(true)}
              className="gap-2 text-sm"
              data-testid="button-open-camera"
            >
              <Camera className="h-4 w-4" />
              Open Camera Scan
            </Button>
          </div>

          {stats && (
            <div className="px-6 py-2 bg-primary/5 text-xs text-muted-foreground border-b border-border flex gap-4">
              <span>Today: <strong className="text-foreground">{stats.todayBills} bills</strong></span>
              <span>Revenue: <strong className="text-primary">₹{stats.todayRevenue.toFixed(2)}</strong></span>
            </div>
          )}

          <div className="px-6 py-5 flex flex-col gap-4 flex-1">
            <div className="space-y-1.5">
              <Label htmlFor="barcode-input" className="text-sm font-medium">
                Barcode ID <span className="text-muted-foreground font-normal">(Scan or type + Enter)</span>
              </Label>
              <Input
                id="barcode-input"
                ref={barcodeInputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Connect scanner and scan..."
                data-testid="input-barcode"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-name-input" className="text-sm font-medium">Product Name</Label>
              <div className="relative">
                <Input
                  id="product-name-input"
                  ref={productNameRef}
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleFieldKeyDown}
                  placeholder="Type product name to search…"
                  autoComplete="off"
                  data-testid="input-product-name"
                />
                {showSuggestions && nameSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
                  >
                    {nameSuggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          fillProduct(p);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/60 border-b border-border/40 last:border-0 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          {p.barcode && <p className="text-xs text-muted-foreground font-mono">{p.barcode}</p>}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-semibold text-primary">₹{p.sellingPrice.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{p.unitType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="selling-price-input" className="text-sm font-medium">Selling Price (₹)</Label>
                <Input
                  id="selling-price-input"
                  type="number"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  onKeyDown={handleFieldKeyDown}
                  placeholder="0.00"
                  data-testid="input-selling-price"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mrp-input" className="text-sm font-medium">MRP (₹)</Label>
                <Input
                  id="mrp-input"
                  type="number"
                  step="0.01"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  onKeyDown={handleFieldKeyDown}
                  placeholder="0.00"
                  data-testid="input-mrp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity-input" className="text-sm font-medium">Quantity</Label>
                <Input
                  id="quantity-input"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={handleFieldKeyDown}
                  placeholder="1"
                  data-testid="input-quantity"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Unit Type</Label>
                <Select value={unitType} onValueChange={setUnitType}>
                  <SelectTrigger data-testid="select-unit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCS">PCS (Pieces)</SelectItem>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="Gram">Gram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Quantity Presets:</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "1 PCS", qty: "1", unit: "PCS" },
                  { label: "1 Kg", qty: "1", unit: "Kg" },
                  { label: "50 g", qty: "50", unit: "Gram" },
                  { label: "100 g", qty: "100", unit: "Gram" },
                ].map((p) => (
                  <Button
                    key={p.label}
                    variant="outline"
                    size="sm"
                    onClick={() => { setQuantity(p.qty); setUnitType(p.unit); }}
                    className="text-xs px-3"
                    data-testid={`button-preset-${p.label.replace(/\s/g, "")}`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleAddItem()}
              className="w-full gap-2 mt-1"
              size="lg"
              data-testid="button-add-item"
            >
              <Plus className="h-4 w-4" />
              Add Item to Bill
            </Button>
          </div>
        </div>

        {/* ── RIGHT: Live Invoice ── */}
        <div className="flex-1 flex flex-col bg-muted/20 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border bg-background">
            <h2 className="text-lg font-bold text-foreground">Live Invoice</h2>
            <div className="text-xs text-muted-foreground text-right">
              <span>Date: {today}</span>
              <span className="ml-3">Shop: My Shop</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted-foreground">
                <ShoppingBag className="h-14 w-14 opacity-20" />
                <p className="font-medium">Receipt is empty</p>
                <p className="text-sm opacity-70">Scan a barcode or enter manually to start calculation</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground px-3 pb-1 border-b border-border">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1"></div>
                </div>
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 items-center bg-background rounded-lg px-3 py-2 border border-border/60 gap-1"
                    data-testid={`row-bill-item-${i}`}
                  >
                    <div className="col-span-5">
                      <p className="font-medium text-sm leading-tight">{item.productName}</p>
                      {item.barcode && <p className="text-xs text-muted-foreground">{item.barcode}</p>}
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItemQty(i, e.target.value)}
                        className="h-7 w-14 text-center text-xs px-1"
                        step="0.01"
                        data-testid={`input-qty-${i}`}
                      />
                      <span className="text-xs text-muted-foreground w-8 shrink-0">{item.unitType}</span>
                    </div>
                    <div className="col-span-2 text-right text-sm">₹{item.sellingPrice.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-semibold text-sm text-primary">₹{item.total.toFixed(2)}</div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(i)}
                        data-testid={`button-remove-item-${i}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">Grand Total</span>
              <span className="text-2xl font-extrabold text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>
            <Button
              size="lg"
              className="w-full gap-2 text-base"
              onClick={handleSaveBill}
              disabled={items.length === 0 || createBill.isPending}
              data-testid="button-save-print"
            >
              <CheckCircle2 className="h-5 w-5" />
              {createBill.isPending ? "Saving..." : "Save Bill"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Receipt Dialog ── */}
      <Dialog open={receiptOpen} onOpenChange={(open) => { if (!open) handleCloseReceipt(); }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border bg-primary/5">
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Bill #{savedBill?.billNumber} Saved Successfully
            </DialogTitle>
          </DialogHeader>

          {/* On-screen receipt preview */}
          {savedBill && (
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              <div className="text-center mb-4 pb-3 border-b border-border">
                <p className="text-base font-bold">My Shop</p>
                <p className="text-xs text-muted-foreground">Bill #{savedBill.billNumber} • {today}</p>
              </div>

              <div className="space-y-1 mb-4">
                <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground pb-1 border-b border-border">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-3 text-right">Qty</div>
                  <div className="col-span-4 text-right">Total</div>
                </div>
                {savedBill.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 py-1.5 text-sm border-b border-border/40 last:border-0">
                    <div className="col-span-5 font-medium">{item.productName}</div>
                    <div className="col-span-3 text-right text-muted-foreground">{item.quantity} {item.unitType}</div>
                    <div className="col-span-4 text-right font-medium">₹{item.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="font-bold text-sm">Grand Total</span>
                <span className="text-xl font-extrabold text-primary">₹{savedBill.grandTotal.toFixed(2)}</span>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-3">Thank you for shopping with us!</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 pb-5 pt-2 flex gap-3 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handlePrint}
              data-testid="button-print-receipt"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              className="flex-1"
              onClick={handleCloseReceipt}
              data-testid="button-new-bill"
            >
              New Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onAddProduct={(product) => {
          setItems((prev) => [...prev, {
            barcode: product.barcode ?? null,
            productName: product.name,
            quantity: 1,
            unitType: product.unitType,
            sellingPrice: product.sellingPrice,
            total: product.sellingPrice,
          }]);
        }}
        onScan={async (bc) => {
          try {
            const product = await getProductByBarcode(bc);
            if (product) {
              setItems((prev) => [...prev, {
                barcode: product.barcode ?? null,
                productName: product.name,
                quantity: 1,
                unitType: product.unitType,
                sellingPrice: product.sellingPrice,
                total: product.sellingPrice,
              }]);
              return { found: true, name: product.name };
            }
            return { found: false };
          } catch {
            return { found: false };
          }
        }}
      />
    </>
  );
}
