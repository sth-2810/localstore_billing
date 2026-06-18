import { useState } from "react";
import { useListBills, useGetBillStats, useDeleteBill, getListBillsQueryKey, getGetBillStatsQueryKey, useGetBill } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function BillsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bills, isLoading } = useListBills();
  const { data: stats } = useGetBillStats();
  const deleteBill = useDeleteBill();

  const [viewBillId, setViewBillId] = useState<number | null>(null);
  const { data: billDetails, isLoading: isLoadingBill } = useGetBill(viewBillId as number, { 
    query: { enabled: !!viewBillId }
  });

  const handleExport = () => {
    window.open('/api/bills/export', '_blank');
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this bill?")) {
      try {
        await deleteBill.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBillStatsQueryKey() });
        toast({ title: "Bill deleted" });
      } catch (err) {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 bg-muted/20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Saved Bills</h1>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{stats?.totalRevenue.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBills || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">₹{stats?.todayRevenue.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayBills || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-accent/50 sticky top-0">
              <TableRow>
                <TableHead className="pl-6">Bill #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">Loading bills...</TableCell>
                </TableRow>
              ) : bills?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No bills saved yet.</TableCell>
                </TableRow>
              ) : (
                bills?.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium pl-6">#{bill.billNumber}</TableCell>
                    <TableCell>{format(new Date(bill.createdAt), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {bill.items.length} items
                    </TableCell>
                    <TableCell className="text-right font-bold">₹{bill.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" onClick={() => setViewBillId(bill.id)} className="h-8 w-8 text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(bill.id)} className="text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!viewBillId} onOpenChange={(open) => !open && setViewBillId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bill Details {billDetails ? `#${billDetails.billNumber}` : ''}</DialogTitle>
          </DialogHeader>
          
          {isLoadingBill || !billDetails ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Date: {format(new Date(billDetails.createdAt), "MMM d, yyyy h:mm a")}
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billDetails.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity} {item.unitType}</TableCell>
                      <TableCell className="text-right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">₹{item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-bold text-lg">Grand Total</span>
                <span className="font-bold text-2xl text-primary">₹{billDetails.grandTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewBillId(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
